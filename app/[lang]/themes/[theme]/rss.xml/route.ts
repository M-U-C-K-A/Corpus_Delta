import { getThemeCollection } from "@/lib/content/themes";
import { isThemeId, THEME_IDS, themeLabel } from "@/lib/content/taxonomy";
import { displayTitle } from "@/lib/content/studies";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { absoluteUrl, route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

/**
 * Flux propre à un thème.
 *
 * Prérendu, comme l'index de recherche : le contenu est connu au build, et une
 * route dynamique ne saurait pas lire `content/` à l'exécution.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
	return LANGS.flatMap((lang) => THEME_IDS.map((theme) => ({ lang, theme })));
}

const xml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rfc822 = (date: string) => new Date(date).toUTCString();

export function GET(_request: Request, { params }: { params: { lang: string; theme: string } }) {
	if (!isLang(params.lang) || !isThemeId(params.theme)) {
		return new Response("Not found", { status: 404 });
	}

	const lang: Lang = params.lang;
	const dict = getDictionary(lang);
	const { studies, glossary, topics, paths } = getThemeCollection(lang, params.theme);
	const label = themeLabel(params.theme, lang);

	const items = [
		...topics.map((entry) => ({
			title: entry.frontmatter.title,
			description: entry.frontmatter.description,
			url: route(lang, "topics", entry.slug),
			date: entry.frontmatter.updatedAt,
		})),
		...paths.map((entry) => ({
			title: entry.frontmatter.title,
			description: entry.frontmatter.description,
			url: route(lang, "paths", entry.slug),
			date: entry.frontmatter.updatedAt,
		})),
		...glossary.map((entry) => ({
			title: entry.frontmatter.term,
			description: entry.frontmatter.shortDefinition,
			url: route(lang, "glossary", entry.slug),
			date: entry.frontmatter.updatedAt,
		})),
		...studies.map((study) => ({
			title: displayTitle(study),
			description: study.abstract?.slice(0, 300) ?? "",
			url: route(lang, "studies", study.id),
			date: study.addedAt,
		})),
	]
		.filter((item) => Boolean(item.date))
		.sort((a, b) => (a.date < b.date ? 1 : -1))
		.slice(0, 50);

	const self = absoluteUrl(siteConfig.url, `/${lang}/themes/${params.theme}/rss.xml`);

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(`${siteConfig.name} — ${label}`)}</title>
    <link>${xml(absoluteUrl(siteConfig.url, route(lang, "themes", params.theme)))}</link>
    <description>${xml(dict.themes.lead)}</description>
    <language>${lang}</language>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml" />
${items
	.map(
		(item) => `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(absoluteUrl(siteConfig.url, item.url))}</link>
      <guid isPermaLink="true">${xml(absoluteUrl(siteConfig.url, item.url))}</guid>
      <pubDate>${rfc822(item.date)}</pubDate>
      <description>${xml(item.description)}</description>
    </item>`
	)
	.join("\n")}
  </channel>
</rss>
`;

	return new Response(body, {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
	});
}
