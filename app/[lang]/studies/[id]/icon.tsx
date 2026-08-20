import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { getAllStudies, getStudy } from "@/lib/content/studies";
import { isThemeId } from "@/lib/content/taxonomy";
import { LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getAllStudies().map((study) => ({ lang, id: study.id })));
}

export default function Icon({ params }: { params: { id: string } }) {
	const theme = getStudy(params.id)?.themes[0];
	return renderIcon(theme && isThemeId(theme) ? theme : undefined);
}
