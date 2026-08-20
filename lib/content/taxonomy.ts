import type { Lang } from "@/lib/i18n/config";

/**
 * Thèmes maison, volontairement peu nombreux et stables.
 *
 * Ils ne remplacent pas les concepts renvoyés par OpenAlex (conservés bruts dans
 * `sourceTopics`) : ceux-ci sont trop fins et trop instables pour servir de facettes.
 * Le rattachement d'une étude à un thème est une décision éditoriale.
 *
 * Chaque thème porte une teinte qui le signale dans toute l'interface : pastilles,
 * bandeaux de dossier, facettes. C'est le seul endroit où cette association est définie.
 */
export const THEMES = {
	observation: {
		fr: "Observation du climat",
		en: "Climate observation",
		shortFr: "Observation",
		shortEn: "Observation",
		hue: 205,
	},
	modelisation: {
		fr: "Modélisation et projections",
		en: "Modelling and projections",
		shortFr: "Modélisation",
		shortEn: "Modelling",
		hue: 258,
	},
	carbone: {
		fr: "Cycle du carbone et gaz à effet de serre",
		en: "Carbon cycle and greenhouse gases",
		shortFr: "Carbone",
		shortEn: "Carbon",
		hue: 25,
	},
	chaleur: {
		fr: "Chaleur et canicules",
		en: "Heat and heatwaves",
		shortFr: "Chaleur",
		shortEn: "Heat",
		hue: 12,
	},
	cryosphere: {
		fr: "Cryosphère",
		en: "Cryosphere",
		shortFr: "Cryosphère",
		shortEn: "Cryosphere",
		hue: 190,
	},
	ocean: {
		fr: "Océan et niveau marin",
		en: "Ocean and sea level",
		shortFr: "Océan",
		shortEn: "Ocean",
		hue: 218,
	},
	eau: {
		fr: "Eau, sécheresses et inondations",
		en: "Water, droughts and floods",
		shortFr: "Eau",
		shortEn: "Water",
		hue: 172,
	},
	biodiversite: {
		fr: "Biodiversité et écosystèmes",
		en: "Biodiversity and ecosystems",
		shortFr: "Biodiversité",
		shortEn: "Biodiversity",
		hue: 140,
	},
	sante: {
		fr: "Santé et populations",
		en: "Health and populations",
		shortFr: "Santé",
		shortEn: "Health",
		hue: 340,
	},
	agriculture: {
		fr: "Agriculture et alimentation",
		en: "Agriculture and food",
		shortFr: "Agriculture",
		shortEn: "Agriculture",
		hue: 78,
	},
	energie: {
		fr: "Énergie et transition",
		en: "Energy and transition",
		shortFr: "Énergie",
		shortEn: "Energy",
		hue: 42,
	},
	politiques: {
		fr: "Politiques et gouvernance",
		en: "Policy and governance",
		shortFr: "Politiques",
		shortEn: "Policy",
		hue: 285,
	},
	risques: {
		fr: "Risques naturels",
		en: "Natural hazards",
		shortFr: "Risques",
		shortEn: "Hazards",
		hue: 358,
	},
} as const;

export type ThemeId = keyof typeof THEMES;

/**
 * Teinte d'accent d'un thème, en degrés HSL.
 *
 * On ne stocke que la teinte : saturation et luminosité sont fixées côté CSS,
 * différemment en clair et en sombre. Cela garantit un contraste homogène d'un
 * thème à l'autre, là où treize couleurs choisies à la main dériveraient.
 */
export function themeHue(id: ThemeId): number {
	return THEMES[id].hue;
}

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function themeLabel(id: ThemeId, lang: Lang): string {
	return THEMES[id][lang];
}

/**
 * Libellé court, pour les emplacements où le nom complet ne tient pas :
 * axes d'un radar, facettes sur écran étroit.
 */
export function themeShortLabel(id: ThemeId, lang: Lang): string {
	return lang === "fr" ? THEMES[id].shortFr : THEMES[id].shortEn;
}

export function isThemeId(value: string): value is ThemeId {
	return value in THEMES;
}

/** Types de publication référençables. */
export const PUBLICATION_TYPES = {
	article: { fr: "Article de revue", en: "Journal article" },
	review: { fr: "Synthèse / méta-analyse", en: "Review / meta-analysis" },
	report: { fr: "Rapport institutionnel", en: "Institutional report" },
	preprint: { fr: "Préprint", en: "Preprint" },
	dataset: { fr: "Jeu de données", en: "Dataset" },
	chapter: { fr: "Chapitre d'ouvrage", en: "Book chapter" },
} as const;

export type PublicationType = keyof typeof PUBLICATION_TYPES;

export const PUBLICATION_TYPE_IDS = Object.keys(PUBLICATION_TYPES) as PublicationType[];

export function publicationTypeLabel(id: PublicationType, lang: Lang): string {
	return PUBLICATION_TYPES[id][lang];
}
