import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

/**
 * L'arborescence `app/[lang]/…` utilise des segments anglais (studies, glossary…)
 * parce qu'un dossier de route ne peut pas dépendre de la langue. Les URLs publiques
 * sont traduites par des rewrites déclarés dans `next.config.mjs`, qui doivent rester
 * synchronisés avec cette table.
 *
 * Toute URL interne doit passer par `route()` : c'est ce qui garantit que les liens,
 * le sitemap et les balises canoniques désignent bien la même adresse publique.
 */
export const SECTIONS = {
	studies: { fr: "etudes", en: "studies" },
	glossary: { fr: "glossaire", en: "glossary" },
	topics: { fr: "dossiers", en: "topics" },
	paths: { fr: "parcours", en: "paths" },
	indicators: { fr: "indicateurs", en: "indicators" },
	contribute: { fr: "contribuer", en: "contribute" },
	methodology: { fr: "methodologie", en: "methodology" },
	about: { fr: "a-propos", en: "about" },
} as const satisfies Record<string, Record<Lang, string>>;

export type Section = keyof typeof SECTIONS;

/** Segment canonique côté système de fichiers (celui du dossier `app/[lang]/…`). */
export const CANONICAL_SEGMENT: Record<Section, string> = {
	studies: "studies",
	glossary: "glossary",
	topics: "topics",
	paths: "paths",
	indicators: "indicators",
	contribute: "contribute",
	methodology: "methodology",
	about: "about",
};

/**
 * Construit une URL publique. `route('fr', 'glossary', 'canicule')` → `/fr/glossaire/canicule`.
 * Sans section, renvoie l'accueil de la langue.
 */
export function route(lang: Lang, section?: Section, ...segments: string[]): string {
	const parts: string[] = [lang];
	if (section) parts.push(SECTIONS[section][lang]);
	parts.push(...segments.filter(Boolean));
	return "/" + parts.join("/");
}

export function homeRoute(lang: Lang): string {
	return `/${lang}`;
}

/**
 * Traduit l'URL courante vers une autre langue, pour le sélecteur de langue.
 *
 * Les slugs de contenu sont volontairement identiques dans toutes les langues :
 * seul le segment de section est traduit. C'est ce qui permet de basculer depuis
 * le layout, qui n'a pas connaissance du contenu de la page.
 */
export function translatePathname(pathname: string, from: Lang, to: Lang): string {
	const segments = pathname.split("/").filter(Boolean);

	if (segments[0] !== from) return homeRoute(to);
	if (segments.length === 1) return homeRoute(to);

	const sectionEntry = (Object.entries(SECTIONS) as [Section, Record<Lang, string>][]).find(
		([, labels]) => labels[from] === segments[1]
	);

	// Section inconnue : on ne devine pas, on renvoie vers l'accueil de la langue cible.
	if (!sectionEntry) return homeRoute(to);

	const [section] = sectionEntry;
	return route(to, section, ...segments.slice(2));
}

/** URL absolue, pour les balises canoniques, le sitemap et les métadonnées Open Graph. */
export function absoluteUrl(baseUrl: string, path: string): string {
	return new URL(path, baseUrl).toString();
}

export { DEFAULT_LANG };
