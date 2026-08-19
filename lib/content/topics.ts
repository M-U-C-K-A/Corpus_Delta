import { topicFrontmatterSchema, type TopicFrontmatter } from "@/lib/content/schemas";
import { readCollection, readEntry, type MdxEntry } from "@/lib/content/mdx-source";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export type TopicEntry = MdxEntry<TopicFrontmatter>;

const caches = new Map<Lang, TopicEntry[]>();

const isPublished = (entry: TopicEntry) =>
	!entry.frontmatter.draft || process.env.NODE_ENV === "development";

export function getTopics(lang: Lang): TopicEntry[] {
	const cached = caches.get(lang);
	if (cached) return cached;

	const entries = readCollection("topics", lang, topicFrontmatterSchema)
		.filter(isPublished)
		.sort((a, b) => b.frontmatter.updatedAt.localeCompare(a.frontmatter.updatedAt));

	caches.set(lang, entries);
	return entries;
}

export function getTopic(lang: Lang, slug: string): TopicEntry | null {
	const entry = readEntry("topics", lang, slug, topicFrontmatterSchema);
	if (!entry || !isPublished(entry)) return null;
	return entry;
}

export function getTopicsWithFallback(lang: Lang): { entries: TopicEntry[]; fallback: boolean } {
	const entries = getTopics(lang);
	if (entries.length > 0) return { entries, fallback: false };
	return { entries: getTopics(DEFAULT_LANG), fallback: lang !== DEFAULT_LANG };
}

/** Dossiers citant une étude donnée, pour le renvoi depuis la fiche d'annuaire. */
export function getTopicsCitingStudy(lang: Lang, studyId: string): TopicEntry[] {
	return getTopics(lang).filter((topic) => topic.frontmatter.studies.includes(studyId));
}

export function getTopicsUsingTerm(lang: Lang, termSlug: string): TopicEntry[] {
	return getTopics(lang).filter((topic) => topic.frontmatter.glossary.includes(termSlug));
}
