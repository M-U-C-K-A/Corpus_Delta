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
import { siteConfig } from "../lib/site-config";
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

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** OpenAlex livre les résumés sous forme d'index inversé mot → positions. */
function reconstructAbstract(index: Record<string, number[]> | null | undefined): string | null {
	if (!index) return null;
	const words: string[] = [];
	for (const [word, positions] of Object.entries(index)) {
		for (const position of positions) words[position] = word;
	}
	const text = words.join(" ").replace(/\s+/g, " ").trim();
	return text.length > 0 ? text : null;
}

/** Crossref renvoie des résumés en JATS : on retire le balisage sans réécrire le texte. */
function stripJats(abstract: string | null | undefined): string | null {
	if (!abstract) return null;
	const text = abstract
		.replace(/<[^>]+>/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > 0 ? text : null;
}

const TYPE_MAP: Record<string, Study["type"]> = {
	article: "article",
	"journal-article": "article",
	review: "review",
	report: "report",
	preprint: "preprint",
	dataset: "dataset",
	"book-chapter": "chapter",
	"posted-content": "preprint",
	monograph: "chapter",
};

function mapType(raw: string | null | undefined): Study["type"] {
	if (!raw) return "article";
	return TYPE_MAP[raw] ?? "article";
}

/** Métadonnées normalisées, quelle que soit la base d'origine. */
interface BibRecord {
	title: string | null;
	authors: { name: string; orcid?: string; affiliation?: string }[];
	authorCount: number;
	venue: string | null;
	publisher: string | null;
	year: number | null;
	type: Study["type"];
	abstract: string | null;
	language: string | null;
	openAccess: { isOpen: boolean; status: string | null; url: string | null };
	citedByCount: number | null;
	sourceTopics: string[];
	provider: "openalex" | "crossref";
}

async function fetchJson(url: string): Promise<any | null> {
	const response = await fetch(url, {
		headers: {
			"User-Agent": `${siteConfig.name} (${siteConfig.url}; mailto:${siteConfig.contactEmail})`,
			Accept: "application/json",
		},
	});
	if (!response.ok) return null;
	return response.json();
}

/**
 * Vérifie l'URL d'accès ouvert renvoyée par la source.
 *
 * OpenAlex sert parfois une URL malformée — celle du budget méthane 2025 se
 * terminait par « >, », vestige d'un parsage de bibliographie, et renvoyait 404.
 * Reproduire fidèlement une métadonnée n'oblige pas à publier un lien cassé :
 * on écarte l'URL, le DOI restant de toute façon le chemin d'accès principal.
 */
function cleanOaUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	// Les chevrons et espaces ne peuvent pas appartenir à une URL : leur présence
	// signale un fragment de texte capté par erreur, pas un lien tronqué.
	if (/[<>\s]/.test(trimmed)) return null;

	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
	} catch {
		return null;
	}
}

async function fromOpenAlex(doi: string): Promise<BibRecord | null> {
	const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?mailto=${encodeURIComponent(siteConfig.contactEmail)}`;
	const work = await fetchJson(url);
	if (!work || work.error) return null;

	/*
	  Un article rétracté n'a rien à faire dans un annuaire qui prétend orienter
	  vers de la littérature fiable, et le titre ne le signale pas toujours. On
	  refuse ici plutôt que de laisser le repli Crossref, qui ne porte pas cette
	  information, le faire passer silencieusement.
	*/
	if (work.is_retracted) {
		throw new Error(
			`Publication rétractée d'après OpenAlex : ${doi}\n  « ${work.title ?? "sans titre"} »`
		);
	}

	const source = work.primary_location?.source ?? null;
	const authorships: any[] = work.authorships ?? [];

	return {
		title: work.title as string | null,
		// Au-delà de 20 auteurs, la liste complète n'apporte plus rien à l'affichage :
		// on conserve le décompte réel séparément pour ne pas laisser croire à une troncature.
		authors: authorships.slice(0, 20).map((a) => ({
			name: a.author?.display_name as string,
			...(a.author?.orcid ? { orcid: a.author.orcid as string } : {}),
			...(a.institutions?.[0]?.display_name
				? { affiliation: a.institutions[0].display_name as string }
				: {}),
		})),
		authorCount: authorships.length,
		venue: (source?.display_name as string) ?? null,
		publisher: (source?.host_organization_name as string) ?? null,
		year: work.publication_year as number | null,
		type: mapType(work.type),
		abstract: reconstructAbstract(work.abstract_inverted_index),
		language: (work.language as string) ?? null,
		openAccess: {
			isOpen: Boolean(work.open_access?.is_oa),
			status: (work.open_access?.oa_status as string) ?? null,
			url: cleanOaUrl(work.open_access?.oa_url),
		},
		citedByCount: (work.cited_by_count as number) ?? null,
		sourceTopics: ((work.topics ?? []) as any[]).map((t) => t.display_name as string),
		provider: "openalex" as const,
	};
}

async function fromCrossref(doi: string): Promise<BibRecord | null> {
	const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(siteConfig.contactEmail)}`;
	const payload = await fetchJson(url);
	const work = payload?.message;
	if (!work) return null;

	const authors: any[] = work.author ?? [];

	return {
		title: (work.title?.[0] as string) ?? null,
		authors: authors.slice(0, 20).map((a) => ({
			name: [a.given, a.family].filter(Boolean).join(" ") || (a.name as string) || "—",
			...(a.ORCID ? { orcid: a.ORCID as string } : {}),
		})),
		authorCount: authors.length,
		venue: (work["container-title"]?.[0] as string) ?? null,
		publisher: (work.publisher as string) ?? null,
		year: (work.issued?.["date-parts"]?.[0]?.[0] as number) ?? null,
		type: mapType(work.type),
		abstract: stripJats(work.abstract),
		language: (work.language as string) ?? null,
		openAccess: { isOpen: false, status: null, url: null },
		citedByCount: (work["is-referenced-by-count"] as number) ?? null,
		sourceTopics: ((work.subject ?? []) as string[]) ?? [],
		provider: "crossref" as const,
	};
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
	let record = await fromOpenAlex(doi);
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

