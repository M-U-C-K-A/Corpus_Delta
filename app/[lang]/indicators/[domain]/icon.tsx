import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { getDomain, getDomains } from "@/lib/content/domains";
import { isThemeId } from "@/lib/content/taxonomy";
import { DEFAULT_LANG, isLang, LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.flatMap((lang) =>
		getDomains(DEFAULT_LANG).map((entry) => ({ lang, domain: entry.slug }))
	);
}

export default function Icon({ params }: { params: { lang: string; domain: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const domain = getDomain(lang, params.domain) ?? getDomain(DEFAULT_LANG, params.domain);
	const theme = domain?.frontmatter.themes[0];
	return renderIcon(theme && isThemeId(theme) ? theme : undefined);
}
