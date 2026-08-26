import type { MetadataRoute } from "next";
import { getAllStudies } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths } from "@/lib/content/paths";
import { THEME_IDS } from "@/lib/content/taxonomy";
import { DEFAULT_LANG, LANGS } from "@/lib/i18n/config";
import { absoluteUrl, homeRoute, route, type Section } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

/**
 * Le sitemap ne liste que les URLs publiques localisées (celles produites par
 * `route`), et déclare les équivalents dans l'autre langue via `alternates`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const entries: MetadataRoute.Sitemap = [];

	const push = (paths: Record<string, string>, priority: number, lastModified?: string) => {
		for (const lang of LANGS) {
			entries.push({
				url: absoluteUrl(siteConfig.url, paths[lang]),
				lastModified: lastModified ? new Date(lastModified) : undefined,
				priority,
				alternates: {
					languages: Object.fromEntries(
						LANGS.map((l) => [l, absoluteUrl(siteConfig.url, paths[l])])
					),
				},
			});
		}
	};

	push(Object.fromEntries(LANGS.map((l) => [l, homeRoute(l)])), 1);

	const sections: [Section, number][] = [
		["studies", 0.9],
		["glossary", 0.9],
		["topics", 0.8],
		["paths", 0.8],
		["themes", 0.7],
		["indicators", 0.7],
		["updates", 0.6],
		["methodology", 0.5],
		["contribute", 0.4],
		["about", 0.4],
	];
	for (const [section, priority] of sections) {
		push(Object.fromEntries(LANGS.map((l) => [l, route(l, section)])), priority);
	}

	for (const theme of THEME_IDS) {
		push(Object.fromEntries(LANGS.map((l) => [l, route(l, "themes", theme)])), 0.6);
	}

	for (const study of getAllStudies()) {
		push(
			Object.fromEntries(LANGS.map((l) => [l, route(l, "studies", study.id)])),
			0.6,
			study.addedAt
		);
	}

	for (const entry of getGlossary(DEFAULT_LANG)) {
		push(
			Object.fromEntries(LANGS.map((l) => [l, route(l, "glossary", entry.slug)])),
			0.7,
			entry.frontmatter.updatedAt
		);
	}

	for (const topic of getTopics(DEFAULT_LANG)) {
		push(
			Object.fromEntries(LANGS.map((l) => [l, route(l, "topics", topic.slug)])),
			0.7,
			topic.frontmatter.updatedAt
		);
	}

	for (const entry of getPaths(DEFAULT_LANG)) {
		push(
			Object.fromEntries(LANGS.map((l) => [l, route(l, "paths", entry.slug)])),
			0.7,
			entry.frontmatter.updatedAt
		);
	}

	return entries;
}
