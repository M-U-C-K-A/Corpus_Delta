import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getDomain, getDomains } from "@/lib/content/domains";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) =>
		getDomains(DEFAULT_LANG).map((domain) => ({ lang, domain: domain.slug }))
	);
}

export default function Image({ params }: { params: { lang: string; domain: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);
	const domain = getDomain(lang, params.domain) ?? getDomain(DEFAULT_LANG, params.domain);

	if (!domain) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	return renderOgImage({
		eyebrow: dict.indicators.title,
		title: domain.frontmatter.title,
		// L'accroche plutôt que la description : une vignette se lit en passant.
		subtitle: domain.frontmatter.tagline,
		theme: domain.frontmatter.themes[0] as ThemeId,
	});
}
