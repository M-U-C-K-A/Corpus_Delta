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

/** NSIDC — étendue de la banquise arctique au minimum de septembre. */
async function arcticSeaIce(): Promise<Dataset> {
	const url = "https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv";
	const text = await fetchText(url);

	const rows = text
		.split("\n")
		.slice(1)
		.map((line) => line.split(",").map((cell) => cell.trim()))
		.filter((parts) => parts.length >= 5 && /^\d{4}$/.test(parts[0]))
		.map((parts) => ({ year: Number(parts[0]), extent: Number(parts[4]) }))
		// Les mois non couverts par les satellites portent une valeur sentinelle négative.
		.filter((row) => Number.isFinite(row.extent) && row.extent > 0);

	return {
		id: "arctic-sea-ice-september",
		title: {
			fr: "Étendue de la banquise arctique en septembre",
			en: "Arctic sea ice extent in September",
		},
		unit: "10⁶ km²",
		note: {
			fr: "Moyenne du mois de septembre, celui du minimum annuel. L'étendue compte toute surface couverte par au moins 15 % de glace ; elle recule moins vite que l'épaisseur, plus difficile à observer.",
			en: "September mean, the month of the annual minimum. Extent counts any surface with at least 15 % ice cover; it declines more slowly than thickness, which is harder to observe.",
		},
		source: {
			label: "Sea Ice Index, Version 4",
			url: "https://nsidc.org/data/g02135/",
			publisher: "National Snow and Ice Data Center",
			accessedAt: today(),
		},
		series: [{ key: "extent", label: { fr: "Étendue en septembre", en: "September extent" } }],
		rows,
	};
}

/** NOAA NCEI — contenu thermique de l'océan mondial, couche 0-2000 m. */
async function oceanHeatContent(): Promise<Dataset> {
	const url =
		"https://www.ncei.noaa.gov/data/oceans/woa/DATA_ANALYSIS/3M_HEAT_CONTENT/DATA/basin/yearly/h22-w0-2000m.dat";
	const text = await fetchText(url);

	const rows = text
		.split("\n")
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 2 && /^\d{4}\.\d+$/.test(parts[0]))
		// L'année est donnée au milieu de l'intervalle : 2005.500 désigne 2005.
		.map((parts) => ({ year: Math.floor(Number(parts[0])), heat: Number(parts[1]) }))
		.filter((row) => Number.isFinite(row.heat));

	return {
		id: "ocean-heat-content",
		title: {
			fr: "Contenu thermique de l'océan mondial",
			en: "Global ocean heat content",
		},
		unit: "10²² J",
		note: {
			fr: "Chaleur accumulée dans les 2 000 premiers mètres, en écart à la moyenne 1955-2006. L'océan absorbe environ neuf dixièmes de l'excédent d'énergie du système climatique : c'est la mesure la moins bruitée du déséquilibre.",
			en: "Heat accumulated in the top 2,000 metres, as a departure from the 1955-2006 mean. The ocean takes up around nine tenths of the climate system's energy surplus, making this the least noisy measure of the imbalance.",
		},
		source: {
			label: "Global Ocean Heat and Salt Content",
			url: "https://www.ncei.noaa.gov/access/global-ocean-heat-content/",
			publisher: "NOAA National Centers for Environmental Information",
			accessedAt: today(),
		},
		series: [{ key: "heat", label: { fr: "Océan mondial, 0-2000 m", en: "World ocean, 0-2000 m" } }],
		rows,
	};
}

/**
 * NOAA/LSA — niveau marin moyen mesuré par altimétrie satellitaire.
 *
 * Le fichier répartit la série sur cinq colonnes, une par mission successive :
 * une seule est renseignée à chaque relevé. Les missions étant inter-calibrées
 * sur la même référence, on les fusionne pour obtenir une moyenne annuelle.
 */
