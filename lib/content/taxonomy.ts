import type { Lang } from "@/lib/i18n/config";

/**
 * Thèmes maison, volontairement peu nombreux et stables.
 *
 * Ils ne remplacent pas les concepts renvoyés par OpenAlex (conservés bruts dans
 * `sourceTopics`) : ceux-ci sont trop fins et trop instables pour servir de facettes.
 * Le rattachement d'une étude à un thème est une décision éditoriale.
 */
export const THEMES = {
	observation: {
		fr: "Observation du climat",
		en: "Climate observation",
	},
	modelisation: {
		fr: "Modélisation et projections",
		en: "Modelling and projections",
	},
	carbone: {
		fr: "Cycle du carbone et gaz à effet de serre",
		en: "Carbon cycle and greenhouse gases",
	},
	chaleur: {
		fr: "Chaleur et canicules",
		en: "Heat and heatwaves",
	},
	cryosphere: {
		fr: "Cryosphère",
		en: "Cryosphere",
	},
	ocean: {
		fr: "Océan et niveau marin",
		en: "Ocean and sea level",
	},
	eau: {
		fr: "Eau, sécheresses et inondations",
		en: "Water, droughts and floods",
	},
	biodiversite: {
		fr: "Biodiversité et écosystèmes",
		en: "Biodiversity and ecosystems",
	},
	sante: {
		fr: "Santé et populations",
		en: "Health and populations",
	},
	agriculture: {
		fr: "Agriculture et alimentation",
		en: "Agriculture and food",
	},
	energie: {
		fr: "Énergie et transition",
		en: "Energy and transition",
	},
	politiques: {
		fr: "Politiques et gouvernance",
		en: "Policy and governance",
	},
	risques: {
		fr: "Risques naturels",
		en: "Natural hazards",
	},
} as const;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function themeLabel(id: ThemeId, lang: Lang): string {
	return THEMES[id][lang];
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
