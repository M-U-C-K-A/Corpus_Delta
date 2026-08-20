import { getAllStudies, displayTitle } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths } from "@/lib/content/paths";
import { citationLine } from "@/lib/content/citation";
import { route } from "@/lib/routes";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export type GlobalKind = "study" | "glossary" | "topic" | "path";

export interface GlobalEntry {
	id: string;
	kind: GlobalKind;
	title: string;
	subtitle: string;
	href: string;
	/** Champ de recherche additionnel, jamais affiché. */
	keywords: string;
}

/**
 * Corpus unifié de la palette de recherche.
 *
 * Volontairement léger : titre, sous-titre et mots-clés, sans résumé. La page
 * annuaire garde son propre index, plus riche, parce qu'elle en a besoin pour
 * ses facettes — ici on cherche à atteindre une page, pas à explorer.
 */
export function getGlobalEntries(lang: Lang): GlobalEntry[] {
	const contentLang = getTopics(lang).length > 0 ? lang : DEFAULT_LANG;

	const studies: GlobalEntry[] = getAllStudies().map((study) => ({
		id: `study:${study.id}`,
		kind: "study",
		title: displayTitle(study),
		subtitle: citationLine(study),
		href: route(lang, "studies", study.id),
		keywords: [study.title, study.authors.map((a) => a.name).join(" "), study.venue ?? ""].join(" "),
	}));

	const glossary: GlobalEntry[] = getGlossary(contentLang).map((entry) => ({
		id: `glossary:${entry.slug}`,
		kind: "glossary",
		title: entry.frontmatter.term,
		subtitle: entry.frontmatter.shortDefinition,
		href: route(lang, "glossary", entry.slug),
		keywords: entry.frontmatter.synonyms.join(" "),
	}));

	const topics: GlobalEntry[] = getTopics(contentLang).map((entry) => ({
		id: `topic:${entry.slug}`,
		kind: "topic",
		title: entry.frontmatter.title,
		subtitle: entry.frontmatter.description,
		href: route(lang, "topics", entry.slug),
		keywords: entry.frontmatter.themes.join(" "),
	}));

	const paths: GlobalEntry[] = getPaths(contentLang).map((entry) => ({
		id: `path:${entry.slug}`,
		kind: "path",
		title: entry.frontmatter.title,
		subtitle: entry.frontmatter.description,
		href: route(lang, "paths", entry.slug),
		keywords: entry.frontmatter.themes.join(" "),
	}));

	// Les parcours d'abord : sur une requête large, c'est la meilleure porte d'entrée.
	return [...paths, ...topics, ...glossary, ...studies];
}