async function seaLevel(): Promise<Dataset> {
	const url = "https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/slr/slr_sla_gbl_keep_ref_90.csv";
	const text = await fetchText(url);

	const perYear = new Map<number, number[]>();
	for (const line of text.split("\n")) {
		if (!line.trim() || line.startsWith("#") || line.startsWith("year")) continue;
		const cells = line.split(",");
		const year = Math.floor(Number(cells[0]));
		if (!Number.isFinite(year)) continue;

		const value = cells.slice(1).map(Number).find((n) => Number.isFinite(n) && n !== 0);
		if (value === undefined) continue;

		const bucket = perYear.get(year);
		if (bucket) bucket.push(value);
		else perYear.set(year, [value]);
	}

	const rows = [...perYear.entries()]
		.sort((a, b) => a[0] - b[0])
		// Une année entamée fausserait la moyenne : le niveau a un cycle saisonnier.
		.filter(([, values]) => values.length >= 20)
		.map(([year, values]) => ({
			year,
			level: Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10,
		}));

	return {
		id: "sea-level-altimetry",
		title: {
			fr: "Niveau marin moyen global",
			en: "Global mean sea level",
		},
		unit: "mm",
		note: {
			fr: "Écart au niveau de référence, mesuré par altimétrie satellitaire depuis 1993. Les valeurs fusionnent les missions successives, inter-calibrées entre elles. Aucune correction d'ajustement isostatique n'est appliquée.",
			en: "Departure from the reference level, measured by satellite altimetry since 1993. Values merge the successive, mutually calibrated missions. No glacial isostatic adjustment is applied.",
		},
		source: {
			label: "Global Mean Sea Level — Laboratory for Satellite Altimetry",
			url: "https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/",
			publisher: "NOAA Laboratory for Satellite Altimetry",
			accessedAt: today(),
		},
		series: [{ key: "level", label: { fr: "Niveau moyen", en: "Mean level" } }],
		rows,
	};
}

/**
 * NOAA — forçage radiatif cumulé des gaz à effet de serre à longue durée de vie.
 *
 * Le tableau porte deux colonnes nommées « Total » : la première en W/m², la
 * seconde en ppm d'équivalent CO₂. C'est la première qui nous intéresse.
 */
async function greenhouseForcing(): Promise<Dataset> {
	const text = await fetchText("https://gml.noaa.gov/aggi/AGGI_Table.csv");

	const rows = text
		.split("\n")
		.map((line) => line.split(",").map((cell) => cell.trim()))
		.filter((parts) => parts.length >= 8 && /^\d{4}$/.test(parts[0]))
		.map((parts) => ({ year: Number(parts[0]), forcing: Number(parts[7]) }))
		.filter((row) => Number.isFinite(row.forcing));

	return {
		id: "greenhouse-forcing-aggi",
		title: {
			fr: "Forçage radiatif des gaz à effet de serre",
			en: "Greenhouse gas radiative forcing",
		},
		unit: "W/m²",
		note: {
			fr: "Somme du forçage exercé par les gaz à longue durée de vie — CO₂, méthane, protoxyde d'azote, halocarbures — par rapport à 1750. C'est la grandeur qui ramène tous ces gaz à une même unité physique.",
			en: "Combined forcing from the long-lived gases — CO₂, methane, nitrous oxide, halocarbons — relative to 1750. This is the quantity that reduces all of them to a single physical unit.",
		},
		source: {
			label: "The NOAA Annual Greenhouse Gas Index (AGGI)",
			url: "https://gml.noaa.gov/aggi/",
			publisher: "NOAA Global Monitoring Laboratory",
			accessedAt: today(),
		},
		series: [{ key: "forcing", label: { fr: "Forçage total", en: "Total forcing" } }],
		rows,
	};
}

