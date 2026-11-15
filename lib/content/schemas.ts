import { z } from "zod";
import { LANGS } from "@/lib/i18n/config";
import { PUBLICATION_TYPE_IDS, THEME_IDS } from "@/lib/content/taxonomy";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "date ISO attendue (AAAA-MM-JJ)");

const slug = z
	.string()
	.min(1)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug en minuscules, sans accent, séparé par des tirets");

/**
 * Une source citable : c'est la brique qui rend une affirmation vérifiable.
 * Un libellé sans URL n'est pas une source, d'où l'URL obligatoire.
 */
export const sourceRefSchema = z.object({
	label: z.string().min(1),
	url: z.string().url(),
	publisher: z.string().min(1).optional(),
	year: z.number().int().min(1800).max(2100).optional(),
	accessedAt: isoDate.optional(),
});

export type SourceRef = z.infer<typeof sourceRefSchema>;

const authorSchema = z.object({
	name: z.string().min(1),
	orcid: z.string().url().optional(),
	affiliation: z.string().optional(),
});

/**
 * Une étude référencée.
 *
 * Les champs bibliographiques sont produits par `scripts/add-study.ts` depuis
 * OpenAlex ou Crossref : ils ne doivent pas être édités à la main, sous peine de
 * diverger silencieusement de la source. Seul `editorial` est rédigé.
 */
export const studySchema = z.object({
	id: slug,
	doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).nullable(),
	title: z.string().min(1),
	/**
	 * Titre d'affichage abrégé, saisi à la main. Purement présentationnel : certains
	 * rapports institutionnels ont un titre officiel de plusieurs lignes, illisible
	 * dans une liste. Le titre complet reste toujours affiché sur la fiche.
	 */
	shortTitle: z.string().min(1).optional(),
	authors: z.array(authorSchema),
	/** Nombre total d'auteurs, qui peut dépasser la liste conservée. */
	authorCount: z.number().int().min(0),
	venue: z.string().nullable(),
	publisher: z.string().nullable(),
	year: z.number().int().min(1800).max(2100),
	/** Type renvoyé par la source bibliographique, conservé tel quel. */
	type: z.enum(PUBLICATION_TYPE_IDS as [string, ...string[]]),
	/**
	 * Type corrigé à la main. OpenAlex se trompe souvent : « Drought under global
	 * warming: a review » y est typé `article`, comme les bilans carbone annuels.
	 * La facette de l'annuaire devenait trompeuse, alors même que la page Méthode
	 * annonce privilégier les synthèses.
	 */
	typeOverride: z.enum(PUBLICATION_TYPE_IDS as [string, ...string[]]).optional(),
	abstract: z.string().nullable(),
	/** Langue de la publication, code ISO 639-1. */
	language: z.string().min(2).max(5).nullable(),
	openAccess: z.object({
		isOpen: z.boolean(),
		status: z.string().nullable(),
		url: z.string().url().nullable(),
	}),
	/** Toujours affiché attribué à sa source : les compteurs varient d'une base à l'autre. */
	citedByCount: z.number().int().min(0).nullable(),
	themes: z.array(z.enum(THEME_IDS as [string, ...string[]])).min(1),
	/** Concepts bruts de la base d'origine, conservés pour la recherche. */
	sourceTopics: z.array(z.string()),
	url: z.string().url(),
	provenance: z.object({
		source: z.enum(["openalex", "crossref", "manual"]),
		retrievedAt: isoDate,
	}),
	addedAt: isoDate,
	/** Apport rédactionnel : pourquoi cette étude figure dans l'annuaire. */
	editorial: z
		.record(
			z.enum(LANGS),
			z.object({
				summary: z.string().min(1),
				relevance: z.string().min(1).optional(),
			})
		)
		.default({}),
	glossaryTerms: z.array(slug).default([]),
});

export type Study = z.infer<typeof studySchema>;

/** Entrée de glossaire — le frontmatter d'un fichier `content/glossary/<lang>/<slug>.mdx`. */
export const glossaryFrontmatterSchema = z.object({
	term: z.string().min(1),
	shortDefinition: z.string().min(1).max(400),
	themes: z.array(z.enum(THEME_IDS as [string, ...string[]])).min(1),
	synonyms: z.array(z.string()).default([]),
	related: z.array(slug).default([]),
	/** Au moins une source : une définition non sourcée n'a pas sa place ici. */
	sources: z.array(sourceRefSchema).min(1),
	studies: z.array(slug).default([]),
	updatedAt: isoDate,
});

export type GlossaryFrontmatter = z.infer<typeof glossaryFrontmatterSchema>;

/** Dossier thématique — le frontmatter d'un fichier `content/topics/<lang>/<slug>.mdx`. */
export const topicFrontmatterSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1).max(400),
	themes: z.array(z.enum(THEME_IDS as [string, ...string[]])).min(1),
	/** Études de l'annuaire sur lesquelles s'appuie le dossier. */
	studies: z.array(slug).default([]),
	glossary: z.array(slug).default([]),
	sources: z.array(sourceRefSchema).default([]),
	updatedAt: isoDate,
	draft: z.boolean().default(false),
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

