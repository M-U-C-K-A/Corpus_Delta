import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getGlossary, getGlossaryEntry } from "@/lib/content/glossary";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getGlossary(DEFAULT_LANG).map((entry) => ({ lang, term: entry.slug })));
}

export default function Image({ params }: { params: { lang: string; term: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);
	const entry = getGlossaryEntry(lang, params.term) ?? getGlossaryEntry(DEFAULT_LANG, params.term);

	if (!entry) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	return renderOgImage({
		eyebrow: dict.glossary.title,
		title: entry.frontmatter.term,
		subtitle: entry.frontmatter.shortDefinition,
		theme: entry.frontmatter.themes[0] as ThemeId,
	});
}