/** NSIDC — étendue de la banquise antarctique en février, son minimum annuel. */
async function antarcticSeaIce(): Promise<Dataset> {
	const url = "https://noaadata.apps.nsidc.org/NOAA/G02135/south/monthly/data/S_02_extent_v4.0.csv";
	const text = await fetchText(url);

	const rows = text
		.split("\n")
		.slice(1)
		.map((line) => line.split(",").map((cell) => cell.trim()))
		.filter((parts) => parts.length >= 5 && /^\d{4}$/.test(parts[0]))
		.map((parts) => ({ year: Number(parts[0]), extent: Number(parts[4]) }))
		.filter((row) => Number.isFinite(row.extent) && row.extent > 0);

	return {
		id: "antarctic-sea-ice-february",
		title: {
			fr: "Étendue de la banquise antarctique en février",
			en: "Antarctic sea ice extent in February",
		},
		unit: "10⁶ km²",
		note: {
			fr: "Moyenne de février, mois du minimum annuel dans l'hémisphère sud. Contrairement à l'Arctique, l'Antarctique n'a montré aucune tendance nette jusqu'aux années 2010 : la rupture récente est d'autant plus remarquée.",
			en: "February mean, the month of the southern hemisphere's annual minimum. Unlike the Arctic, Antarctica showed no clear trend until the 2010s, which is what makes the recent break so remarked upon.",
		},
		source: {
			label: "Sea Ice Index, Version 4",
			url: "https://nsidc.org/data/g02135/",
			publisher: "National Snow and Ice Data Center",
			accessedAt: today(),
		},
		series: [{ key: "extent", label: { fr: "Étendue en février", en: "February extent" } }],
		rows,
	};
}

/**
 * NOAA — croissance annuelle du CO₂ atmosphérique.
 *
 * Complément indispensable de la concentration : celle-ci monte de toute façon,
 * seule sa dérivée dit si l'on freine. Elle n'a jamais été négative.
 */
async function co2GrowthRate(): Promise<Dataset> {
	const text = await fetchText("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_gr_gl.txt");

	const rows = text
		.split("\n")
		.filter((line) => line.trim() && !line.trim().startsWith("#"))
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 2 && /^\d{4}$/.test(parts[0]))
		.map((parts) => ({ year: Number(parts[0]), growth: Number(parts[1]) }))
		.filter((row) => Number.isFinite(row.growth));

	return {
		id: "co2-growth-rate",
		title: {
			fr: "Croissance annuelle du CO₂ atmosphérique",
			en: "Annual growth of atmospheric CO₂",
		},
		unit: "ppm/an",
		note: {
			fr: "Augmentation de la concentration d'une année sur l'autre, moyenne globale. La concentration monte de toute façon : c'est sa dérivée qui indique si les émissions ralentissent. Elle n'est jamais passée sous zéro.",
			en: "Year-on-year increase in concentration, global mean. Concentration rises regardless: it is its derivative that shows whether emissions are slowing. It has never fallen below zero.",
		},
		source: {
			label: "Trends in Atmospheric Carbon Dioxide — Growth Rate",
			url: "https://gml.noaa.gov/ccgg/trends/gl_gr.html",
			publisher: "NOAA Global Monitoring Laboratory",
			accessedAt: today(),
		},
		series: [{ key: "growth", label: { fr: "Croissance annuelle", en: "Annual growth" } }],
		rows,
	};
}

/**
 * Rutgers Global Snow Lab — couverture neigeuse de l'hémisphère nord en mars.
 *
 * Le fichier est mensuel ; on retient mars, fin de la saison d'accumulation,
 * où le signal du réchauffement se lit sans être noyé par la variabilité d'hiver.
 */
async function snowCover(): Promise<Dataset> {
	const text = await fetchText("https://climate.rutgers.edu/snowcover/files/moncov.nhland.txt");

	const rows = text
		.split("\n")
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 3 && /^\d{4}$/.test(parts[0]) && parts[1] === "03")
		// Le fichier donne des km² ; on ramène aux millions de km² des autres séries.
		.map((parts) => ({ year: Number(parts[0]), extent: Math.round(Number(parts[2]) / 1e4) / 100 }))
		.filter((row) => Number.isFinite(row.extent) && row.extent > 0);

	return {
		id: "snow-cover-march",
		title: {
			fr: "Couverture neigeuse de l'hémisphère nord en mars",
			en: "Northern hemisphere snow cover in March",
		},
		unit: "10⁶ km²",
		note: {
			fr: "Surface des terres émergées couvertes de neige au mois de mars, fin de la saison d'accumulation. La série satellitaire commence en 1966 et compte parmi les plus longues de la cryosphère.",
			en: "Land area under snow in March, the end of the accumulation season. The satellite record begins in 1966 and is among the longest in the cryosphere.",
		},
		source: {
			label: "Rutgers Northern Hemisphere Snow Cover Extent",
			url: "https://climate.rutgers.edu/snowcover/",
			publisher: "Rutgers University Global Snow Lab",
			accessedAt: today(),
		},
		series: [{ key: "extent", label: { fr: "Couverture en mars", en: "March cover" } }],
		rows,
	};
}