/**
 * Une vedette du bandeau d'un dossier d'indicateurs : un jeu de données dont on
 * affiche la dernière valeur, son évolution et une courbe miniature.
 */
export const domainHeadlineSchema = z.object({
	dataset: slug,
	/** Décimales affichées. Celles que publie la source, pas une de plus. */
	decimals: z.number().int().min(0).max(4).default(1),
	/**
	 * Sens de lecture de la variation. Une banquise qui recule et un niveau marin
	 * qui monte vont dans le même sens physique mais dans des directions
	 * numériques opposées : sans cette indication, l'interface les coderait à
	 * l'envers l'un des deux.
	 */
	drift: z.enum(["hausse-defavorable", "baisse-defavorable", "neutre"]).default("neutre"),
	/** Série du jeu de données à retenir, quand il en porte plusieurs. */
	series: z.string().min(1).optional(),
	/**
	 * Grandeur mise en avant sous la valeur.
	 *
	 * « pente » convient à une série qui dérive régulièrement. Elle induit en
	 * erreur partout ailleurs : sur un décompte annuel très bruité, elle dépend
	 * surtout de la dernière année ; sur une série cyclique comme le marnage,
	 * elle mesure l'endroit du cycle où l'on se trouve et rien d'autre.
	 */
	metric: z.enum(["pente", "decennie", "amplitude"]).default("pente"),
});

export type DomainHeadline = z.infer<typeof domainHeadlineSchema>;

/**
 * Dossier d'indicateurs : une entrée en matière sur un domaine du système
 * climatique, construite autour de ses séries de mesure.
 *
 * La différence avec un dossier ordinaire tient au point de départ. Un dossier
 * part d'une question et cite des études ; celui-ci part des grandeurs mesurées
 * et explique le mécanisme qui les relie. D'où un bandeau de vedettes et une
 * figure de mécanisme, tous deux déclarés ici plutôt que dans le corps du texte.
 */
export const domainFrontmatterSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1).max(400),
	/** Phrase d'accroche du bandeau, plus courte que la description. */
	tagline: z.string().min(1).max(160),
	themes: z.array(z.enum(THEME_IDS as [string, ...string[]])).min(1),
	headline: z.array(domainHeadlineSchema).min(2).max(6),
	studies: z.array(slug).default([]),
	glossary: z.array(slug).default([]),
	sources: z.array(sourceRefSchema).default([]),
	/** Ordre d'affichage dans l'index. Les domaines ne sont pas interchangeables. */
	order: z.number().int().min(0).default(50),
	updatedAt: isoDate,
	draft: z.boolean().default(false),
});

export type DomainFrontmatter = z.infer<typeof domainFrontmatterSchema>;

/**
 * Parcours de lecture : une séquence ordonnée d'étapes qui traverse le glossaire,
 * les dossiers et l'annuaire.
 *
 * L'ordre porte l'essentiel de la valeur — on définit le vocabulaire avant de s'en
 * servir, on lit la synthèse avant les publications d'origine.
 */
export const pathStepSchema = z.object({
	kind: z.enum(["glossary", "topic", "study"]),
	/** Slug de terme, de dossier, ou identifiant d'étude selon `kind`. */
	id: slug,
	/** Pourquoi cette étape figure ici, et ce qu'il faut en retenir. */
	note: z.string().min(1),
});

export type PathStep = z.infer<typeof pathStepSchema>;

export const pathFrontmatterSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1).max(400),
	themes: z.array(z.enum(THEME_IDS as [string, ...string[]])).min(1),
	/** Niveau supposé du lecteur à l'entrée du parcours. */
	level: z.enum(["decouverte", "approfondissement"]),
	steps: z.array(pathStepSchema).min(2),
	updatedAt: isoDate,
	draft: z.boolean().default(false),
});

export type PathFrontmatter = z.infer<typeof pathFrontmatterSchema>;

/**
 * Jeu de données servant un graphique.
 * La source et la date de relevé sont obligatoires : un graphique sans provenance
 * affichable ne peut pas être publié.
 */
export const datasetSchema = z.object({
	id: slug,
	title: z.record(z.enum(LANGS), z.string()),
	/** Absente quand la grandeur n'en a pas — une année de franchissement, par exemple. */
	unit: z.string().min(1).optional(),
	source: sourceRefSchema,
	note: z.record(z.enum(LANGS), z.string()).optional(),
	series: z
		.array(
			z.object({
				key: z.string().min(1),
				label: z.record(z.enum(LANGS), z.string()),
			})
		)
		.min(1),
	rows: z.array(z.record(z.string(), z.union([z.number(), z.string(), z.null()]))).min(1),
});

export type Dataset = z.infer<typeof datasetSchema>;
