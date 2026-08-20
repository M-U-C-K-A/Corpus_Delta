import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getAllStudies, getStudy, displayTitle } from "@/lib/content/studies";
import { citationLine } from "@/lib/content/citation";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, DEFAULT_LANG } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = siteConfig.name;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getAllStudies().map((study) => ({ lang, id: study.id })));
}

export default function Image({ params }: { params: { lang: string; id: string } }) {
	const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(lang);
	const study = getStudy(params.id);

	if (!study) {
		return renderOgImage({ eyebrow: siteConfig.name, title: dict.errors.notFoundTitle });
	}

	return renderOgImage({
		eyebrow: dict.studies.title,
		title: displayTitle(study),
		subtitle: citationLine(study),
		theme: study.themes[0] as ThemeId,
		footer: study.doi ? `doi.org/${study.doi}` : undefined,
	});
}
