import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getTopic, getTopics } from "@/lib/content/topics";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getTopics(DEFAULT_LANG).map((topic) => ({ lang, slug: topic.slug })));
}

export default function Image({ params }: { params: { lang: string; slug: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);
	const topic = getTopic(lang, params.slug) ?? getTopic(DEFAULT_LANG, params.slug);

	if (!topic) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	return renderOgImage({
		eyebrow: dict.topics.title,
		title: topic.frontmatter.title,
		subtitle: topic.frontmatter.description,
		theme: topic.frontmatter.themes[0] as ThemeId,
	});
}
