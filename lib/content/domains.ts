import { domainFrontmatterSchema, type DomainFrontmatter } from "@/lib/content/schemas";
import { readCollection, readEntry, type MdxEntry } from "@/lib/content/mdx-source";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

/**
 * Dossiers d'indicateurs : les sous-pages thématiques de la section Indicateurs.
 *
 * Même mécanique que les dossiers ordinaires, à ceci près que l'ordre
 * d'affichage est déclaré et non chronologique : on lit le réchauffement avant
 * la fonte des glaces, qui en est une conséquence.
 */

export type DomainEntry = MdxEntry<DomainFrontmatter>;

const caches = new Map<Lang, DomainEntry[]>();

const isPublished = (entry: DomainEntry) =>
	!entry.frontmatter.draft || process.env.NODE_ENV === "development";

export function getDomains(lang: Lang): DomainEntry[] {
	const cached = caches.get(lang);
	if (cached) return cached;

	const entries = readCollection("domains", lang, domainFrontmatterSchema)
		.filter(isPublished)
		.sort(
			(a, b) =>
				a.frontmatter.order - b.frontmatter.order ||
				a.frontmatter.title.localeCompare(b.frontmatter.title)
		);

	caches.set(lang, entries);
	return entries;
}

export function getDomain(lang: Lang, slug: string): DomainEntry | null {
	const entry = readEntry("domains", lang, slug, domainFrontmatterSchema);
	if (!entry || !isPublished(entry)) return null;
	return entry;
}

/**
 * Entrée demandée, avec repli sur le français quand la traduction manque.
 * Les URLs anglaises restent navigables plutôt que de renvoyer un 404.
 */
export function resolveDomain(
	lang: Lang,
	slug: string
): { domain: DomainEntry; fallback: boolean } | null {
	const own = getDomain(lang, slug);
	if (own) return { domain: own, fallback: false };

	const fallback = getDomain(DEFAULT_LANG, slug);
	return fallback ? { domain: fallback, fallback: lang !== DEFAULT_LANG } : null;
}

export function getDomainsWithFallback(lang: Lang): { entries: DomainEntry[]; fallback: boolean } {
	const entries = getDomains(lang);
	if (entries.length > 0) return { entries, fallback: false };
	return { entries: getDomains(DEFAULT_LANG), fallback: lang !== DEFAULT_LANG };
}

/** Dossiers d'indicateurs citant une étude donnée. */
export function getDomainsCitingStudy(lang: Lang, studyId: string): DomainEntry[] {
	return getDomains(lang).filter((domain) => domain.frontmatter.studies.includes(studyId));
}