const sulfurHexafluoride = noaaGas({
	id: "sf6-global",
	url: "https://gml.noaa.gov/webdata/ccgg/trends/sf6/sf6_annmean_gl.txt",
	unit: "ppt",
	key: "sf6",
	title: {
		fr: "Concentration atmosphérique d'hexafluorure de soufre",
		en: "Atmospheric sulfur hexafluoride concentration",
	},
	seriesLabel: { fr: "SF₆ atmosphérique", en: "Atmospheric SF₆" },
	note: {
		fr: "Le SF₆ est le gaz à effet de serre le plus puissant répertorié par le GIEC : à masse égale, son effet sur un siècle vaut environ 24 000 fois celui du CO₂, et il séjourne plus de trois mille ans dans l'atmosphère. Les quantités en jeu restent mille fois moindres que celles du CO₂, d'où une unité en parties par billion.",
		en: "SF₆ is the most potent greenhouse gas listed by the IPCC: per unit mass its hundred-year effect is some 24,000 times that of CO₂, and it persists in the atmosphere for over three thousand years. The quantities involved remain a thousandfold smaller than CO₂, hence the parts-per-trillion unit.",
	},
	sourceLabel: "Trends in Atmospheric Sulfur Hexafluoride",
	sourceUrl: "https://gml.noaa.gov/ccgg/trends_sf6/",
});

/**
 * NOAA NCEI — écarts de température, terres émergées et surface de l'océan.
 *
 * Les deux moitiés du globe ne se réchauffent pas au même rythme : la mer
 * absorbe la chaleur sur une épaisseur bien plus grande que le sol, et une
 * part de l'énergie qu'elle reçoit sert à évaporer plutôt qu'à chauffer. Les
 * deux séries viennent du même producteur et de la même référence 1901-2000,
 * et tiennent donc dans un seul jeu de données à deux courbes.
 */
async function landOceanWarming(): Promise<Dataset> {
	const base = "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series/globe";

	/** Les fichiers portent trois lignes de commentaire puis un en-tête `Year,...`. */
	async function departures(surface: "land" | "ocean"): Promise<Map<number, number>> {
		const text = await fetchText(`${base}/${surface}/12/12/1880-${new Date().getFullYear()}.csv`);
		const pairs = text
			.split("\n")
			.map((line) => line.trim().split(","))
			.filter((parts) => parts.length >= 2 && /^\d{4}$/.test(parts[0]))
			.map((parts) => [Number(parts[0]), Number(parts[1])] as const)
			.filter(([, value]) => Number.isFinite(value));
		return new Map(pairs);
	}

	const [land, ocean] = await Promise.all([departures("land"), departures("ocean")]);

	// Une année n'est retenue que si les deux surfaces sont renseignées, pour que
	// l'écart entre les deux courbes se lise sans trou.
	const rows = [...land.keys()]
		.filter((year) => ocean.has(year))
		.sort((a, b) => a - b)
		.map((year) => ({ year, land: land.get(year)!, ocean: ocean.get(year)! }));

	return {
		id: "land-ocean-warming",
		title: {
			fr: "Réchauffement des terres et de l'océan",
			en: "Land and ocean warming",
		},
		unit: "°C",
		note: {
			fr: "Écarts annuels à la moyenne 1901-2000, mesurés séparément sur les terres émergées et à la surface de l'océan. Les terres se réchauffent environ deux fois plus vite : la mer répartit la chaleur reçue sur une couche bien plus épaisse, et en consacre une partie à l'évaporation. C'est pourquoi un chiffre global de réchauffement sous-estime toujours ce que connaissent les régions habitées.",
			en: "Annual departures from the 1901-2000 mean, measured separately over land and at the ocean surface. Land warms about twice as fast: the sea spreads the heat it takes up through a far thicker layer, and spends part of it on evaporation. This is why a global warming figure always understates what inhabited regions experience.",
		},
		source: {
			label: "Climate at a Glance — Global Time Series",
			url: "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series",
			publisher: "NOAA National Centers for Environmental Information",
			accessedAt: today(),
		},
		series: [
			{ key: "land", label: { fr: "Terres émergées", en: "Land" } },
			{ key: "ocean", label: { fr: "Surface de l'océan", en: "Ocean surface" } },
		],
		rows,
	};
}

