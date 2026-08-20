import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { getGlossary, getGlossaryEntry } from "@/lib/content/glossary";
import { isThemeId } from "@/lib/content/taxonomy";
import { DEFAULT_LANG, isLang, LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getGlossary(DEFAULT_LANG).map((entry) => ({ lang, term: entry.slug })));
}

export default function Icon({ params }: { params: { lang: string; term: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const entry = getGlossaryEntry(lang, params.term) ?? getGlossaryEntry(DEFAULT_LANG, params.term);
	const theme = entry?.frontmatter.themes[0];
	return renderIcon(theme && isThemeId(theme) ? theme : undefined);
}
