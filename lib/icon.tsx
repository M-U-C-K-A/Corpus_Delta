import { ImageResponse } from "next/og";
import { themeHue, type ThemeId } from "@/lib/content/taxonomy";
import { hslToHex } from "@/lib/hsl";

export const ICON_SIZE = { width: 32, height: 32 };
export const ICON_CONTENT_TYPE = "image/png";

/**
 * Delta strié, redessiné pour 32 pixels.
 *
 * Les cinq bandes de la marque du site se brouillent à cette taille : leurs
 * coutures tombent sous le pixel. Trois bandes plus épaisses, séparées d'un jour
 * deux fois plus large, gardent le motif lisible dans un onglet.
 */
const FAVICON_BANDS = [
	"M12 2L14.6 7.2H9.4Z",
	"M8.7 8.6H15.3L18.1 14.2H5.9Z",
	"M5.2 15.6H18.8L22 22H2Z",
] as const;

/**
 * Icône d'onglet, teintée par le thème de la page.
 *
 * Le fond est plein plutôt que transparent : une marque transparente disparaît
 * sur la barre d'onglets sombre de la moitié des navigateurs.
 */
export function renderIcon(theme?: ThemeId) {
	const hue = theme ? themeHue(theme) : 192;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: hslToHex(hue, 58, 38),
					borderRadius: 7,
				}}
			>
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none">
					{FAVICON_BANDS.map((d) => (
						<path key={d} d={d} fill={hslToHex(hue, 70, 95)} />
					))}
				</svg>
			</div>
		),
		ICON_SIZE
	);
}