/**
 * PIOMAS — volume de la banquise arctique en septembre.
 *
 * L'étendue ne dit rien de l'épaisseur : une banquise peut couvrir la même
 * surface en étant deux fois plus mince. Le volume, reconstruit par un modèle
 * contraint par les observations, recule nettement plus vite que l'étendue.
 */
async function arcticSeaIceVolume(): Promise<Dataset> {
	const url = "http://psc.apl.uw.edu/wordpress/wp-content/uploads/schweiger/ice_volume/PIOMAS.2sst.monthly.Current.v2.1.txt";
	const text = await fetchText(url);

	const rows = text
		.split("\n")
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 10 && /^\d{4}$/.test(parts[0]))
		// Colonne 10 : septembre, mois du minimum annuel. -1 marque un mois à venir.
		.map((parts) => ({ year: Number(parts[0]), volume: Number(parts[9]) }))
		.filter((row) => Number.isFinite(row.volume) && row.volume > 0);

	return {
		id: "arctic-sea-ice-volume",
		title: {
			fr: "Volume de la banquise arctique en septembre",
			en: "Arctic sea ice volume in September",
		},
		unit: "10³ km³",
		note: {
			fr: "Volume au minimum annuel, reconstruit par le modèle PIOMAS contraint par les observations de concentration et les mesures d'épaisseur disponibles. L'étendue ne renseigne que la surface : à couverture égale, une banquise amincie contient bien moins de glace, et le volume recule plus vite que l'étendue. C'est une reconstruction, non une mesure directe.",
			en: "Volume at the annual minimum, reconstructed by the PIOMAS model constrained by concentration observations and available thickness measurements. Extent reports surface only: at equal cover a thinned ice pack holds far less ice, and volume declines faster than extent. This is a reconstruction, not a direct measurement.",
		},
		source: {
			label: "PIOMAS Arctic Sea Ice Volume Reanalysis",
			url: "http://psc.apl.uw.edu/research/projects/arctic-sea-ice-volume-anomaly/",
			publisher: "Polar Science Center, University of Washington",
			accessedAt: today(),
		},
		series: [{ key: "volume", label: { fr: "Volume en septembre", en: "September volume" } }],
		rows,
	};
}

/**
 * NOAA GML — indice des gaz destructeurs d'ozone (ODGI).
 *
 * L'ODGI ramène à une échelle de 0 à 100 la charge en halogènes de la
 * stratosphère : 100 marque le maximum atteint à la fin des années 1990, 0 le
 * niveau de 1980, pris comme référence d'avant le trou d'ozone. C'est le
 * pendant, pour la couche d'ozone, de ce que l'AGGI est pour l'effet de serre —
 * et c'est l'un des rares indicateurs climatiques qui redescende.
 *
 * Deux tableaux, un par région : l'air qui alimente le vortex antarctique a
 * séjourné plus longtemps dans la stratosphère que celui des moyennes latitudes,
 * d'où un décalage de plusieurs années entre les deux courbes.
 */
