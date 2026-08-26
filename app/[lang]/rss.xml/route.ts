import { getTimeline } from "@/lib/content/timeline";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

/**
 * Prérendu : le contenu est connu au build, et une route dynamique ne saurait
 * pas lire content/ à l'exécution — le flux serait alors vide en production.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
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

export function GET(_request: Request, { params }: { params: { lang: string } }) {
	const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const items = getTimeline(lang, 50);
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
