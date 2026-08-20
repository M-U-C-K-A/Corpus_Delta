import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getCorpusStats } from "@/lib/content/studies";
import { siteConfig } from "@/lib/site-config";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export default function Image({ params }: { params: { lang: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const stats = getCorpusStats();

	return renderOgImage({
		eyebrow: siteConfig.tagline[lang],
		title: siteConfig.name,
		subtitle: siteConfig.description[lang],
		footer: `${stats.total} ${lang === "fr" ? "études référencées" : "studies indexed"}`,
	});
}
