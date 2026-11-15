/**
 * Vérifie l'intégrité du contenu avant le build (`prebuild`).
 *
 * Deux familles de problèmes sont traquées : les fichiers qui ne respectent pas
 * leur schéma, et les renvois cassés entre collections — un dossier qui cite une
 * étude absente, une définition qui pointe vers un terme supprimé. Ces liens sont
 * l'ossature du site ; les laisser pourrir en silence viderait les pages de leur
 * intérêt sans jamais provoquer d'erreur visible.
 */
import fs from "node:fs";
import path from "node:path";
import { getAllStudies } from "../lib/content/studies";
import { getGlossary } from "../lib/content/glossary";
import { getTopics } from "../lib/content/topics";
import { getDomains } from "../lib/content/domains";
import { FIGURE_NAMES, isFigureName } from "../components/iso/registry";
import { getPaths } from "../lib/content/paths";
import { datasetSchema } from "../lib/content/schemas";
import { LANGS } from "../lib/i18n/config";

/**
 * Variantes acceptées par `<Callout>`. Une variante inconnue ne se voit ni au
 * typage — le MDX n'est pas typé — ni en développement, où la page affiche
 * simplement une erreur : elle ne se manifeste qu'au prérendu du build, par une
 * pile d'appels minifiée illisible. On la rattrape donc ici.
 */
const CALLOUT_VARIANTS = new Set(["info", "caution", "uncertainty", "key"]);

const problems: string[] = [];

function report(where: string, message: string): void {
	problems.push(`${where} — ${message}`);
}

/** Contrôles qui valent pour tout corps MDX, quelle que soit la collection. */
function validateMdxBody(where: string, content: string): void {
	for (const match of content.matchAll(/<Callout\s+[^>]*variant="([^"]+)"/g)) {
		if (!CALLOUT_VARIANTS.has(match[1])) {
			report(
				where,
				`<Callout variant="${match[1]}"> inconnu (attendu : ${[...CALLOUT_VARIANTS].join(", ")})`
			);
		}
	}
}

function validateDatasets(): number {
	const dir = path.join(process.cwd(), "data", "datasets");
	if (!fs.existsSync(dir)) return 0;

	const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
	for (const file of files) {
		const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
		const parsed = datasetSchema.safeParse(raw);
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				report(`data/datasets/${file}`, `${issue.path.join(".")} : ${issue.message}`);
			}
			continue;
		}
		if (parsed.data.id !== file.replace(/\.json$/, "")) {
			report(`data/datasets/${file}`, `le champ id (« ${parsed.data.id} ») doit reprendre le nom du fichier`);
		}
		// Chaque série doit exister dans les données, sinon le graphique s'affiche vide.
		for (const series of parsed.data.series) {
			const present = parsed.data.rows.some((row) => row[series.key] !== undefined);
			if (!present) report(`data/datasets/${file}`, `la série « ${series.key} » n'apparaît dans aucune ligne`);
		}
	}
	return files.length;
}

