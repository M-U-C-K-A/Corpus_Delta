import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { isThemeId, THEME_IDS } from "@/lib/content/taxonomy";
import { LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.flatMap((lang) => THEME_IDS.map((theme) => ({ lang, theme })));
}

export default function Icon({ params }: { params: { theme: string } }) {
	return renderIcon(isThemeId(params.theme) ? params.theme : undefined);
}
