/**
 * Ajoute une étude à l'annuaire depuis son DOI.
 *
 *   pnpm study:add 10.5194/essd-15-5301-2023 --themes=carbone,observation
 *   pnpm study:add --manual --title="..." --url=... --year=2023 --publisher="GIEC" --themes=politiques
 *
 * Les métadonnées bibliographiques proviennent d'OpenAlex, avec Crossref en repli.
 * Elles ne sont jamais saisies à la main : c'est ce qui garantit qu'aucune référence
 * de l'annuaire n'est inventée. Le rattachement aux thèmes maison, lui, est éditorial
 * et donc explicitement demandé à l'appelant.
 */
import fs from "node:fs";
import path from "node:path";
import {
	fromCrossref,
	fromOpenAlex,
	today,
	type BibRecord,
} from "./lib/bib";
import { studySchema, type Study } from "../lib/content/schemas";
import { THEME_IDS, isThemeId } from "../lib/content/taxonomy";
import { studyIdFrom } from "../lib/content/slug";

const STUDIES_DIR = path.join(process.cwd(), "content", "studies");

interface Args {
	/** Arguments positionnels : les DOI. */
	_: string[];
	[flag: string]: string | boolean | string[];
}

function parseArgs(argv: string[]): Args {
	const args: Args = { _: [] };
	for (const raw of argv) {
		if (raw.startsWith("--")) {
			const [key, ...rest] = raw.slice(2).split("=");
			args[key] = rest.length ? rest.join("=") : true;
		} else {
			args._.push(raw);
		}
	}
	return args;
}

function fail(message: string): never {
	console.error(`\n  ✗ ${message}\n`);
	process.exit(1);
}

function parseThemes(raw: unknown): string[] {
	if (typeof raw !== "string" || raw.trim() === "") {
		fail(`--themes est obligatoire. Valeurs possibles : ${THEME_IDS.join(", ")}`);
	}
	const themes = (raw as string)
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
	const unknown = themes.filter((t) => !isThemeId(t));
	if (unknown.length > 0) {
		fail(`Thème inconnu : ${unknown.join(", ")}. Valeurs possibles : ${THEME_IDS.join(", ")}`);
	}
	return themes;
}

function writeStudy(study: Study, force: boolean): void {
	fs.mkdirSync(STUDIES_DIR, { recursive: true });
	const file = path.join(STUDIES_DIR, `${study.id}.json`);

	if (fs.existsSync(file) && !force) {
		const existing = JSON.parse(fs.readFileSync(file, "utf8")) as Study;
		// Le travail rédactionnel ne doit jamais être écrasé par un rafraîchissement
		// des métadonnées : on le réinjecte dans la nouvelle version.
		study.editorial = { ...study.editorial, ...existing.editorial };
		study.glossaryTerms = existing.glossaryTerms?.length ? existing.glossaryTerms : study.glossaryTerms;
		study.addedAt = existing.addedAt ?? study.addedAt;
		// La correction de type est une décision éditoriale : un rafraîchissement
		// des métadonnées ne doit pas la reprendre à la source qui l'a motivée.
		if (existing.typeOverride) study.typeOverride = existing.typeOverride;
		console.log(`  ↻ mise à jour (apport rédactionnel conservé)`);
	}

	fs.writeFileSync(file, JSON.stringify(study, null, "\t") + "\n");
	console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
}

