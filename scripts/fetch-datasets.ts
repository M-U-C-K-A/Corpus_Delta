/**
 * Régénère les jeux de données servant aux graphiques, depuis leur source primaire.
 *
 *   pnpm datasets:fetch            # tout
 *   pnpm datasets:fetch co2-mauna-loa
 *
 * Même principe que pour les études : les valeurs ne sont pas saisies à la main.
 * Chaque source a son propre format, d'où une fonction par jeu de données. La date
 * de relevé est enregistrée et affichée sous le graphique.
 */
import fs from "node:fs";
import path from "node:path";
import { datasetSchema, type Dataset } from "../lib/content/schemas";

const OUTPUT_DIR = path.join(process.cwd(), "data", "datasets");

const today = () => new Date().toISOString().slice(0, 10);

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, { headers: { "User-Agent": "climatotheque-datasets" } });
	if (!response.ok) throw new Error(`${response.status} sur ${url}`);
	return response.text();
}

/** NOAA Global Monitoring Laboratory — moyennes annuelles de CO₂ à Mauna Loa. */
async function co2MaunaLoa(): Promise<Dataset> {
	const url = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt";
	const text = await fetchText(url);

	const rows = text
		.split("\n")
		.filter((line) => line.trim() && !line.startsWith("#"))
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 2 && /^\d{4}$/.test(parts[0]))
		.map((parts) => ({ year: Number(parts[0]), co2: Number(parts[1]) }));

	return {
		id: "co2-mauna-loa",
		title: {
			fr: "Concentration atmosphérique de CO₂ à Mauna Loa",
			en: "Atmospheric CO₂ concentration at Mauna Loa",
		},
		unit: "ppm",
		note: {
			fr: "Moyennes annuelles mesurées à l'observatoire de Mauna Loa (Hawaï), la plus longue série continue de mesure directe du CO₂ atmosphérique.",
			en: "Annual means measured at Mauna Loa Observatory (Hawaii), the longest continuous direct record of atmospheric CO₂.",
		},
		source: {
			label: "Trends in Atmospheric Carbon Dioxide",
			url: "https://gml.noaa.gov/ccgg/trends/",
			publisher: "NOAA Global Monitoring Laboratory",
			accessedAt: today(),
		},
		series: [{ key: "co2", label: { fr: "CO₂ atmosphérique", en: "Atmospheric CO₂" } }],
		rows,
	};
}

/** NASA GISS — anomalie de température moyenne globale, référence 1951-1980. */
async function temperatureAnomaly(): Promise<Dataset> {
	const url = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";
	const text = await fetchText(url);

	const lines = text.split("\n");
	const headerIndex = lines.findIndex((line) => line.startsWith("Year,"));
	const columns = lines[headerIndex].split(",");
	// La colonne « J-D » porte la moyenne de janvier à décembre.
	const annualIndex = columns.indexOf("J-D");

	const rows = lines
		.slice(headerIndex + 1)
		.map((line) => line.split(","))
		.filter((parts) => /^\d{4}$/.test(parts[0]) && parts[annualIndex] && !parts[annualIndex].includes("*"))
		.map((parts) => ({ year: Number(parts[0]), anomaly: Number(parts[annualIndex]) }));

	return {
		id: "temperature-anomaly-gistemp",
		title: {
			fr: "Anomalie de température moyenne globale",
			en: "Global mean temperature anomaly",
		},
		unit: "°C",
		note: {
			fr: "Écart à la moyenne de la période de référence 1951-1980, surfaces terrestres et océaniques combinées.",
			en: "Departure from the 1951-1980 reference period, combining land and ocean surfaces.",
		},
		source: {
			label: "GISS Surface Temperature Analysis (GISTEMP v4)",
			url: "https://data.giss.nasa.gov/gistemp/",
			publisher: "NASA Goddard Institute for Space Studies",
			accessedAt: today(),
		},
		series: [{ key: "anomaly", label: { fr: "Anomalie annuelle", en: "Annual anomaly" } }],
		rows,
	};
}

const BUILDERS: Record<string, () => Promise<Dataset>> = {
	"co2-mauna-loa": co2MaunaLoa,
	"temperature-anomaly-gistemp": temperatureAnomaly,
};

async function main(): Promise<void> {
	const requested = process.argv.slice(2);
	const ids = requested.length > 0 ? requested : Object.keys(BUILDERS);

	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	for (const id of ids) {
		const builder = BUILDERS[id];
		if (!builder) {
			console.error(`  ✗ jeu de données inconnu : ${id}`);
			process.exitCode = 1;
			continue;
		}

		const dataset = datasetSchema.parse(await builder());
		const file = path.join(OUTPUT_DIR, `${dataset.id}.json`);
		fs.writeFileSync(file, JSON.stringify(dataset, null, "\t") + "\n");
		console.log(`  ✓ ${dataset.id} — ${dataset.rows.length} points`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
