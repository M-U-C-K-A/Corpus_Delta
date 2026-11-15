import { EnergyStoreFigure } from "@/components/iso/EnergyStore";
import { GreenhouseFigure } from "@/components/iso/Greenhouse";
import { IceAlbedoFigure } from "@/components/iso/IceAlbedo";
import { OzoneFigure } from "@/components/iso/Ozone";
import { TideFigure, TideGaugeFigure } from "@/components/iso/Tides";

/**
 * Registre des figures isométriques, par nom.
 *
 * Les dossiers déclarent leur figure dans le frontmatter et l'appellent dans le
 * corps du texte : le nom doit donc être une donnée, pas un import. La table est
 * fermée volontairement — une figure est un objet dessiné à la main, pas un
 * gabarit paramétrable, et l'on veut savoir lesquelles existent.
 */
export const FIGURES = {
	"effet-de-serre": GreenhouseFigure,
	"couche-ozone": OzoneFigure,
	"albedo-banquise": IceAlbedoFigure,
	"stock-energie": EnergyStoreFigure,
	"maree-lunaire": TideFigure,
	"maregraphe": TideGaugeFigure,
} as const;

export type FigureName = keyof typeof FIGURES;

export const FIGURE_NAMES = Object.keys(FIGURES) as FigureName[];

export function isFigureName(value: string): value is FigureName {
	return value in FIGURES;
}

/** Rend la figure nommée. Un nom inconnu est une erreur de build, pas un trou. */
export function Mechanism({ name }: { name: string }) {
	if (!isFigureName(name)) {
		throw new Error(
			`<Mechanism name="${name}"> : figure inconnue. Disponibles : ${FIGURE_NAMES.join(", ")}.`
		);
	}

	const Figure = FIGURES[name];
	return <Figure />;
}
