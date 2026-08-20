import type { ThemeId } from "@/lib/content/taxonomy";

/** Les sept teintes nommées de Dither Kit. Réexportées ici pour éviter d'importer
 * un module tiers depuis du code serveur. */
export type DitherColor = "green" | "blue" | "purple" | "pink" | "orange" | "red" | "grey";

/**
 * Projection de nos treize thèmes sur les sept teintes de la palette tramée.
 *
 * Ce module ne porte pas de directive `"use client"` : la correspondance est
 * consultée depuis des composants serveur (`<Chart>`, page Indicateurs) autant
 * que depuis le canvas client. Une fonction exportée par un module client ne peut
 * pas être appelée côté serveur — elle n'y est qu'une référence sérialisable.
 */
const THEME_COLOR: Record<ThemeId, DitherColor> = {
	observation: "blue",
	modelisation: "purple",
	carbone: "orange",
	chaleur: "red",
	cryosphere: "blue",
	ocean: "blue",
	eau: "green",
	biodiversite: "green",
	sante: "pink",
	agriculture: "green",
	energie: "orange",
	politiques: "purple",
	risques: "red",
};

export function colorForTheme(theme: ThemeId | undefined): DitherColor {
	return theme ? THEME_COLOR[theme] : "blue";
}

/** Cycle utilisé quand un graphique porte plusieurs séries. */
export const SERIES_COLORS: DitherColor[] = [
	"blue",
	"orange",
	"green",
	"purple",
	"pink",
	"red",
];
