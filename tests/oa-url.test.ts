import { describe, expect, it } from "vitest";
import { cleanOaUrl } from "@/scripts/lib/oa-url";

describe("cleanOaUrl", () => {
	it("laisse passer une URL http(s) propre", () => {
		expect(cleanOaUrl("https://example.org/article.pdf")).toBe("https://example.org/article.pdf");
		expect(cleanOaUrl("http://example.org/a")).toBe("http://example.org/a");
	});

	/*
	  Le cas qui a motivé ce garde-fou : OpenAlex servait cette valeur telle
	  quelle pour le budget méthane 2025, et le site publiait un lien en 404.
	*/
	it("écarte l'URL malformée du budget méthane", () => {
		expect(
			cleanOaUrl("https://eprints.gla.ac.uk/view/journal_volume/Earth_System_Science_Data.html>,")
		).toBeNull();
	});

	it("écarte les valeurs absentes ou vides", () => {
		expect(cleanOaUrl(null)).toBeNull();
		expect(cleanOaUrl(undefined)).toBeNull();
		expect(cleanOaUrl("   ")).toBeNull();
		expect(cleanOaUrl(42)).toBeNull();
	});

	it("écarte ce qui n'est pas une adresse http(s)", () => {
		expect(cleanOaUrl("pas une url")).toBeNull();
		expect(cleanOaUrl("ftp://example.org/a")).toBeNull();
		expect(cleanOaUrl("javascript:alert(1)")).toBeNull();
	});

	it("supprime les espaces de bordure d'une URL par ailleurs valide", () => {
		expect(cleanOaUrl("  https://example.org/a  ")).toBe("https://example.org/a");
	});
});
