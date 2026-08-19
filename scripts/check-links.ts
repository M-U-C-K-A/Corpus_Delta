/**
 * Vérifie que les liens sortants du corpus répondent encore.
 *
 * Délibérément hors du build : un DOI momentanément injoignable ne doit pas
 * empêcher un déploiement. À lancer périodiquement (`pnpm links:check`).
 *
 * Les grands éditeurs scientifiques (Elsevier, AAAS, Wiley, PNAS) refusent les
 * clients non-navigateurs avec un 403. Ces réponses sont donc classées à part :
 * les confondre avec des liens morts rendrait le rapport inutilisable, puisque
 * la majorité du corpus est hébergée chez ces éditeurs.
 */
import { getAllStudies } from "../lib/content/studies";
import { getGlossary } from "../lib/content/glossary";
import { getTopics } from "../lib/content/topics";
import { LANGS } from "../lib/i18n/config";

interface Target {
	url: string;
	where: string;
}

type Verdict = "ok" | "broken" | "blocked" | "unreachable";

interface Result {
	target: Target;
	verdict: Verdict;
	detail: string;
}

const CONCURRENCY = 6;
const TIMEOUT_MS = 20_000;

/** Un agent réaliste : sans lui, presque tous les éditeurs renvoient 403. */
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function classify(status: number): { verdict: Verdict; detail: string } {
	if (status < 400) return { verdict: "ok", detail: String(status) };
	// 401/403/429 : le serveur répond, mais refuse ce client. Le lien existe.
	if (status === 401 || status === 403 || status === 429) {
		return { verdict: "blocked", detail: `${status} — accès refusé au robot` };
	}
	if (status >= 500) return { verdict: "unreachable", detail: `${status} — erreur serveur` };
	return { verdict: "broken", detail: String(status) };
}

async function check(target: Target): Promise<Result> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		// Beaucoup d'éditeurs refusent HEAD : on part sur GET en coupant dès les en-têtes.
		const response = await fetch(target.url, {
			method: "GET",
			redirect: "follow",
			signal: controller.signal,
			headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,*/*" },
		});
		await response.body?.cancel();
		const { verdict, detail } = classify(response.status);
		return { target, verdict, detail };
	} catch (error) {
		const aborted = (error as Error).name === "AbortError";
		return {
			target,
			verdict: "unreachable",
			detail: aborted ? "délai dépassé" : "injoignable",
		};
	} finally {
		clearTimeout(timer);
	}
}

function collectTargets(): Target[] {
	const targets: Target[] = [];

	for (const study of getAllStudies()) {
		targets.push({ url: study.url, where: `étude ${study.id}` });
		if (study.openAccess.url && study.openAccess.url !== study.url) {
			targets.push({ url: study.openAccess.url, where: `étude ${study.id} (accès ouvert)` });
		}
	}

	for (const lang of LANGS) {
		for (const entry of getGlossary(lang)) {
			for (const source of entry.frontmatter.sources) {
				targets.push({ url: source.url, where: `glossaire ${lang}/${entry.slug}` });
			}
		}
		for (const topic of getTopics(lang)) {
			for (const source of topic.frontmatter.sources) {
				targets.push({ url: source.url, where: `dossier ${lang}/${topic.slug}` });
			}
		}
	}

	// Une même URL peut être citée à plusieurs endroits : inutile de la tester deux fois.
	const seen = new Set<string>();
	return targets.filter((target) => {
		if (seen.has(target.url)) return false;
		seen.add(target.url);
		return true;
	});
}

const MARKS: Record<Verdict, string> = { ok: ".", blocked: "~", unreachable: "?", broken: "×" };

function section(title: string, results: Result[]): void {
	if (results.length === 0) return;
	console.log(`  ${title} (${results.length})\n`);
	for (const { target, detail } of results) {
		console.log(`  · [${detail}] ${target.where}\n    ${target.url}`);
	}
	console.log();
}

async function main(): Promise<void> {
	const targets = collectTargets();
	console.log(`\n  ${targets.length} lien(s) à vérifier\n`);

	const results: Result[] = [];
	const queue = [...targets];

	async function worker(): Promise<void> {
		while (queue.length > 0) {
			const target = queue.shift();
			if (!target) return;
			const result = await check(target);
			process.stdout.write(MARKS[result.verdict]);
			results.push(result);
		}
	}

	await Promise.all(Array.from({ length: CONCURRENCY }, worker));
	console.log("\n");

	const broken = results.filter((r) => r.verdict === "broken");
	const unreachable = results.filter((r) => r.verdict === "unreachable");
	const blocked = results.filter((r) => r.verdict === "blocked");
	const ok = results.filter((r) => r.verdict === "ok").length;

	section("Liens morts — à corriger", broken);
	section("Injoignables au moment du contrôle — à revérifier", unreachable);
	section("Accès refusé au robot — le lien existe, l'éditeur filtre", blocked);

	console.log(
		`  ${ok} valide(s) · ${blocked.length} filtré(s) · ${unreachable.length} injoignable(s) · ${broken.length} mort(s)\n`
	);

	// Seuls les liens réellement morts justifient un échec : le reste demande un œil humain.
	if (broken.length > 0) process.exitCode = 1;
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
