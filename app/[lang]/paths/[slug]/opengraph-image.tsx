import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getPath, getPaths } from "@/lib/content/paths";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getPaths(DEFAULT_LANG).map((entry) => ({ lang, slug: entry.slug })));
}

export default function Image({ params }: { params: { lang: string; slug: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);
	const entry = getPath(lang, params.slug) ?? getPath(DEFAULT_LANG, params.slug);

	if (!entry) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	return renderOgImage({
		eyebrow: dict.paths.title,
		title: entry.frontmatter.title,
		subtitle: entry.frontmatter.description,
		theme: entry.frontmatter.themes[0] as ThemeId,
		footer: `${entry.frontmatter.steps.length} ${dict.paths.steps}`,
	});
}
