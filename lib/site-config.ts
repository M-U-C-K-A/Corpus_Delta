/**
 * Source unique pour tout ce qui identifie le site.
 * Changer le nom du projet ne doit toucher que ce fichier.
 */
export const siteConfig = {
	name: "Climatothèque",
	shortName: "Climatothèque",
	/** Baseline affichée sous le nom, volontairement descriptive et non promotionnelle. */
	tagline: {
		fr: "Annuaire de la recherche sur le climat",
		en: "A directory of climate research",
	},
	description: {
		fr: "Un annuaire de publications scientifiques sur le climat et les risques naturels, avec un glossaire des termes techniques. Chaque référence renvoie à sa source d'origine.",
		en: "A directory of peer-reviewed research on climate and natural hazards, with a glossary of technical terms. Every reference links back to its original source.",
	},
	url: "https://climatotheque.org",
	repository: "https://github.com/M-U-C-K-A/projet-climat",
	/**
	 * Adresse transmise aux API bibliographiques (OpenAlex, Crossref) pour accéder
	 * à leur « polite pool ». Ces API demandent un contact technique joignable.
	 */
	contactEmail: "contact@climatotheque.org",
} as const;

export type SiteConfig = typeof siteConfig;
