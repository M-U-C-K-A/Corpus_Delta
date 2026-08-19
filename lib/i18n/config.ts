export const LANGS = ["fr", "en"] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "fr";

export function isLang(value: string): value is Lang {
	return (LANGS as readonly string[]).includes(value);
}

/**
 * Le contenu rédactionnel (glossaire, dossiers) est produit en français d'abord.
 * Les pages anglaises existent et restent navigables : elles affichent l'annuaire,
 * dont les métadonnées sont indépendantes de la langue, et signalent explicitement
 * quand une traduction n'est pas encore disponible plutôt que de renvoyer un 404.
 */
export const EDITORIAL_LANGS: readonly Lang[] = ["fr"];

export function hasEditorialContent(lang: Lang): boolean {
	return EDITORIAL_LANGS.includes(lang);
}

/** Locale BCP 47 pour le formatage des dates et des nombres. */
export const LOCALES: Record<Lang, string> = {
	fr: "fr-FR",
	en: "en-GB",
};

export const LANG_LABELS: Record<Lang, string> = {
	fr: "Français",
	en: "English",
};
