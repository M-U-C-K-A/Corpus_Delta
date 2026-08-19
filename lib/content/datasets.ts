import fs from "node:fs";
import path from "node:path";
import { datasetSchema, type Dataset } from "@/lib/content/schemas";

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

export type { Dataset };
