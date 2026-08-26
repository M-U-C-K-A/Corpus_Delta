import { describe, expect, it } from "vitest";
import { hslToHex } from "@/lib/hsl";
import { THEME_IDS, themeHue } from "@/lib/content/taxonomy";

describe("hslToHex", () => {
	it("convertit les cas de référence", () => {
		expect(hslToHex(0, 0, 0)).toBe("#000000");
		expect(hslToHex(0, 0, 100)).toBe("#ffffff");
		expect(hslToHex(0, 100, 50)).toBe("#ff0000");
		expect(hslToHex(120, 100, 50)).toBe("#00ff00");
		expect(hslToHex(240, 100, 50)).toBe("#0000ff");
	});

	/*
	  Satori refuse toute couleur qu'il ne sait pas analyser, et l'échec ne se
	  voit qu'au rendu de la vignette. Les treize teintes doivent donc produire
	  un hexadécimal bien formé, aux saturations réellement employées.
	*/
	it("produit un hexadécimal valide pour les treize thèmes", () => {
		for (const theme of THEME_IDS) {
			const hue = themeHue(theme);
			for (const [s, l] of [
				[62, 36],
				[50, 72],
				[48, 92],
				[58, 38],
				[70, 95],
			]) {
				expect(hslToHex(hue, s, l)).toMatch(/^#[0-9a-f]{6}$/);
			}
		}
	});
});
