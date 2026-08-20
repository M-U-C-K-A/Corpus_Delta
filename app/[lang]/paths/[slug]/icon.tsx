import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { getPath, getPaths } from "@/lib/content/paths";
import { isThemeId } from "@/lib/content/taxonomy";
import { DEFAULT_LANG, isLang, LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getPaths(DEFAULT_LANG).map((entry) => ({ lang, slug: entry.slug })));
}

export default function Icon({ params }: { params: { lang: string; slug: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const entry = getPath(lang, params.slug) ?? getPath(DEFAULT_LANG, params.slug);
	const theme = entry?.frontmatter.themes[0];
	return renderIcon(theme && isThemeId(theme) ? theme : undefined);
}