async function ozoneDepletingGasIndex(): Promise<Dataset> {
	/** Colonne 14 des deux tableaux : l'ODGI calculé sur la série récente. */
	async function index(url: string): Promise<Map<number, number>> {
		const text = await fetchText(url);
		const pairs = text
			.split("\n")
			.map((line) => line.split(","))
			.filter((parts) => parts.length >= 15 && /^\d{4}$/.test(parts[0].trim()))
			.map((parts) => [Number(parts[0]), Number(parts[14])] as const)
			.filter(([, value]) => Number.isFinite(value));
		return new Map(pairs);
	}

	const [antarctic, midLatitude] = await Promise.all([
		index("https://gml.noaa.gov/odgi/odgi_table1.csv"),
		index("https://gml.noaa.gov/odgi/odgi_table2.csv"),
	]);

	const rows = [...antarctic.keys()]
		.filter((year) => midLatitude.has(year))
		.sort((a, b) => a - b)
		.map((year) => ({
			year,
			antarctic: antarctic.get(year)!,
			midLatitude: midLatitude.get(year)!,
		}));

	return {
		id: "ozone-depleting-gas-index",
		title: {
			fr: "Indice des gaz destructeurs d'ozone",
			en: "Ozone-depleting gas index",
		},
		unit: "indice",
		note: {
			fr: "Charge en halogènes de la stratosphère, ramenée à une échelle où 100 est le maximum de la fin des années 1990 et 0 le niveau de 1980. Les deux courbes mesurent la même chose dans deux régions : l'air du vortex antarctique a séjourné plus longtemps en altitude, son indice décroît donc avec plusieurs années de retard sur celui des moyennes latitudes.",
			en: "Stratospheric halogen loading, rescaled so that 100 is the late-1990s maximum and 0 the 1980 level. Both curves measure the same quantity in two regions: air in the Antarctic vortex has spent longer aloft, so its index declines several years behind the mid-latitude one.",
		},
		source: {
			label: "The NOAA Ozone Depleting Gas Index",
			url: "https://gml.noaa.gov/odgi/",
			publisher: "NOAA Global Monitoring Laboratory",
			accessedAt: today(),
		},
		series: [
			{ key: "antarctic", label: { fr: "Antarctique", en: "Antarctic" } },
			{ key: "midLatitude", label: { fr: "Moyennes latitudes", en: "Mid-latitudes" } },
		],
		rows,
	};
}

/**
 * NOAA GML — chlore stratosphérique effectif équivalent (EESC).
 *
 * La grandeur physique derrière l'ODGI : la quantité de chlore et de brome
 * réactifs effectivement présents dans la stratosphère, brome pondéré par son
 * efficacité destructrice, bien supérieure à celle du chlore.
 */
async function stratosphericHalogens(): Promise<Dataset> {
	/** Colonne 12 : l'EESC, en parties par billion. */
	async function eesc(url: string): Promise<Map<number, number>> {
		const text = await fetchText(url);
		const pairs = text
			.split("\n")
			.map((line) => line.split(","))
			.filter((parts) => parts.length >= 13 && /^\d{4}$/.test(parts[0].trim()))
			.map((parts) => [Number(parts[0]), Number(parts[12])] as const)
			.filter(([, value]) => Number.isFinite(value));
		return new Map(pairs);
	}

	const [antarctic, midLatitude] = await Promise.all([
		eesc("https://gml.noaa.gov/odgi/odgi_table1.csv"),
		eesc("https://gml.noaa.gov/odgi/odgi_table2.csv"),
	]);

	const rows = [...antarctic.keys()]
		.filter((year) => midLatitude.has(year))
		.sort((a, b) => a - b)
		.map((year) => ({
			year,
			antarctic: antarctic.get(year)!,
			midLatitude: midLatitude.get(year)!,
		}));

	return {
		id: "stratospheric-halogens-eesc",
		title: {
			fr: "Chlore stratosphérique effectif équivalent",
			en: "Equivalent effective stratospheric chlorine",
		},
		unit: "ppt",
		note: {
			fr: "Chlore et brome réactifs présents dans la stratosphère, le brome pondéré par son efficacité destructrice, environ soixante fois celle du chlore. Les valeurs tiennent compte du temps mis par l'air troposphérique pour monter et se mélanger : c'est ce délai de transport qui explique l'écart entre l'Antarctique et les moyennes latitudes.",
			en: "Reactive chlorine and bromine present in the stratosphere, bromine weighted by its destructive efficiency, roughly sixty times that of chlorine. Values account for the time tropospheric air takes to rise and mix: that transport lag is what separates the Antarctic from the mid-latitudes.",
		},
		source: {
			label: "The NOAA Ozone Depleting Gas Index",
			url: "https://gml.noaa.gov/odgi/",
			publisher: "NOAA Global Monitoring Laboratory",
			accessedAt: today(),
		},
		series: [
			{ key: "antarctic", label: { fr: "Antarctique", en: "Antarctic" } },
			{ key: "midLatitude", label: { fr: "Moyennes latitudes", en: "Mid-latitudes" } },
		],
		rows,
	};
}

