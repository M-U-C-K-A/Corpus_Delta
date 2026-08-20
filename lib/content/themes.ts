import { getStudiesByTheme, type Study } from "@/lib/content/studies";
import { getGlossaryWithFallback, type GlossaryEntry } from "@/lib/content/glossary";
import { getTopicsWithFallback, type TopicEntry } from "@/lib/content/topics";
import { getPathsWithFallback, type PathEntry } from "@/lib/content/paths";
import { THEME_IDS, type ThemeId } from "@/lib/content/taxonomy";
import type { Lang } from "@/lib/i18n/config";

export interface ThemeCollection {
	studies: Study[];
	glossary: GlossaryEntry[];
	topics: TopicEntry[];
	paths: PathEntry[];
	/** Vrai si l'un des contenus rédactionnels est servi dans la langue de repli. */
	fallback: boolean;
}

const has = (themes: readonly string[], theme: ThemeId) => themes.includes(theme);

/**
 * Tout ce que le site rattache à un thème, rassemblé en un seul endroit.
 *
 * Les treize thèmes n'étaient jusqu'ici qu'une facette de l'annuaire : on pouvait
 * arriver sur une étude, pas explorer un sujet. Rien n'est rédigé pour ces pages —
 * elles ne font que croiser des rattachements déjà déclarés dans les contenus.
 */
export function getThemeCollection(lang: Lang, theme: ThemeId): ThemeCollection {
	const glossary = getGlossaryWithFallback(lang);
	const topics = getTopicsWithFallback(lang);
	const paths = getPathsWithFallback(lang);

	return {
		// Les plus citées d'abord : à défaut de jugement éditorial, c'est le seul
		// classement que les données autorisent sans en inventer un.
		studies: [...getStudiesByTheme(theme)].sort((a, b) => (b.citedByCount ?? 0) - (a.citedByCount ?? 0)),
		glossary: glossary.entries.filter((entry) => has(entry.frontmatter.themes, theme)),
		topics: topics.entries.filter((entry) => has(entry.frontmatter.themes, theme)),
		paths: paths.entries.filter((entry) => has(entry.frontmatter.themes, theme)),
		fallback: glossary.fallback || topics.fallback || paths.fallback,
	};
}

export interface ThemeSummary {
	id: ThemeId;
	studies: number;
	glossary: number;
	topics: number;
	paths: number;
}

/** Volumétrie de chaque thème, pour la page d'index. */
export function getThemeSummaries(lang: Lang): ThemeSummary[] {
	return THEME_IDS.map((id) => {
		const collection = getThemeCollection(lang, id);
		return {
			id,
			studies: collection.studies.length,
			glossary: collection.glossary.length,
			topics: collection.topics.length,
			paths: collection.paths.length,
		};
	});
}
