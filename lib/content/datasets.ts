import fs from "node:fs";
import path from "node:path";
import { datasetSchema, type Dataset } from "@/lib/content/schemas";
import type { Lang } from "@/lib/i18n/config";

const DATASETS_DIR = path.join(process.cwd(), "data", "datasets");

const cache = new Map<string, Dataset>();

export function getDataset(id: string): Dataset | null {
	const cached = cache.get(id);
	if (cached) return cached;

	const file = path.join(DATASETS_DIR, `${id}.json`);
	if (!fs.existsSync(file)) return null;

	const parsed = datasetSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
	if (!parsed.success) {
		throw new Error(
			`Jeu de données invalide : data/datasets/${id}.json\n${parsed.error.issues
				.map((issue) => `  · ${issue.path.join(".")} — ${issue.message}`)
				.join("\n")}`
		);
	}

	cache.set(id, parsed.data);
	return parsed.data;
}

/**
 * Unité dans la langue demandée, avec repli sur le français.
 *
 * Renvoie une chaîne vide plutôt qu'`undefined` : les appelants la concatènent,
 * et un « undefined » affiché serait pire qu'une unité absente.
 */
export function unitFor(dataset: Dataset, lang: Lang): string {
	return dataset.unit?.[lang] ?? dataset.unit?.fr ?? "";
}

export type { Dataset };
