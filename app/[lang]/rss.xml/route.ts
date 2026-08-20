import { getAllStudies, displayTitle } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths } from "@/lib/content/paths";
import { citationLine } from "@/lib/content/citation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { absoluteUrl, route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

interface FeedItem {
	title: string;
	description: string;
	url: string;
	date: string;
	category: string;
}

/** Échappe les caractères que XML réserve. Les résumés d'éditeurs en contiennent. */
function xml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function rfc822(isoDate: string): string {
	return new Date(`${isoDate.slice(0, 10)}T12:00:00Z`).toUTCString();
}

function collect(lang: Lang): FeedItem[] {
	const dict = getDictionary(lang);
	const contentLang = getTopics(lang).length > 0 ? lang : DEFAULT_LANG;

	const items: FeedItem[] = [
		...getAllStudies().map((study) => ({
			title: displayTitle(study),
			description: study.editorial?.[lang]?.summary ?? citationLine(study),
			url: route(lang, "studies", study.id),
			date: study.addedAt,
			category: dict.studies.title,
		})),
		...getTopics(contentLang).map((topic) => ({
			title: topic.frontmatter.title,
			description: topic.frontmatter.description,
			url: route(lang, "topics", topic.slug),
			date: topic.frontmatter.updatedAt,
			category: dict.topics.title,
		})),
		...getPaths(contentLang).map((entry) => ({
			title: entry.frontmatter.title,
			description: entry.frontmatter.description,
			url: route(lang, "paths", entry.slug),
			date: entry.frontmatter.updatedAt,
			category: dict.paths.title,
		})),
		...getGlossary(contentLang).map((entry) => ({
			title: entry.frontmatter.term,
			description: entry.frontmatter.shortDefinition,
			url: route(lang, "glossary", entry.slug),
			date: entry.frontmatter.updatedAt,
			category: dict.glossary.title,
		})),
	];

	// Le flux sert à suivre les ajouts : le plus récent d'abord, plafonné pour
	// ne pas renvoyer l'intégralité du corpus à chaque requête.
	return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
}

export function GET(_request: Request, { params }: { params: { lang: string } }) {
	const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const items = collect(lang);
	const self = absoluteUrl(siteConfig.url, `/${lang}/rss.xml`);

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(`${siteConfig.name} — ${siteConfig.tagline[lang]}`)}</title>
    <link>${absoluteUrl(siteConfig.url, `/${lang}`)}</link>
    <description>${xml(siteConfig.description[lang])}</description>
    <language>${lang}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    ${items
			.map(
				(item) => `<item>
      <title>${xml(item.title)}</title>
      <link>${absoluteUrl(siteConfig.url, item.url)}</link>
      <guid isPermaLink="true">${absoluteUrl(siteConfig.url, item.url)}</guid>
      <description>${xml(item.description)}</description>
      <category>${xml(item.category)}</category>
      <pubDate>${rfc822(item.date)}</pubDate>
    </item>`
			)
			.join("\n    ")}
  </channel>
</rss>`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
