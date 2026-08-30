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
	["quoi-de-neuf", "updates"],
	["contribuer", "contribute"],
	["methodologie", "methodology"],
	["a-propos", "about"],
	["auteur", "author"],
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
	experimental: {
		/*
		  Les vignettes de partage sont rendues à la demande, et leurs chargeurs
		  lisent le contenu via `path.join(process.cwd(), "content", …)`. Ce chemin
		  étant construit à l'exécution, le traçage de dépendances de Next ne peut
		  pas le découvrir : aucun fichier de `content/` n'était embarqué, le
		  chargeur ne trouvait rien et toutes les vignettes retombaient sur l'image
		  « page introuvable ». On les déclare donc explicitement.
		*/
		outputFileTracingIncludes: {
			"/[lang]/glossary/[term]/opengraph-image": ["./content/**/*"],
			"/[lang]/paths/[slug]/opengraph-image": ["./content/**/*"],
			"/[lang]/studies/[id]/opengraph-image": ["./content/**/*"],
			"/[lang]/topics/[slug]/opengraph-image": ["./content/**/*"],
			"/[lang]/themes/[theme]/opengraph-image": ["./content/**/*"],
			// Mêmes contraintes pour les icônes d'onglet, qui lisent le thème du contenu.
			"/[lang]/glossary/[term]/icon": ["./content/**/*"],
			"/[lang]/paths/[slug]/icon": ["./content/**/*"],
			"/[lang]/studies/[id]/icon": ["./content/**/*"],
			"/[lang]/topics/[slug]/icon": ["./content/**/*"],
		},
	},
};

export default nextConfig;
