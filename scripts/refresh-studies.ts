/**
 * Repasse l'annuaire chez sa source et met les fiches à jour.
 *
 *   pnpm studies:refresh              toutes les fiches
 *   pnpm studies:refresh --since=90   celles relevées il y a plus de 90 jours
 *   pnpm studies:refresh --check      ne rien écrire, sortir en erreur s'il y a du retard
 *   pnpm studies:refresh --limit=10   s'arrêter après dix fiches
 *
 * Pourquoi ce script existe : le contrôle de rétractation de `add-study.ts` ne
 * tourne qu'une fois, au moment de l'ingestion. Une étude entrée propre puis
 * rétractée depuis s'afficherait indéfiniment comme irréprochable, dans un
 * annuaire dont toute la promesse est la fiabilité. `provenance.retrievedAt`
 * datait la fiche sans que rien ne la rafraîchisse jamais.
 *
 * Ce qui est réécrit : ce qui vient de la source et bouge avec le temps —
 * nombre de citations, accès ouvert, résumé, identifiants OpenAlex, date de
 * relevé. Ce qui est conservé : tout l'apport éditorial — rattachement aux
 * thèmes, résumé maison, termes de glossaire, correction de type, date d'ajout.
 * Le partage est le même que dans `writeStudy` et pour la même raison : un
 * rafraîchissement de métadonnées n'est pas une décision éditoriale.
 */
import fs from "node:fs";
import path from "node:path";
import { fromOpenAlex, today, type BibRecord } from "./lib/bib";
import { studySchema, type Study } from "../lib/content/schemas";

const STUDIES_DIR = path.join(process.cwd(), "content", "studies");

/* OpenAlex demande une pause entre les appels du « polite pool ». 150 fiches à
   ce rythme tiennent en une trentaine de secondes, ce qui reste confortable
   pour un travail hebdomadaire. */
const DELAY_MS = 150;

interface Args {
	since: number | null;
	limit: number | null;
	check: boolean;
}

function parseArgs(argv: string[]): Args {
	const args: Args = { since: null, limit: null, check: false };
	for (const raw of argv) {
		const [key, value] = raw.replace(/^--/, "").split("=");
		if (key === "check") args.check = true;
		else if (key === "since" && value) args.since = Number(value);
		else if (key === "limit" && value) args.limit = Number(value);
	}
	if (args.since !== null && !Number.isFinite(args.since)) {
		console.error("\n  ✗ --since attend un nombre de jours\n");
		process.exit(1);
	}
	return args;
}

function daysSince(iso: string): number {
	const then = Date.parse(`${iso}T00:00:00Z`);
	if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
	return Math.floor((Date.now() - then) / 86_400_000);
}

function readStudies(): { file: string; study: Study }[] {
	return fs
		.readdirSync(STUDIES_DIR)
		.filter((name) => name.endsWith(".json"))
		.sort()
		.map((name) => {
			const file = path.join(STUDIES_DIR, name);
			return { file, study: studySchema.parse(JSON.parse(fs.readFileSync(file, "utf8"))) };
		});
}

/** Ce qui a changé, en français, pour le journal de sortie. */
function describeChanges(before: Study, after: Study): string[] {
	const changes: string[] = [];
	if (before.citedByCount !== after.citedByCount) {
		changes.push(`citations ${before.citedByCount ?? "?"} → ${after.citedByCount ?? "?"}`);
	}
	if (before.openAccess.isOpen !== after.openAccess.isOpen) {
		changes.push(after.openAccess.isOpen ? "devenue en accès ouvert" : "n'est plus en accès ouvert");
	}
	if (!before.abstract && after.abstract) changes.push("résumé désormais disponible");
	if (before.referencedWorks.length !== after.referencedWorks.length) {
		changes.push(`références ${before.referencedWorks.length} → ${after.referencedWorks.length}`);
	}
	if (!before.openAlexId && after.openAlexId) changes.push("identifiant OpenAlex renseigné");
	if (before.venue !== after.venue) changes.push(`revue « ${before.venue ?? "—"} » → « ${after.venue ?? "—"} »`);
	return changes;
}

/**
 * Applique les champs de source sur une fiche existante.
 *
 * L'inverse de `writeStudy` : là-bas on part des métadonnées fraîches et on y
 * réinjecte l'éditorial ; ici on part de la fiche et on n'écrase que les champs
 * dont la source est maître. Formulé dans ce sens, l'oubli d'un champ éditorial
 * ne peut pas l'effacer.
 */
