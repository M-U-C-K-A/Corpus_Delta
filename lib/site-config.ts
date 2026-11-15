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
	/**
	 * URL canonique : URLs absolues du sitemap, du flux RSS et des vignettes de
	 * partage. Le jour où un vrai domaine remplacera le sous-domaine Vercel, il
	 * suffira de définir NEXT_PUBLIC_SITE_URL dans les variables d'environnement
	 * du déploiement — sans toucher au code ni redéployer depuis le dépôt.
	 */
	url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://corpus-delta.vercel.app",
	repository: "https://github.com/M-U-C-K-A/Corpus_Delta",
	/**
	 * Preuve de propriété pour Google Search Console.
	 *
	 * Ce jeton n'est pas un secret : il est servi dans une balise meta sur
	 * chaque page du site, donc visible de quiconque affiche la source. Le
	 * publier ici ne révèle rien qui ne le soit déjà, et il suffit de le
	 * posséder pour vérifier — encore faut-il posséder le domaine.
	 *
	 * Le jeton est propre à une propriété Search Console, et chaque propriété a
	 * le sien : celui-ci vaut pour la propriété « préfixe de l'URL »
	 * https://corpus-delta.vercel.app. Une propriété « domaine » en demanderait
	 * un autre, et se prouverait par le DNS — impossible sous vercel.app, dont
	 * la zone ne nous appartient pas.
	 *
	 * Un autre déploiement que celui-ci — un domaine propre, une duplication
	 * du dépôt — doit donc utiliser le sien : définir
	 * NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION dans ses variables d'environnement
	 * remplace cette valeur sans toucher au code.
	 */
	googleSiteVerification: "ZySIHelGcR_QVEDjHMEkroMhVeT6MkgR0WCN0QGt8OE",
	/**
	 * Adresse transmise aux API bibliographiques (OpenAlex, Crossref) pour accéder
	 * à leur « polite pool ». Ces API demandent un contact technique joignable.
	 */
	contactEmail: "contact@corpusdelta.org",
	/**
	 * Qui répond du site. Un ouvrage qui définit des termes techniques sans que
	 * personne le signe demande une confiance qu'il ne justifie pas — c'était le
	 * principal manque relevé à l'audit.
	 */
	author: {
		name: "Hugo Delacour",
		github: "https://github.com/M-U-C-K-A",
	},
} as const;

export type SiteConfig = typeof siteConfig;