/** Marégraphe de référence : la série continue la plus longue des États-Unis. */
const BATTERY = {
	station: "8518750",
	name: "The Battery, New York",
	url: "https://tidesandcurrents.noaa.gov/stationhome.html?id=8518750",
	publisher: "NOAA Center for Operational Oceanographic Products and Services",
};

/**
 * NOAA CO-OPS — marnage moyen annuel à New York.
 *
 * Le marnage — l'écart entre pleine et basse mer — n'est pas constant : il suit
 * un cycle de 18,6 ans, période de précession du plan de l'orbite lunaire. Cette
 * série, longue de plus d'un siècle, montre neuf de ces cycles, et c'est l'un
 * des rares signaux astronomiques directement lisibles dans une mesure côtière.
 *
 * Le fichier donne des moyennes mensuelles : une année incomplète est écartée,
 * parce que le marnage a aussi un cycle saisonnier qui biaiserait la moyenne.
 */
async function tidalRangeBattery(): Promise<Dataset> {
	const url =
		"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=monthly_mean" +
		`&application=corpus-delta&begin_date=18560101&end_date=${new Date().getFullYear()}1231` +
		`&datum=MSL&station=${BATTERY.station}&time_zone=GMT&units=metric&format=csv`;
	const text = await fetchText(url);

	// Colonne 11 : MN, le marnage moyen. Colonne 5 : MSL, le niveau moyen.
	const perYear = new Map<number, { range: number[]; level: number[] }>();
	for (const line of text.split("\n")) {
		const cells = line.split(",").map((cell) => cell.trim());
		if (cells.length < 12 || !/^\d{4}$/.test(cells[0])) continue;

		const year = Number(cells[0]);
		const range = Number(cells[11]);
		const level = Number(cells[5]);
		if (!Number.isFinite(range) || range <= 0) continue;

		const bucket = perYear.get(year) ?? { range: [], level: [] };
		bucket.range.push(range);
		if (Number.isFinite(level)) bucket.level.push(level);
		perYear.set(year, bucket);
	}

	const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

	const rows = [...perYear.entries()]
		.sort((a, b) => a[0] - b[0])
		// Douze mois exigés : le marnage varie aussi avec la saison.
		.filter(([, values]) => values.range.length === 12)
		.map(([year, values]) => ({
			year,
			// Conversion en centimètres : la modulation nodale vaut quelques
			// centimètres sur un marnage de près d'un mètre et demi, et resterait
			// invisible sur une échelle en mètres.
			range: Math.round(mean(values.range) * 1000) / 10,
			level: values.level.length === 12 ? Math.round(mean(values.level) * 1000) / 10 : null,
		}));

	return {
		id: "tidal-range-battery",
		title: {
			fr: "Marnage moyen annuel à New York",
			en: "Annual mean tidal range at New York",
		},
		unit: "cm",
		note: {
			fr: `Écart moyen entre pleine et basse mer au marégraphe de ${BATTERY.name}, et niveau moyen de la mer au même point. Le marnage oscille avec une période de 18,6 ans : c'est le cycle nodal lunaire, la lente rotation du plan de l'orbite de la Lune, qui fait varier l'amplitude de la force de marée. Seules les années de douze mois complets sont retenues. Valeurs converties en centimètres.`,
			en: `Mean difference between high and low water at the ${BATTERY.name} tide gauge, with mean sea level at the same point. The range oscillates with an 18.6-year period: the lunar nodal cycle, the slow rotation of the Moon's orbital plane, which modulates the amplitude of the tidal force. Only years with twelve complete months are kept. Values converted to centimetres.`,
		},
		source: {
			label: `Tides and Currents — ${BATTERY.name}`,
			url: BATTERY.url,
			publisher: BATTERY.publisher,
			accessedAt: today(),
		},
		series: [
			{ key: "range", label: { fr: "Marnage moyen", en: "Mean tidal range" } },
			{ key: "level", label: { fr: "Niveau moyen", en: "Mean sea level" } },
		],
		rows,
	};
}

