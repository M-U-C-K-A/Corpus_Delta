import { describe, expect, it } from "vitest";
import { AGEING_YEARS, getAllStudies, getNewerStudies } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { isThemeId } from "@/lib/content/taxonomy";
import { LANGS } from "@/lib/i18n/config";

/*
  Ces tests n'affirment rien sur le contenu — ils vérifient des propriétés qui
  doivent tenir quel que soit le corpus. Coder en dur « 101 études » rendrait la
  suite fausse au prochain ajout.
*/
describe("corpus", () => {
	const studies = getAllStudies();

	it("n'est pas vide", () => {
		expect(studies.length).toBeGreaterThan(0);
	});

	it("n'a pas d'identifiant en double", () => {
		expect(new Set(studies.map((s) => s.id)).size).toBe(studies.length);
	});

	it("ne rattache les études qu'à des thèmes déclarés", () => {
		for (const study of studies) {
			expect(study.themes.length).toBeGreaterThan(0);
			for (const theme of study.themes) expect(isThemeId(theme)).toBe(true);
		}
	});

	// Une URL malformée passée à travers republierait le 404 corrigé plus tôt.
	it("ne porte aucune URL d'accès ouvert malformée", () => {
		for (const study of studies) {
			const url = study.openAccess?.url;
			if (!url) continue;
			expect(url).not.toMatch(/[<>\s]/);
			expect(() => new URL(url)).not.toThrow();
		}
	});

	it("garde le glossaire aligné entre les deux langues", () => {
		const [reference, ...others] = LANGS.map((lang) => getGlossary(lang).map((e) => e.slug).sort());
		for (const other of others) expect(other).toEqual(reference);
	});
});

describe("getNewerStudies", () => {
	const studies = getAllStudies();
	const old = studies.filter((s) => new Date().getFullYear() - s.year >= AGEING_YEARS);

	it("ne propose que des travaux nettement plus récents et du même thème", () => {
		for (const study of old.slice(0, 20)) {
			for (const candidate of getNewerStudies(study)) {
				expect(candidate.year).toBeGreaterThanOrEqual(study.year + AGEING_YEARS);
				expect(candidate.themes.some((t) => study.themes.includes(t))).toBe(true);
				expect(candidate.id).not.toBe(study.id);
			}
		}
	});

	it("ne renvoie rien pour la publication la plus récente", () => {
		const newest = [...studies].sort((a, b) => b.year - a.year)[0];
		expect(getNewerStudies(newest)).toHaveLength(0);
	});
});
