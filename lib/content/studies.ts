import fs from "node:fs";
import path from "node:path";
import { studySchema, type Study } from "@/lib/content/schemas";
import type { ThemeId } from "@/lib/content/taxonomy";
import type { Lang } from "@/lib/i18n/config";

const STUDIES_DIR = path.join(process.cwd(), "content", "studies");

let cache: Study[] | null = null;

/**
 * Charge et valide l'ensemble de l'annuaire.
 *
 * La validation a lieu ici, au chargement, et pas seulement dans le script de
 * vérification : une fiche corrompue doit faire échouer le build plutôt que
 * produire une page à moitié vide.
 */
export function getAllStudies(): Study[] {
	if (cache) return cache;

	if (!fs.existsSync(STUDIES_DIR)) {
		cache = [];
		return cache;
	}

	const studies = fs
		.readdirSync(STUDIES_DIR)
		.filter((file) => file.endsWith(".json"))
		.map((file) => {
			const raw = JSON.parse(fs.readFileSync(path.join(STUDIES_DIR, file), "utf8"));
			const parsed = studySchema.safeParse(raw);
			if (!parsed.success) {
				throw new Error(
					`Fiche d'étude invalide : content/studies/${file}\n${parsed.error.issues
						.map((i) => `  · ${i.path.join(".")} — ${i.message}`)
						.join("\n")}`
				);
			}
			return parsed.data;
		});

	cache = studies.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "fr"));
	return cache;
}

export function getStudy(id: string): Study | null {
	return getAllStudies().find((study) => study.id === id) ?? null;
}

export function getStudies(ids: readonly string[]): Study[] {
	const byId = new Map(getAllStudies().map((study) => [study.id, study]));
	return ids.map((id) => byId.get(id)).filter((study): study is Study => Boolean(study));
}

export function getStudiesByTheme(theme: ThemeId): Study[] {
	return getAllStudies().filter((study) => study.themes.includes(theme));
}

/** Titre à afficher dans une liste : abrégé si l'entrée en définit un. */
export function displayTitle(study: Study): string {
	return study.shortTitle ?? study.title;
}

/** Comptages réels pour les facettes et les compteurs de l'accueil. */
export function getCorpusStats() {
	const studies = getAllStudies();
	const themeCounts = new Map<string, number>();
	const yearCounts = new Map<number, number>();
	const typeCounts = new Map<string, number>();

	for (const study of studies) {
		for (const theme of study.themes) {
			themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
		}
		yearCounts.set(study.year, (yearCounts.get(study.year) ?? 0) + 1);
		typeCounts.set(study.type, (typeCounts.get(study.type) ?? 0) + 1);
	}

	return {
		total: studies.length,
		openAccess: studies.filter((s) => s.openAccess.isOpen).length,
		themeCounts,
		yearCounts,
		typeCounts,
		yearRange: studies.length
			? { from: Math.min(...studies.map((s) => s.year)), to: Math.max(...studies.map((s) => s.year)) }
			: null,
		lastAddedAt: studies.map((s) => s.addedAt).sort().at(-1) ?? null,
	};
}

/** Études partageant au moins un thème, les plus proches d'abord. */
export function getRelatedStudies(study: Study, limit = 4): Study[] {
	return getAllStudies()
		.filter((candidate) => candidate.id !== study.id)
		.map((candidate) => ({
			study: candidate,
			shared: candidate.themes.filter((theme) => study.themes.includes(theme)).length,
		}))
		.filter(({ shared }) => shared > 0)
		.sort((a, b) => b.shared - a.shared || b.study.year - a.study.year)
		.slice(0, limit)
		.map(({ study: related }) => related);
}

export function getEditorial(study: Study, lang: Lang) {
	return study.editorial?.[lang] ?? null;
}

export type { Study };
