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
import { ATLAS_SOURCE, scenarioWarming, SSPS, warmingLevelYears } from "./lib/cmip6";

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

/**
 * Comparateur de scénarios : trajectoires de réchauffement selon les SSP.
 *
 * Les colonnes `_low` / `_high` portent la dispersion de l'ensemble et ne sont
 * pas tracées ; elles alimentent le tableau de synthèse de la page Indicateurs.
 */
async function sspWarmingProjections(): Promise<Dataset> {
	const { members, byScenario } = await scenarioWarming();

	const years = [...byScenario.ssp126.keys()].sort((a, b) => a - b);
	const round = (value: number) => Math.round(value * 100) / 100;

	const rows = years
		// Horizon commun aux quatre scénarios : sans cela, une comparaison de fin
		// de siècle porterait sur une année où l'un d'eux ne dit plus rien.
		.filter((year) => SSPS.every((scenario) => byScenario[scenario].has(year)))
		.map((year) => {
			const row: Record<string, number> = { year };
			for (const scenario of SSPS) {
				const stats = byScenario[scenario].get(year);
				if (!stats) continue;
				row[scenario] = round(stats.median);
				row[`${scenario}_low`] = round(stats.low);
				row[`${scenario}_high`] = round(stats.high);
			}
			return row;
		});

	return {
		id: "ssp-warming-projections",
		title: {
			fr: "Réchauffement projeté selon les scénarios SSP",
			en: "Projected warming by SSP scenario",
		},
		unit: "°C",
		note: {
			fr: `Médiane de ${members} modèles CMIP6, en écart à la moyenne 1850-1900 de chaque modèle. Le même ensemble sert aux quatre scénarios. Il s'agit de la dispersion brute de CMIP6, et non des fourchettes évaluées par le GIEC, qui sont plus resserrées.`,
			en: `Median of ${members} CMIP6 models, as a departure from each model's own 1850-1900 mean. The same ensemble is used for all four scenarios. This is the raw CMIP6 spread, not the IPCC's assessed ranges, which are narrower.`,
		},
		source: { ...ATLAS_SOURCE, accessedAt: today() },
		series: [
			{ key: "ssp126", label: { fr: "SSP1-2.6", en: "SSP1-2.6" } },
			{ key: "ssp245", label: { fr: "SSP2-4.5", en: "SSP2-4.5" } },
			{ key: "ssp370", label: { fr: "SSP3-7.0", en: "SSP3-7.0" } },
			{ key: "ssp585", label: { fr: "SSP5-8.5", en: "SSP5-8.5" } },
		],
		rows,
	};
}

/** Année médiane de franchissement de chaque palier de réchauffement. */
async function sspWarmingLevels(): Promise<Dataset> {
	const { levels } = await warmingLevelYears();

	const rows = levels.map(({ level, byScenario }) => {
		const row: Record<string, number | null> = { level };
		for (const scenario of SSPS) {
			row[scenario] = byScenario[scenario].median;
			row[`${scenario}_reaching`] = byScenario[scenario].reaching;
			row[`${scenario}_available`] = byScenario[scenario].available;
		}
		return row;
	});

	return {
		id: "ssp-warming-levels",
		title: {
			fr: "Année de franchissement des paliers de réchauffement",
			en: "Year each warming level is crossed",
		},
		note: {
			fr: "Année médiane des modèles CMIP6 qui franchissent le palier, telle que publiée par l'Atlas du GIEC. L'année indiquée est le centre d'une fenêtre de 20 ans : le palier est atteint sur la période [n-9, n+10]. Une case vide signale un palier qu'au plus la moitié des modèles atteignent avant 2100.",
			en: "Median year across the CMIP6 models that cross the level, as published by the IPCC Atlas. The year given is the centre of a 20-year window: the level is reached over [n-9, n+10]. An empty cell marks a level that at most half the models reach before 2100.",
		},
		source: {
			...ATLAS_SOURCE,
			label: "Interactive Atlas — CMIP6 warming levels",
			accessedAt: today(),
		},
		series: [
			{ key: "ssp126", label: { fr: "SSP1-2.6", en: "SSP1-2.6" } },
			{ key: "ssp245", label: { fr: "SSP2-4.5", en: "SSP2-4.5" } },
			{ key: "ssp370", label: { fr: "SSP3-7.0", en: "SSP3-7.0" } },
			{ key: "ssp585", label: { fr: "SSP5-8.5", en: "SSP5-8.5" } },
		],
		rows,
	};
}

const BUILDERS: Record<string, () => Promise<Dataset>> = {
	"co2-mauna-loa": co2MaunaLoa,
	"methane-global": methaneGlobal,
	"nitrous-oxide-global": nitrousOxideGlobal,
	"temperature-anomaly-gistemp": temperatureAnomaly,
	"ssp-warming-projections": sspWarmingProjections,
	"ssp-warming-levels": sspWarmingLevels,
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