function merge(study: Study, record: BibRecord): Study {
	return studySchema.parse({
		...study,
		title: record.title ?? study.title,
		authors: record.authors.length > 0 ? record.authors : study.authors,
		authorCount: record.authorCount || study.authorCount,
		venue: record.venue ?? study.venue,
		publisher: record.publisher ?? study.publisher,
		year: record.year ?? study.year,
		type: study.type,
		abstract: record.abstract ?? study.abstract,
		language: record.language ?? study.language,
		openAccess: record.openAccess,
		citedByCount: record.citedByCount,
		openAlexId: record.openAlexId ?? study.openAlexId,
		referencedWorks:
			record.referencedWorks.length > 0 ? record.referencedWorks : study.referencedWorks,
		sourceTopics: record.sourceTopics.length > 0 ? record.sourceTopics : study.sourceTopics,
		provenance: { source: record.provider, retrievedAt: today() },
	});
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const all = readStudies();

	let due = all;
	if (args.since !== null) {
		due = all.filter(({ study }) => daysSince(study.provenance.retrievedAt) > args.since!);
	}
	if (args.limit !== null) due = due.slice(0, args.limit);

	/* Mode --check : on ne contacte personne, on constate l'âge des fiches. Sert
	   à faire échouer une vérification d'intégrité quand l'annuaire a vieilli
	   sans que personne ne relance le rafraîchissement. */
	if (args.check) {
		const stale = all.filter(
			({ study }) => daysSince(study.provenance.retrievedAt) > (args.since ?? 90)
		);
		const seuil = args.since ?? 90;
		if (stale.length === 0) {
			console.log(`\n  ✓ les ${all.length} fiches ont moins de ${seuil} jours\n`);
			return;
		}
		console.error(`\n  ✗ ${stale.length} fiche(s) sur ${all.length} dépassent ${seuil} jours :\n`);
		for (const { study } of stale.slice(0, 10)) {
			console.error(`      ${daysSince(study.provenance.retrievedAt)} j  ${study.id}`);
		}
		if (stale.length > 10) console.error(`      … et ${stale.length - 10} autres`);
		console.error(`\n  Lancer : pnpm studies:refresh\n`);
		process.exit(1);
	}

	if (due.length === 0) {
		console.log("\n  ✓ rien à rafraîchir\n");
		return;
	}

	console.log(`\n  ${due.length} fiche(s) à repasser chez la source\n`);

	const retracted: Study[] = [];
	const unreachable: string[] = [];
	let touched = 0;

	for (const { file, study } of due) {
		if (!study.doi) {
			// Les rapports institutionnels entrés en --manual n'ont pas de DOI :
			// aucune source ne peut les confirmer, les sauter est le seul choix honnête.
			continue;
		}

		const record = await fromOpenAlex(study.doi);
		await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

		if (!record) {
			unreachable.push(study.id);
			continue;
		}

		/* Le cœur du script. Une rétractation survenue après l'ingestion ne doit
		   pas pouvoir rester silencieuse : on la collecte et on sort en erreur à
		   la fin, après avoir traité le reste pour les signaler toutes d'un coup. */
		if (record.isRetracted) {
			retracted.push(study);
			continue;
		}

		const updated = merge(study, record);
		const changes = describeChanges(study, updated);

		fs.writeFileSync(file, JSON.stringify(updated, null, "\t") + "\n");
		touched += 1;

		if (changes.length > 0) {
			console.log(`  ↻ ${study.id}`);
			for (const change of changes) console.log(`      ${change}`);
		}
	}

	console.log(`\n  ${touched} fiche(s) réécrite(s)`);

	if (unreachable.length > 0) {
		console.log(`\n  ⚠ ${unreachable.length} DOI introuvable(s) chez OpenAlex :`);
		for (const id of unreachable.slice(0, 10)) console.log(`      ${id}`);
		if (unreachable.length > 10) console.log(`      … et ${unreachable.length - 10} autres`);
		console.log("    Fiches laissées en place : une absence de réponse n'est pas un retrait.");
	}

	if (retracted.length > 0) {
		console.error(`\n  ✗ ${retracted.length} publication(s) rétractée(s) depuis leur ingestion :\n`);
		for (const study of retracted) {
			console.error(`      ${study.id}`);
			console.error(`      « ${study.title} »`);
			console.error(`      https://doi.org/${study.doi}\n`);
		}
		console.error("  Ces fiches sont encore en ligne. À retirer de l'annuaire,");
		console.error("  ou à conserver en signalant la rétractation si elle fait partie");
		console.error("  de ce qu'on veut montrer — mais pas à laisser en silence.\n");
		process.exit(1);
	}

	console.log();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