async function addFromDoi(rawDoi: string, themes: string[], force: boolean): Promise<void> {
	const doi = rawDoi
		.trim()
		.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
		.replace(/^doi:/i, "");

	if (!/^10\.\d{4,9}\/\S+$/.test(doi)) fail(`DOI mal formé : ${rawDoi}`);

	console.log(`\n  ${doi}`);
	let record: BibRecord | null = await fromOpenAlex(doi);

	/*
	  Un article rétracté n'a rien à faire dans un annuaire qui prétend orienter
	  vers de la littérature fiable, et le titre ne le signale pas toujours. On
	  refuse ici plutôt que de laisser le repli Crossref, qui ne porte pas cette
	  information, le faire passer silencieusement.
	*/
	if (record?.isRetracted) {
		fail(`Publication rétractée d'après OpenAlex : ${doi}\n  « ${record.title ?? "sans titre"} »`);
	}

	if (!record) {
		console.log("  · absent d'OpenAlex, tentative Crossref");
		record = await fromCrossref(doi);
	}
	if (!record) fail(`Aucune métadonnée trouvée pour ${doi}. Vérifier le DOI.`);
	if (!record.title) fail(`Métadonnées sans titre pour ${doi}, saisie interrompue.`);
	if (!record.year) fail(`Métadonnées sans année de publication pour ${doi}.`);

	// Crossref ne renseigne pas l'accès ouvert : plutôt que de laisser un faux « fermé »,
	// on complète depuis Unpaywall via OpenAlex si le résumé seul manquait.
	if (record.provider === "crossref") {
		const oa = await fromOpenAlex(doi);
		if (oa) record.openAccess = oa.openAccess;
	}

	const study = studySchema.parse({
		id: studyIdFrom(record.authors[0]?.name, record.year, record.title),
		doi,
		title: record.title,
		authors: record.authors,
		authorCount: record.authorCount,
		venue: record.venue,
		publisher: record.publisher,
		year: record.year,
		type: record.type,
		abstract: record.abstract,
		language: record.language,
		openAccess: record.openAccess,
		citedByCount: record.citedByCount,
		openAlexId: record.openAlexId,
		referencedWorks: record.referencedWorks,
		themes,
		sourceTopics: record.sourceTopics,
		url: `https://doi.org/${doi}`,
		provenance: { source: record.provider, retrievedAt: today() },
		addedAt: today(),
		editorial: {},
		glossaryTerms: [],
	});

	console.log(`  « ${study.title} »`);
	console.log(`  ${study.authors[0]?.name ?? "?"}${study.authorCount > 1 ? ` et ${study.authorCount - 1} autres` : ""} · ${study.venue ?? "sans revue"} · ${study.year}`);
	if (!study.abstract) console.log("  ⚠ résumé indisponible chez l'éditeur — la fiche renverra au DOI");

	writeStudy(study, force);
}

/** Rapports institutionnels (GIEC, OMM, Copernicus) rarement indexés par DOI exploitable. */
async function addManual(args: Args, themes: string[], force: boolean): Promise<void> {
	const title = args.title;
	const url = args.url;
	const year = args.year;

	if (typeof title !== "string" || typeof url !== "string" || typeof year !== "string") {
		fail("Le mode --manual exige --title, --url et --year (et accepte --publisher, --type, --doi).");
	}
	try {
		new URL(url);
	} catch {
		fail(`URL invalide : ${url}`);
	}

	const publisher = typeof args.publisher === "string" ? args.publisher : null;
	const study = studySchema.parse({
		id: studyIdFrom(publisher ?? "rapport", Number(year), title),
		doi: typeof args.doi === "string" ? args.doi : null,
		title,
		authors: publisher ? [{ name: publisher }] : [],
		authorCount: publisher ? 1 : 0,
		venue: publisher,
		publisher,
		year: Number(year),
		type: typeof args.type === "string" ? args.type : "report",
		abstract: typeof args.abstract === "string" ? args.abstract : null,
		language: typeof args.language === "string" ? args.language : null,
		openAccess: { isOpen: true, status: "public", url },
		citedByCount: null,
		openAlexId: null,
		referencedWorks: [],
		themes,
		sourceTopics: [],
		url,
		provenance: { source: "manual", retrievedAt: today() },
		addedAt: today(),
		editorial: {},
		glossaryTerms: [],
	});

	console.log(`\n  « ${study.title} » (saisie manuelle)`);
	writeStudy(study, force);
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const themes = parseThemes(args.themes);
	const force = args.force === true;

	if (args.manual) {
		await addManual(args, themes, force);
		return;
	}

	if (args._.length === 0) {
		fail("Indiquer au moins un DOI, ou utiliser --manual.");
	}

	for (const doi of args._) {
		await addFromDoi(doi, themes, force);
		// Les deux API tolèrent bien plus, mais rien ne presse sur une ingestion manuelle.
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	console.log();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

