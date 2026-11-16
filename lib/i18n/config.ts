export const LANGS = ["fr", "en"] as const;

export type Lang = (typeof LANGS)[number];

/**
 * Langue de référence.
 *
 * Sert à deux choses : la racine `/` y redirige, et c'est la cible du repli
 * quand une traduction manque. Ce repli se décide fichier par fichier, dans
 * les chargeurs `get…WithFallback` de `lib/content/` — aucune langue n'est
 * déclarée globalement incomplète, puisqu'une langue peut très bien n'avoir
 * qu'une partie du corpus.
 */
export const DEFAULT_LANG: Lang = "fr";

export function isLang(value: string): value is Lang {
	return (LANGS as readonly string[]).includes(value);
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