function main(): void {
	let studies: ReturnType<typeof getAllStudies> = [];
	try {
		studies = getAllStudies();
	} catch (error) {
		console.error(`\n✗ ${(error as Error).message}\n`);
		process.exit(1);
	}

	const studyIds = new Set(studies.map((s) => s.id));

	// Un même DOI référencé deux fois signale une ingestion en double.
	const seenDois = new Map<string, string>();
	for (const study of studies) {
		if (!study.doi) continue;
		const previous = seenDois.get(study.doi);
		if (previous) report(`content/studies/${study.id}.json`, `DOI déjà référencé par ${previous}`);
		else seenDois.set(study.doi, study.id);
	}

	let glossaryCount = 0;
	let topicCount = 0;
	let pathCount = 0;
	let domainCount = 0;

	for (const lang of LANGS) {
		let glossary: ReturnType<typeof getGlossary> = [];
		let topics: ReturnType<typeof getTopics> = [];
		let paths: ReturnType<typeof getPaths> = [];
		let domains: ReturnType<typeof getDomains> = [];
		try {
			glossary = getGlossary(lang);
			topics = getTopics(lang);
			paths = getPaths(lang);
			domains = getDomains(lang);
		} catch (error) {
			console.error(`\n✗ ${(error as Error).message}\n`);
			process.exit(1);
		}

		glossaryCount += glossary.length;
		topicCount += topics.length;
		pathCount += paths.length;
		domainCount += domains.length;

		const termSlugs = new Set(glossary.map((entry) => entry.slug));
		const topicSlugs = new Set(topics.map((entry) => entry.slug));

		for (const entry of glossary) {
			const where = `content/glossary/${lang}/${entry.slug}.mdx`;
			validateMdxBody(where, entry.content);
			for (const related of entry.frontmatter.related) {
				if (!termSlugs.has(related)) report(where, `renvoie vers le terme inconnu « ${related} »`);
			}
			for (const id of entry.frontmatter.studies) {
				if (!studyIds.has(id)) report(where, `cite l'étude inconnue « ${id} »`);
			}
		}

		for (const topic of topics) {
			const where = `content/topics/${lang}/${topic.slug}.mdx`;
			validateMdxBody(where, topic.content);
			for (const id of topic.frontmatter.studies) {
				if (!studyIds.has(id)) report(where, `cite l'étude inconnue « ${id} »`);
			}
			for (const term of topic.frontmatter.glossary) {
				if (!termSlugs.has(term)) report(where, `renvoie vers le terme inconnu « ${term} »`);
			}
			// Les composants <Cite id="…"> doivent eux aussi désigner une étude existante.
			for (const match of topic.content.matchAll(/<Cite\s+[^>]*id="([^"]+)"/g)) {
				if (!studyIds.has(match[1])) report(where, `<Cite id="${match[1]}"> ne correspond à aucune étude`);
			}
			// Idem pour les graphiques : un identifiant de jeu de données erroné passe inaperçu.
			for (const match of topic.content.matchAll(/<Chart\s+[^>]*dataset="([^"]+)"/g)) {
				const file = path.join(process.cwd(), "data", "datasets", `${match[1]}.json`);
				if (!fs.existsSync(file)) report(where, `<Chart dataset="${match[1]}"> : jeu de données introuvable`);
			}
		}

		const datasetExists = (id: string) =>
			fs.existsSync(path.join(process.cwd(), "data", "datasets", `${id}.json`));

		for (const domain of domains) {
			const where = `content/domains/${lang}/${domain.slug}.mdx`;
			validateMdxBody(where, domain.content);

			for (const id of domain.frontmatter.studies) {
				if (!studyIds.has(id)) report(where, `cite l'étude inconnue « ${id} »`);
			}
			for (const term of domain.frontmatter.glossary) {
				if (!termSlugs.has(term)) report(where, `renvoie vers le terme inconnu « ${term} »`);
			}

			// Le bandeau de vedettes est rendu avant toute prose : une série
			// manquante y laisse un trou en haut de page, pas au milieu du texte.
			for (const headline of domain.frontmatter.headline) {
				if (!datasetExists(headline.dataset)) {
					report(where, `vedette « ${headline.dataset} » : jeu de données introuvable`);
				}
			}

			for (const match of domain.content.matchAll(/<Cite\s+[^>]*id="([^"]+)"/g)) {
				if (!studyIds.has(match[1])) report(where, `<Cite id="${match[1]}"> ne correspond à aucune étude`);
			}
			for (const match of domain.content.matchAll(/<Term\s+[^>]*id="([^"]+)"/g)) {
				if (!termSlugs.has(match[1])) report(where, `<Term id="${match[1]}"> ne correspond à aucun terme`);
			}
			for (const match of domain.content.matchAll(/<(?:Chart|DecadeBars)\s+[^>]*dataset="([^"]+)"/g)) {
				if (!datasetExists(match[1])) report(where, `dataset="${match[1]}" : jeu de données introuvable`);
			}
			// `<Indicators ids="a,b,c">` porte plusieurs identifiants d'un coup.
			for (const match of domain.content.matchAll(/<Indicators\s+[^>]*ids="([^"]+)"/g)) {
				for (const id of match[1].split(",").map((item) => item.trim()).filter(Boolean)) {
					if (!datasetExists(id)) report(where, `<Indicators> : jeu de données « ${id} » introuvable`);
				}
			}
			for (const match of domain.content.matchAll(/<Mechanism\s+[^>]*name="([^"]+)"/g)) {
				if (!isFigureName(match[1])) {
					report(
						where,
						`<Mechanism name="${match[1]}"> inconnu (disponibles : ${FIGURE_NAMES.join(", ")})`
					);
				}
			}
		}

		// Un parcours dont une étape pointe dans le vide perd tout son intérêt :
		// l'ordre des étapes est précisément ce qu'il apporte.
		for (const entry of paths) {
			const where = `content/paths/${lang}/${entry.slug}.mdx`;
			entry.frontmatter.steps.forEach((step, index) => {
				const exists =
					step.kind === "glossary"
						? termSlugs.has(step.id)
						: step.kind === "topic"
							? topicSlugs.has(step.id)
							: studyIds.has(step.id);
				if (!exists) {
					report(where, `étape ${index + 1} : ${step.kind} « ${step.id} » introuvable`);
				}
			});
		}

		for (const study of studies) {
			for (const term of study.glossaryTerms) {
				if (lang === "fr" && !termSlugs.has(term)) {
					report(`content/studies/${study.id}.json`, `renvoie vers le terme inconnu « ${term} »`);
				}
			}
		}
	}

	const datasetCount = validateDatasets();

	if (problems.length > 0) {
		console.error(`\n✗ ${problems.length} problème(s) de contenu :\n`);
		for (const problem of problems) console.error(`  · ${problem}`);
		console.error();
		process.exit(1);
	}

	console.log(
		`✓ contenu valide — ${studies.length} étude(s), ${glossaryCount} terme(s), ${topicCount} dossier(s), ${domainCount} domaine(s), ${pathCount} parcours, ${datasetCount} jeu(x) de données`
	);
}

main();
