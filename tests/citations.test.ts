import { describe, expect, it } from "vitest";
import {
	getCitationNeighbours,
	getGraphCoverage,
	getMostCitedWithin,
} from "@/lib/content/citations";
import { getAllStudies } from "@/lib/content/studies";

/*
  Le graphe de citations est dérivé, pas saisi : son invariant est qu'il reste
  cohérent avec les fiches. Une erreur ici afficherait des liens faux entre des
  travaux réels, ce qui est la pire sortie possible pour un annuaire dont la
  promesse est la traçabilité — pire qu'un lien manquant.
*/
describe("graphe de citations", () => {
	const studies = getAllStudies();
	const ids = new Set(studies.map((study) => study.id));

	it("ne relie que des études de l'annuaire", () => {
		for (const study of studies) {
			const { cites, citedBy } = getCitationNeighbours(study.id);
			for (const neighbour of [...cites, ...citedBy]) {
				expect(ids.has(neighbour.id)).toBe(true);
			}
		}
	});

	it("est symétrique : si A cite B, B est citée par A", () => {
		for (const study of studies) {
			for (const cited of getCitationNeighbours(study.id).cites) {
				const back = getCitationNeighbours(cited.id).citedBy.map((s) => s.id);
				expect(back).toContain(study.id);
			}
		}
	});

	it("n'inclut jamais une étude dans son propre voisinage", () => {
		for (const study of studies) {
			const { cites, citedBy } = getCitationNeighbours(study.id);
			expect(cites.map((s) => s.id)).not.toContain(study.id);
			expect(citedBy.map((s) => s.id)).not.toContain(study.id);
		}
	});

	it("ne produit aucun doublon", () => {
		for (const study of studies) {
			const { cites, citedBy } = getCitationNeighbours(study.id);
			expect(new Set(cites.map((s) => s.id)).size).toBe(cites.length);
			expect(new Set(citedBy.map((s) => s.id)).size).toBe(citedBy.length);
		}
	});

	it("renvoie un voisinage vide pour un identifiant inconnu", () => {
		const { cites, citedBy } = getCitationNeighbours("etude-qui-n-existe-pas");
		expect(cites).toEqual([]);
		expect(citedBy).toEqual([]);
	});

	it("compte autant de liens dans un sens que dans l'autre", () => {
		const outgoing = studies.reduce(
			(total, study) => total + getCitationNeighbours(study.id).cites.length,
			0
		);
		const incoming = studies.reduce(
			(total, study) => total + getCitationNeighbours(study.id).citedBy.length,
			0
		);
		expect(outgoing).toBe(incoming);
		expect(getGraphCoverage().links).toBe(outgoing);
	});

	it("classe les plus citées par décompte décroissant", () => {
		const top = getMostCitedWithin(5);
		for (let i = 1; i < top.length; i += 1) {
			expect(top[i - 1].count).toBeGreaterThanOrEqual(top[i].count);
		}
		// Un décompte annoncé doit correspondre au voisinage réel de l'étude.
		for (const { study, count } of top) {
			expect(getCitationNeighbours(study.id).citedBy.length).toBe(count);
		}
	});

	it("n'annonce jamais plus d'études connectées que l'annuaire n'en compte", () => {
		const coverage = getGraphCoverage();
		expect(coverage.studies).toBe(studies.length);
		expect(coverage.connected).toBeLessThanOrEqual(coverage.studies);
	});
});
