import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";
import { MARK_BANDS } from "@/components/site/Wordmark";
import { themeHue, type ThemeId } from "@/lib/content/taxonomy";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Satori — le moteur derrière `ImageResponse` — n'implémente qu'un sous-ensemble
 * de CSS. Les dégradés radiaux et `hsl()` à l'intérieur d'un dégradé le font
 * échouer, d'où la conversion en hexadécimal ; les dégradés linéaires, eux,
 * passent.
 */
function hslToHex(h: number, s: number, l: number): string {
	const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
	const channel = (n: number) => {
		const k = (n + h / 30) % 12;
		const value = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(255 * value)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * Vignette de partage, rendue à la demande pour chaque page.
 *
 * Aucune police n'est chargée : `ImageResponse` téléchargerait sinon un fichier
 * de fonte à chaque rendu, ce qui ajouterait une dépendance réseau au chemin
 * critique. La hiérarchie repose donc sur les tailles et les graisses.
 */
export function renderOgImage({
	eyebrow,
	title,
	subtitle,
	theme,
	footer,
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	theme?: ThemeId;
	footer?: string;
}) {
	const hue = theme ? themeHue(theme) : 192;
	const accent = hslToHex(hue, 62, 36);
	const accentMid = hslToHex(hue, 50, 72);
	const accentSoft = hslToHex(hue, 48, 92);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					background: "#FBFAF7",
					position: "relative",
				}}
			>
				{/* Lavis de la teinte du thème, du bord droit vers le texte. */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						background: `linear-gradient(100deg, #FBFAF7 42%, ${accentSoft} 100%)`,
					}}
				/>

				{/* La marque en filigrane : le même delta strié que dans l'en-tête du site. */}
				<div
					style={{
						position: "absolute",
						top: 24,
						right: -132,
						width: 588,
						height: 588,
						display: "flex",
					}}
				>
					<svg width="588" height="588" viewBox="0 0 24 24" fill="none">
						<defs>
							<linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={accent} stopOpacity="0.48" />
								<stop offset="100%" stopColor={accentMid} stopOpacity="0.12" />
							</linearGradient>
						</defs>
						{MARK_BANDS.map((d) => (
							<path key={d} d={d} fill="url(#mark)" />
						))}
					</svg>
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: 728,
						height: "100%",
						padding: "62px 0 62px 72px",
						position: "relative",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 13 }}>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
							{MARK_BANDS.map((d) => (
								<path key={d} d={d} fill={accent} />
							))}
						</svg>
						<div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#16212E" }}>
							{siteConfig.name}
						</div>
					</div>

					<div style={{ display: "flex", flexDirection: "column", width: 620 }}>
						<div
							style={{
								display: "flex",
								fontSize: 19,
								letterSpacing: 2,
								textTransform: "uppercase",
								color: accent,
								fontWeight: 600,
							}}
						>
							{eyebrow}
						</div>
						<div
							style={{
								display: "flex",
								marginTop: 18,
								fontSize: title.length > 80 ? 42 : 52,
								lineHeight: 1.14,
								fontWeight: 600,
								color: "#16212E",
							}}
						>
							{title.length > 150 ? `${title.slice(0, 150)}…` : title}
						</div>
						{subtitle && (
							<div
								style={{
									display: "flex",
									marginTop: 20,
									fontSize: 23,
									lineHeight: 1.4,
									color: "#566575",
								}}
							>
								{subtitle.length > 120 ? `${subtitle.slice(0, 120)}…` : subtitle}
							</div>
						)}
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
						<div
							style={{
								display: "flex",
								width: 56,
								height: 4,
								background: `linear-gradient(90deg, ${accent}, ${accentMid})`,
							}}
						/>
						<div style={{ display: "flex", fontSize: 20, color: "#7A8794" }}>
							{footer ?? siteConfig.url.replace("https://", "")}
						</div>
					</div>
				</div>
			</div>
		),
		OG_SIZE
	);
}
