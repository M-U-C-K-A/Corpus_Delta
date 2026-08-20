import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getThemeCollection } from "@/lib/content/themes";
import { isThemeId, THEME_IDS, themeLabel } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => THEME_IDS.map((theme) => ({ lang, theme })));
}

export default function Image({ params }: { params: { lang: string; theme: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);

	if (!isThemeId(params.theme)) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	const { studies, glossary, topics } = getThemeCollection(lang, params.theme);

	return renderOgImage({
		eyebrow: dict.themes.title,
		title: themeLabel(params.theme, lang),
		subtitle: `${studies.length} ${dict.themes.studies} · ${glossary.length} ${dict.themes.glossary} · ${topics.length} ${dict.themes.topics}`,
		theme: params.theme,
	});
}
