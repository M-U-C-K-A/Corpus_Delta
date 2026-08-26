import { describe, expect, it } from "vitest";
import { absoluteUrl, route, SECTIONS } from "@/lib/routes";
import { LANGS } from "@/lib/i18n/config";

describe("route", () => {
	it("produit l'accueil d'une langue sans section", () => {
		expect(route("fr")).toBe("/fr");
		expect(route("en")).toBe("/en");
	});

	it("traduit le segment de section", () => {
		expect(route("fr", "studies")).toBe("/fr/etudes");
		expect(route("en", "studies")).toBe("/en/studies");
		expect(route("fr", "glossary", "canicule")).toBe("/fr/glossaire/canicule");
	});

	it("ignore les segments vides plutôt que de doubler les barres", () => {
		expect(route("fr", "studies", "")).toBe("/fr/etudes");
	});

	// Une URL sans barre initiale casserait metadataBase et le sitemap.
	it("commence toujours par une seule barre", () => {
		for (const lang of LANGS) {
			for (const section of Object.keys(SECTIONS) as (keyof typeof SECTIONS)[]) {
				const url = route(lang, section, "slug");
				expect(url.startsWith("/")).toBe(true);
				expect(url).not.toContain("//");
			}
		}
	});
});

describe("absoluteUrl", () => {
	it("recompose une URL absolue", () => {
		expect(absoluteUrl("https://exemple.org", "/fr/etudes")).toBe("https://exemple.org/fr/etudes");
	});

	// Le chemin est absolu : il doit remplacer celui de la base, pas s'y ajouter.
	it("ne concatène pas au chemin de la base", () => {
		expect(absoluteUrl("https://exemple.org/base", "/fr")).toBe("https://exemple.org/fr");
	});
});
