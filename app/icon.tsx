import { renderIcon, ICON_SIZE, ICON_CONTENT_TYPE } from "@/lib/icon";

export const size = ICON_SIZE;
export const contentType = ICON_CONTENT_TYPE;

/** Icône par défaut, servie pour toute page sans thème propre. */
export default function Icon() {
	return renderIcon();
}