/**
 * NOAA CO-OPS — jours de submersion à marée haute à New York.
 *
 * L'indicateur où la hausse du niveau marin cesse d'être une abstraction : le
 * seuil de submersion est fixe, la marée est inchangée, mais la mer monte sous
 * elle. Le nombre de jours où la marée haute passe le seuil suit donc une courbe
 * qui s'infléchit vers le haut, alors que l'élévation, elle, est régulière.
 */
async function highTideFloodingBattery(): Promise<Dataset> {
	const url =
		"https://api.tidesandcurrents.noaa.gov/dpapi/prod/webapi/htf/htf_annual.json" +
		`?station=${BATTERY.station}`;
	const payload = JSON.parse(await fetchText(url)) as {
		AnnualFloodCount?: {
			year: number;
			minCount: number | null;
			percent_completeness: number | null;
		}[];
	};

	const rows = (payload.AnnualFloodCount ?? [])
		// Une année sans relevé exploitable porte `null` : la laisser passerait
		// pour zéro jour de submersion, ce qui est l'inverse de l'information.
		// Une année en cours est écartée pour la même raison : son décompte
		// partiel se lirait comme un effondrement du nombre de submersions.
		.filter(
			(entry) =>
				typeof entry.minCount === "number" &&
				typeof entry.percent_completeness === "number" &&
				entry.percent_completeness >= 80
		)
		.sort((a, b) => a.year - b.year)
		.map((entry) => ({
			year: entry.year,
			days: entry.minCount as number,
		}));

	return {
		id: "high-tide-flooding-battery",
		title: {
			fr: "Jours de submersion à marée haute à New York",
			en: "High tide flooding days at New York",
		},
		unit: "jours",
		note: {
			fr: `Nombre de jours par an où la marée haute dépasse le seuil de submersion mineure au marégraphe de ${BATTERY.name}. Le seuil est fixe et la marée astronomique n'a pas changé : c'est le niveau moyen de la mer qui monte sous elle. Une élévation régulière produit ainsi une montée de plus en plus rapide du nombre de jours concernés. L'année portée est l'année météorologique, de mai à avril, telle que la compte le NOAA ; les années dont le relevé couvre moins de 80 % des jours sont écartées. Le décompte varie beaucoup d'une année à l'autre, au gré des tempêtes et d'El Niño : c'est la moyenne par décennie qui porte la tendance.`,
			en: `Days per year when high tide exceeds the minor flooding threshold at the ${BATTERY.name} tide gauge. The threshold is fixed and the astronomical tide is unchanged: it is mean sea level that rises beneath it. A steady rise therefore produces an ever faster increase in the number of days affected. Years are NOAA meteorological years, running May to April; years whose record covers less than 80 % of days are dropped. The count swings widely from year to year with storms and El Niño: the decadal mean is what carries the trend.`,
		},
		source: {
			label: "High Tide Flooding — Annual Flood Count",
			url: "https://tidesandcurrents.noaa.gov/high-tide-flooding/",
			publisher: BATTERY.publisher,
			accessedAt: today(),
		},
		series: [{ key: "days", label: { fr: "Jours de submersion", en: "Flooding days" } }],
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
	"arctic-sea-ice-september": arcticSeaIce,
	"ocean-heat-content": oceanHeatContent,
	"sea-level-altimetry": seaLevel,
	"greenhouse-forcing-aggi": greenhouseForcing,
	"antarctic-sea-ice-february": antarcticSeaIce,
	"co2-growth-rate": co2GrowthRate,
	"snow-cover-march": snowCover,
	"sf6-global": sulfurHexafluoride,
	"land-ocean-warming": landOceanWarming,
	"arctic-sea-ice-volume": arcticSeaIceVolume,
	"ozone-depleting-gas-index": ozoneDepletingGasIndex,
	"stratospheric-halogens-eesc": stratosphericHalogens,
	"tidal-range-battery": tidalRangeBattery,
	"high-tide-flooding-battery": highTideFloodingBattery,
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
