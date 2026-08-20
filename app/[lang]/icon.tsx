import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";
import { LANGS } from "@/lib/i18n/config";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export default function Icon() {
	return renderIcon();
}
