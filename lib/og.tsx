import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";
import { themeHue, type ThemeId } from "@/lib/content/taxonomy";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Satori — le moteur de rendu derrière `ImageResponse` — n'implémente qu'un
 * sous-ensemble de CSS. Les dégradés radiaux et la notation `hsl()` dans un
 * dégradé le font échouer, d'où la conversion en hexadécimal et le motif
 * reconstruit à partir de blocs plutôt que d'une trame CSS.
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
 * de fonte à chaque rendu, ce qui ajouterait une dépendance réseau. La hiérarchie
 * repose donc sur les tailles et les graisses.
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
	const accent = hslToHex(hue, 62, 38);
	const accentSoft = hslToHex(hue, 55, 88);
	const accentFaint = hslToHex(hue, 45, 95);

	// Strates décroissantes : reprise du motif de la marque, en blocs pleins que
	// Satori sait rendre là où une trame de points échouerait.
	const strata = [0.9, 0.72, 0.54, 0.38, 0.24, 0.14, 0.08];

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
				<div
					style={{
						position: "absolute",
						top: 0,
						right: 0,
						width: 300,
						height: 630,
						display: "flex",
						flexDirection: "column",
						background: accentFaint,
					}}
				>
					{strata.map((opacity, index) => (
						<div
							key={index}
							style={{
								display: "flex",
								width: "100%",
								height: 90 - index * 8,
								background: accentSoft,
								opacity,
							}}
						/>
					))}
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: 940,
						height: "100%",
						padding: "64px 0 64px 72px",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						<svg width="34" height="34" viewBox="0 0 24 24" fill="none">
							<path
								d="M12 3.2 21 20.2H3L12 3.2Z"
								stroke={accent}
								strokeWidth="1.7"
								strokeLinejoin="round"
							/>
							<path d="M7.7 13h8.6M6 16.4h12" stroke={accent} strokeWidth="1.2" opacity="0.5" />
						</svg>
						<div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#16212E" }}>
							{siteConfig.name}
						</div>
					</div>

					<div style={{ display: "flex", flexDirection: "column", width: 800 }}>
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
								fontSize: title.length > 90 ? 44 : 56,
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
									fontSize: 25,
									lineHeight: 1.4,
									color: "#566575",
								}}
							>
								{subtitle.length > 120 ? `${subtitle.slice(0, 120)}…` : subtitle}
							</div>
						)}
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
						<div style={{ display: "flex", width: 56, height: 4, background: accent }} />
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
