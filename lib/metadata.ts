import type { Metadata } from "next";
import { DEFAULT_LANG, LANGS, type Lang } from "@/lib/i18n/config";
import { route, type Section } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

const OG_LOCALE: Record<Lang, string> = { fr: "fr_FR", en: "en_GB" };

/**
 * Métadonnées d'une page, vignette de partage comprise.
 *
 * Next ne fusionne pas `openGraph` avec celui du layout : il le remplace, ou le
 * laisse intact si la page n'en déclare pas. Une page qui se contentait de
 * `title` et `description` héritait donc du bloc du site entier et se partageait
 * sous le titre générique, avec une URL pointant vers l'accueil — c'était le cas
 * des parcours, du glossaire et de toutes les pages d'index. Celles qui en
 * déclaraient un, à l'inverse, perdaient `og:url` en écrasant le parent.
 *
 * Composer le bloc ici une seule fois évite d'avoir à y repenser à chaque page.
 */
export function pageMetadata({
	lang,
	title,
	description,
	section,
	segments = [],
	modifiedTime,
}: {
	lang: Lang;
	title: string;
	description?: string;
	/** Absente pour l'accueil d'une langue. */
	section?: Section;
	segments?: string[];
	/** Renseignée pour un contenu daté : la vignette devient de type « article ». */
	modifiedTime?: string;
}): Metadata {
	const canonical = route(lang, section, ...segments);
	const translations = Object.fromEntries(
		LANGS.map((l) => [l, route(l, section, ...segments)])
	);
	const shared = {
		title,
		description,
		url: canonical,
		siteName: siteConfig.name,
		locale: OG_LOCALE[lang],
	};

	return {
		title,
		description,
		alternates: {
			canonical,
			languages: {
				...translations,
				/*
				  `x-default` désigne la version à servir quand la langue du visiteur
				  ne correspond à aucune de celles déclarées. Sans elle, un moteur
				  choisit lui-même, et traite souvent les deux versions comme des
				  doublons concurrents au lieu d'un même contenu en deux langues.
				*/
				"x-default": translations[DEFAULT_LANG],
			},
			// Déclaré par le layout, mais `alternates` est lui aussi remplacé et non
			// fusionné : sans cette ligne, les pages perdraient le lien vers le flux.
			types: { "application/rss+xml": `/${lang}/rss.xml` },
		},
		openGraph: modifiedTime
			? { ...shared, type: "article", modifiedTime }
			: { ...shared, type: "website" },
		twitter: { card: "summary_large_image", title, description },
	};
}
