import { pathFrontmatterSchema, type PathFrontmatter, type PathStep } from "@/lib/content/schemas";
import { readCollection, readEntry, type MdxEntry } from "@/lib/content/mdx-source";
import { getGlossaryEntry } from "@/lib/content/glossary";
import { getTopic } from "@/lib/content/topics";
import { getStudy, displayTitle } from "@/lib/content/studies";
import { citationLine } from "@/lib/content/citation";
import { route } from "@/lib/routes";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export type PathEntry = MdxEntry<PathFrontmatter>;

const caches = new Map<Lang, PathEntry[]>();

const isPublished = (entry: PathEntry) =>
	!entry.frontmatter.draft || process.env.NODE_ENV === "development";

export function getPaths(lang: Lang): PathEntry[] {
	const cached = caches.get(lang);
	if (cached) return cached;

	const entries = readCollection("paths", lang, pathFrontmatterSchema)
		.filter(isPublished)
		.sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title, lang));

	caches.set(lang, entries);
	return entries;
}

export function getPath(lang: Lang, slug: string): PathEntry | null {
	const entry = readEntry("paths", lang, slug, pathFrontmatterSchema);
	if (!entry || !isPublished(entry)) return null;
	return entry;
}

export function getPathsWithFallback(lang: Lang): { entries: PathEntry[]; fallback: boolean } {
	const entries = getPaths(lang);
	if (entries.length > 0) return { entries, fallback: false };
	return { entries: getPaths(DEFAULT_LANG), fallback: lang !== DEFAULT_LANG };
}

export interface ResolvedStep extends PathStep {
	title: string;
	subtitle: string | null;
	href: string;
	/** Durée de lecture estimée, en minutes. */
	minutes: number;
}

/** Estimation volontairement grossière : 200 mots par minute, plancher à 1 minute. */
function minutesFor(text: string, floor = 1): number {
	return Math.max(floor, Math.round(text.split(/\s+/).length / 200));
}

/**
 * Complète chaque étape avec le titre et le lien de la ressource visée.
 *
 * Une étape orpheline est écartée plutôt que rendue sous forme de lien mort ;
 * `scripts/validate-content.ts` fait échouer le build dans ce cas, donc la
 * situation ne devrait pas atteindre la production.
 */
export function resolveSteps(lang: Lang, contentLang: Lang, steps: readonly PathStep[]): ResolvedStep[] {
	return steps
		.map((step): ResolvedStep | null => {
			if (step.kind === "glossary") {
				const entry = getGlossaryEntry(contentLang, step.id) ?? getGlossaryEntry(DEFAULT_LANG, step.id);
				if (!entry) return null;
				return {
					...step,
					title: entry.frontmatter.term,
					subtitle: entry.frontmatter.shortDefinition,
					href: route(lang, "glossary", step.id),
					minutes: minutesFor(entry.content, 2),
				};
			}

			if (step.kind === "topic") {
				const topic = getTopic(contentLang, step.id) ?? getTopic(DEFAULT_LANG, step.id);
				if (!topic) return null;
				return {
					...step,
					title: topic.frontmatter.title,
					subtitle: topic.frontmatter.description,
					href: route(lang, "topics", step.id),
					minutes: minutesFor(topic.content, 3),
				};
			}

			const study = getStudy(step.id);
			if (!study) return null;
			return {
				...step,
				title: displayTitle(study),
				subtitle: citationLine(study),
				href: route(lang, "studies", step.id),
				minutes: study.abstract ? minutesFor(study.abstract, 2) : 2,
			};
		})
		.filter((step): step is ResolvedStep => step !== null);
}

export function totalMinutes(steps: readonly ResolvedStep[]): number {
	return steps.reduce((sum, step) => sum + step.minutes, 0);
}

/** Parcours qui passent par une ressource donnée, pour proposer un contexte de lecture. */
export function getPathsContaining(lang: Lang, kind: PathStep["kind"], id: string): PathEntry[] {
	return getPaths(lang).filter((entry) =>
		entry.frontmatter.steps.some((step) => step.kind === kind && step.id === id)
	);
}
