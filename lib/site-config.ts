/**
 * Source unique pour tout ce qui identifie le site.
 * Changer le nom du projet ne doit toucher que ce fichier.
 */
export const siteConfig = {
	name: "Corpus Delta",
	shortName: "Corpus Delta",
	/**
	 * Baseline complète : titres de page, métadonnées, vignettes de partage.
	 * Trop longue pour le header, d'où `shortTagline`.
	 */
	tagline: {
		fr: "Annuaire de la recherche sur le climat",
		en: "A directory of climate research",
	},
	/** Version affichée sous le nom dans l'en-tête, où la place est comptée. */
	shortTagline: {
		fr: "Recherche climatique",
		en: "Climate research",
	},
	description: {
		fr: "Un annuaire de publications scientifiques sur le climat et les risques naturels, avec un glossaire des termes techniques. Chaque référence renvoie à sa source d'origine.",
		en: "A directory of peer-reviewed research on climate and natural hazards, with a glossary of technical terms. Every reference links back to its original source.",
	},
	url: "https://corpusdelta.org",
	repository: "https://github.com/M-U-C-K-A/projet-climat",
	/**
	 * Adresse transmise aux API bibliographiques (OpenAlex, Crossref) pour accéder
	 * à leur « polite pool ». Ces API demandent un contact technique joignable.
	 */
	contactEmail: "contact@corpusdelta.org",
} as const;

export type SiteConfig = typeof siteConfig;
