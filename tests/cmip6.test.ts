import { describe, expect, it } from "vitest";
import { percentile } from "@/scripts/lib/cmip6";

/*
  Le cœur statistique du comparateur SSP. Une erreur ici ne casserait aucun
  build : elle publierait simplement une médiane fausse, sur la seule page du
  site qui présente des projections plutôt que des mesures.
*/
describe("percentile", () => {
	it("renvoie les bornes exactes", () => {
		const values = [1, 2, 3, 4, 5];
		expect(percentile(values, 0)).toBe(1);
		expect(percentile(values, 1)).toBe(5);
	});

	it("prend la valeur centrale sur un effectif impair", () => {
		expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
	});

	it("interpole sur un effectif pair", () => {
		expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
	});

	it("interpole entre deux rangs", () => {
		// rang = (4-1) × 0,25 = 0,75 → entre 10 et 20, aux trois quarts
		expect(percentile([10, 20, 30, 40], 0.25)).toBeCloseTo(17.5, 10);
	});

	it("gère un effectif de un", () => {
		expect(percentile([42], 0.5)).toBe(42);
		expect(percentile([42], 0.05)).toBe(42);
	});
});
