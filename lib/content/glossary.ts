import { glossaryFrontmatterSchema, type GlossaryFrontmatter } from "@/lib/content/schemas";
import { readCollection, readEntry, type MdxEntry } from "@/lib/content/mdx-source";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export type GlossaryEntry = MdxEntry<GlossaryFrontmatter>;

const caches = new Map<Lang, GlossaryEntry[]>();

export function getGlossary(lang: Lang): GlossaryEntry[] {
	const cached = caches.get(lang);
	if (cached) return cached;

	const entries = readCollection("glossary", lang, glossaryFrontmatterSchema).sort((a, b) =>
		a.frontmatter.term.localeCompare(b.frontmatter.term, lang)
	);

	caches.set(lang, entries);
	return entries;
}

export function getGlossaryEntry(lang: Lang, slug: string): GlossaryEntry | null {
	return readEntry("glossary", lang, slug, glossaryFrontmatterSchema);
}

/**
 * Le contenu rédactionnel n'existe qu'en français pour l'instant. Plutôt que
 * d'afficher une page vide en anglais, on retombe sur le français en le signalant
 * à l'appelant, qui doit l'indiquer au lecteur.
 */
export function getGlossaryWithFallback(lang: Lang): { entries: GlossaryEntry[]; fallback: boolean } {
	const entries = getGlossary(lang);
	if (entries.length > 0) return { entries, fallback: false };
	return { entries: getGlossary(DEFAULT_LANG), fallback: lang !== DEFAULT_LANG };
}

/** Regroupe par initiale, pour l'index alphabétique. */
export function groupByInitial(entries: GlossaryEntry[]): Map<string, GlossaryEntry[]> {
	const groups = new Map<string, GlossaryEntry[]>();

	for (const entry of entries) {
		const initial = entry.frontmatter.term
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.charAt(0)
			.toUpperCase();
		const bucket = groups.get(initial) ?? [];
		bucket.push(entry);
		groups.set(initial, bucket);
	}

	return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "fr")));
}

/**
 * Index terme → slug, synonymes inclus, utilisé pour lier automatiquement les
 * occurrences dans les dossiers. Les entrées les plus longues d'abord, sans quoi
 * « canicule » masquerait « vague de chaleur ».
 */
export function buildTermIndex(lang: Lang): { pattern: string; slug: string; term: string }[] {
	return getGlossary(lang)
		.flatMap((entry) => [
			{ pattern: entry.frontmatter.term, slug: entry.slug, term: entry.frontmatter.term },
			...entry.frontmatter.synonyms.map((synonym) => ({
				pattern: synonym,
				slug: entry.slug,
				term: entry.frontmatter.term,
			})),
		])
		.sort((a, b) => b.pattern.length - a.pattern.length);
}

export function getGlossaryEntries(lang: Lang, slugs: readonly string[]): GlossaryEntry[] {
	const bySlug = new Map(getGlossary(lang).map((entry) => [entry.slug, entry]));
	return slugs.map((slug) => bySlug.get(slug)).filter((entry): entry is GlossaryEntry => Boolean(entry));
}
