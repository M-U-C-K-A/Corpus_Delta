/**
 * Les dossiers de routes ne peuvent pas dépendre de la langue : l'arborescence
 * utilise donc des segments anglais, et ces réécritures exposent des URLs
 * françaises. La table doit rester synchronisée avec `SECTIONS` dans lib/routes.ts.
 */
const LOCALISED_SEGMENTS = [
	["etudes", "studies"],
	["glossaire", "glossary"],
	["dossiers", "topics"],
	["parcours", "paths"],
	["indicateurs", "indicators"],
	["contribuer", "contribute"],
	["methodologie", "methodology"],
	["a-propos", "about"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	async rewrites() {
		return LOCALISED_SEGMENTS.flatMap(([localised, canonical]) => [
			{ source: `/fr/${localised}`, destination: `/fr/${canonical}` },
			{ source: `/fr/${localised}/:path*`, destination: `/fr/${canonical}/:path*` },
		]);
	},
	images: {
		formats: ["image/avif", "image/webp"],
	},
};

export default nextConfig;
