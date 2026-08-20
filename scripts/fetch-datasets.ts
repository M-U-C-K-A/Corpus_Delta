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
	const response = await fetch(url, { headers: { "User-Agent": "corpus-delta-datasets" } });
	if (!response.ok) throw new Error(`${response.status} sur ${url}`);
	return response.text();
}

/**
 * Séries de gaz à effet de serre du NOAA Global Monitoring Laboratory.
 *
 * Ces fichiers partagent tous le même format en colonnes — année, moyenne,
 * incertitude — d'où un seul analyseur paramétré plutôt qu'une fonction par gaz.
 */
function noaaGas(config: {
	id: string;
	url: string;
	unit: string;
	key: string;
	title: { fr: string; en: string };
	seriesLabel: { fr: string; en: string };
	note: { fr: string; en: string };
	sourceLabel: string;
	sourceUrl: string;
}): () => Promise<Dataset> {
	return async () => {
		const text = await fetchText(config.url);

		const rows = text
			.split("\n")
			.filter((line) => line.trim() && !line.startsWith("#"))
			.map((line) => line.trim().split(/\s+/))
			.filter((parts) => parts.length >= 2 && /^\d{4}$/.test(parts[0]))
			.map((parts) => ({ year: Number(parts[0]), [config.key]: Number(parts[1]) }));

		return {
			id: config.id,
			title: config.title,
			unit: config.unit,
			note: config.note,
			source: {
				label: config.sourceLabel,
				url: config.sourceUrl,
				publisher: "NOAA Global Monitoring Laboratory",
				accessedAt: today(),
			},
			series: [{ key: config.key, label: config.seriesLabel }],
			rows,
		};
	};
}

const co2MaunaLoa = noaaGas({
	id: "co2-mauna-loa",
	url: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt",
	unit: "ppm",
	key: "co2",
	title: {
		fr: "Concentration atmosphérique de CO₂ à Mauna Loa",
		en: "Atmospheric CO₂ concentration at Mauna Loa",
	},
	seriesLabel: { fr: "CO₂ atmosphérique", en: "Atmospheric CO₂" },
	note: {
		fr: "Moyennes annuelles mesurées à l'observatoire de Mauna Loa (Hawaï), la plus longue série continue de mesure directe du CO₂ atmosphérique.",
		en: "Annual means measured at Mauna Loa Observatory (Hawaii), the longest continuous direct record of atmospheric CO₂.",
	},
	sourceLabel: "Trends in Atmospheric Carbon Dioxide",
	sourceUrl: "https://gml.noaa.gov/ccgg/trends/",
});

const methaneGlobal = noaaGas({
	id: "methane-global",
	url: "https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_annmean_gl.txt",
	unit: "ppb",
	key: "ch4",
	title: {
		fr: "Concentration atmosphérique de méthane",
		en: "Atmospheric methane concentration",
	},
	seriesLabel: { fr: "CH₄ atmosphérique", en: "Atmospheric CH₄" },
	note: {
		fr: "Moyennes annuelles globales, calculées à partir du réseau de stations de surface du NOAA.",
		en: "Global annual means derived from the NOAA surface station network.",
	},
	sourceLabel: "Trends in Atmospheric Methane",
	sourceUrl: "https://gml.noaa.gov/ccgg/trends_ch4/",
});

const nitrousOxideGlobal = noaaGas({
	id: "nitrous-oxide-global",
	url: "https://gml.noaa.gov/webdata/ccgg/trends/n2o/n2o_annmean_gl.txt",
	unit: "ppb",
	key: "n2o",
	title: {
		fr: "Concentration atmosphérique de protoxyde d'azote",
		en: "Atmospheric nitrous oxide concentration",
	},
	seriesLabel: { fr: "N₂O atmosphérique", en: "Atmospheric N₂O" },
	note: {
		fr: "Moyennes annuelles globales. Le protoxyde d'azote provient surtout de la fertilisation azotée et persiste plus d'un siècle dans l'atmosphère.",
		en: "Global annual means. Nitrous oxide comes mostly from nitrogen fertilisation and persists over a century in the atmosphere.",
	},
	sourceLabel: "Trends in Atmospheric Nitrous Oxide",
	sourceUrl: "https://gml.noaa.gov/ccgg/trends_n2o/",
});

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
	"methane-global": methaneGlobal,
	"nitrous-oxide-global": nitrousOxideGlobal,
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
