import { getAllStudies, displayTitle } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths } from "@/lib/content/paths";
import { citationLine } from "@/lib/content/citation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";

const KIND_ORDER: Record<TimelineKind, number> = { path: 0, topic: 1, glossary: 2, study: 3 };

export type TimelineKind = "study" | "topic" | "path" | "glossary";

export interface TimelineItem {
	title: string;
	description: string;
	url: string;
	date: string;
	kind: TimelineKind;
	category: string;
}

/**
 * Tout ce qui est daté dans le corpus, du plus récent au plus ancien.
 *
 * Une seule source pour le flux RSS et la page des nouveautés : les deux
 * répondent à la même question, et deux agrégations parallèles finiraient par
 * diverger sur ce qu'elles considèrent comme une nouveauté.
 *
 * Les études portent leur date d'ajout au corpus, les contenus rédigés leur
 * date de mise à jour — la date de publication d'une étude, elle, est
 * l'information bibliographique, pas la nouveauté.
 */
export function getTimeline(lang: Lang, limit?: number): TimelineItem[] {
	const dict = getDictionary(lang);
	const contentLang = getTopics(lang).length > 0 ? lang : DEFAULT_LANG;

	const items: TimelineItem[] = [
		...getAllStudies().map((study) => ({
			title: displayTitle(study),
			description: study.editorial?.[lang]?.summary ?? citationLine(study),
			url: route(lang, "studies", study.id),
			date: study.addedAt,
			kind: "study" as const,
			category: dict.studies.title,
		})),
		...getTopics(contentLang).map((topic) => ({
			title: topic.frontmatter.title,
			description: topic.frontmatter.description,
			url: route(lang, "topics", topic.slug),
			date: topic.frontmatter.updatedAt,
			kind: "topic" as const,
			category: dict.topics.title,
		})),
		...getPaths(contentLang).map((entry) => ({
			title: entry.frontmatter.title,
			description: entry.frontmatter.description,
			url: route(lang, "paths", entry.slug),
			date: entry.frontmatter.updatedAt,
			kind: "path" as const,
			category: dict.paths.title,
		})),
		...getGlossary(contentLang).map((entry) => ({
			title: entry.frontmatter.term,
			description: entry.frontmatter.shortDefinition,
			url: route(lang, "glossary", entry.slug),
			date: entry.frontmatter.updatedAt,
			kind: "glossary" as const,
			category: dict.glossary.title,
		})),
	].sort(
		(a, b) =>
			b.date.localeCompare(a.date) ||
			// À date égale, l'ordre alphabétique donnait un index plutôt qu'un
			// journal. On suit le poids éditorial : ce qui est rédigé d'abord,
			// les références ensuite.
			KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
			a.title.localeCompare(b.title, lang)
	);

	return limit ? items.slice(0, limit) : items;
}

/** Regroupe la chronologie par jour, en conservant l'ordre décroissant. */
export function groupByDate(items: TimelineItem[]): { date: string; items: TimelineItem[] }[] {
	const groups = new Map<string, TimelineItem[]>();
	for (const item of items) {
		const day = item.date.slice(0, 10);
		const bucket = groups.get(day);
		if (bucket) bucket.push(item);
		else groups.set(day, [item]);
	}
	return [...groups.entries()].map(([date, entries]) => ({ date, items: entries }));
}
