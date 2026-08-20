/**
 * Agrégation des projections CMIP6 publiées par l'Atlas interactif du GIEC.
 *
 * Le dépôt IPCC-WG1/Atlas met à disposition, pour chaque modèle et chaque
 * expérience, la moyenne mensuelle de température agrégée sur les régions de
 * référence du GIEC — dont une colonne « world ». C'est la seule source
 * exploitable par script que j'aie trouvée pour comparer les scénarios : les
 * fourchettes du tableau SPM.1 ne sont publiées qu'en PDF.
 *
 * Conséquence à ne pas taire : ce que l'on calcule ici est la dispersion brute
 * de l'ensemble CMIP6, pas la fourchette *évaluée* par le GIEC, qui est plus
 * resserrée parce que l'AR6 a pondéré les modèles à forte sensibilité. Les deux
 * ne sont pas interchangeables, et la note du jeu de données le dit.
 */
const RAW = "https://raw.githubusercontent.com/IPCC-WG1/Atlas/main";
const TAS_DIR = `${RAW}/datasets-aggregated-regionally/data/CMIP6/CMIP6_tas_landsea`;
const TREE_API = "https://api.github.com/repos/IPCC-WG1/Atlas/git/trees/main?recursive=1";

export const SSPS = ["ssp126", "ssp245", "ssp370", "ssp585"] as const;
export type Ssp = (typeof SSPS)[number];

/** Période de référence préindustrielle retenue par l'AR6. */
const BASELINE = { from: 1850, to: 1900 };

export const ATLAS_SOURCE = {
	label: "Interactive Atlas — CMIP6 aggregated regionally",
	url: "https://github.com/IPCC-WG1/Atlas",
	publisher: "IPCC WGI Interactive Atlas",
};

type Member = { model: string; run: string };

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, { headers: { "User-Agent": "corpus-delta-datasets" } });
	if (!response.ok) throw new Error(`${response.status} sur ${url}`);
	return response.text();
}

/**
 * Membres disposant à la fois du run historique et des quatre scénarios.
 *
 * L'ensemble est établi une fois et réutilisé pour les quatre scénarios : si la
 * composition variait de l'un à l'autre, l'écart affiché entre deux courbes
 * mélangerait l'effet du scénario et celui du changement de modèles.
 */
export async function commonMembers(): Promise<Member[]> {
	const tree = (await (await fetch(TREE_API)).json()) as { tree: { path: string }[] };
	const prefix = "datasets-aggregated-regionally/data/CMIP6/CMIP6_tas_landsea/";

	const byExperiment = new Map<string, Set<string>>();
	for (const { path } of tree.tree) {
		if (!path.startsWith(prefix) || !path.endsWith(".csv")) continue;
		// CMIP6_<modèle>_<expérience>_<run>.csv
		const [, model, experiment, run] = path.slice(prefix.length, -4).split("_");
		if (!byExperiment.has(experiment)) byExperiment.set(experiment, new Set());
		byExperiment.get(experiment)?.add(`${model}|${run}`);
	}

	const required = ["historical", ...SSPS];
	const sets = required.map((experiment) => byExperiment.get(experiment) ?? new Set<string>());

	return [...sets[0]]
		.filter((key) => sets.every((set) => set.has(key)))
		.sort()
		.map((key) => {
			const [model, run] = key.split("|");
			return { model, run };
		});
}

/** Moyennes annuelles globales d'un fichier, en ne gardant que les années complètes. */
async function annualWorldMeans(member: Member, experiment: string): Promise<Map<number, number>> {
	const text = await fetchText(`${TAS_DIR}/CMIP6_${member.model}_${experiment}_${member.run}.csv`);
	const lines = text.split("\n").filter((line) => line.trim() && !line.startsWith("#"));

	const columns = lines[0].split(",").map((cell) => cell.replace(/"/g, "").trim());
	const worldIndex = columns.indexOf("world");
	if (worldIndex === -1) throw new Error(`colonne « world » absente pour ${member.model}/${experiment}`);

	const months = new Map<number, number[]>();
	for (const line of lines.slice(1)) {
		const cells = line.split(",");
		const year = Number(cells[0].replace(/"/g, "").slice(0, 4));
		const value = Number(cells[worldIndex]);
		if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
		const bucket = months.get(year);
		if (bucket) bucket.push(value);
		else months.set(year, [value]);
	}

	const annual = new Map<number, number>();
	for (const [year, values] of months) {
		// Une année amputée décalerait la moyenne vers la saison surreprésentée.
		if (values.length !== 12) continue;
		annual.set(year, values.reduce((sum, value) => sum + value, 0) / 12);
	}
	return annual;
}

function percentile(sorted: number[], p: number): number {
	const rank = (sorted.length - 1) * p;
	const low = Math.floor(rank);
	const high = Math.ceil(rank);
	if (low === high) return sorted[low];
	return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

/** Exécute `task` sur chaque entrée, `limit` en vol — le dépôt sert 145 fichiers. */
async function mapLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
	const results = new Array<R>(items.length);
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await task(items[index]);
			}
		})
	);
	return results;
}

export type ScenarioStats = {
	members: number;
	/** Anomalie par rapport à 1850-1900, par scénario puis par année. */
	byScenario: Record<Ssp, Map<number, { median: number; low: number; high: number }>>;
};

export async function scenarioWarming(): Promise<ScenarioStats> {
	const members = await commonMembers();
	console.log(`    ${members.length} modèles CMIP6 disposant de l'historique et des quatre scénarios`);

	// Une ligne de base par modèle : l'anomalie doit être calculée contre le
	// préindustriel du modèle lui-même, jamais contre celui d'un autre.
	const baselines = new Map<string, number>();
	await mapLimit(members, 6, async (member) => {
		const annual = await annualWorldMeans(member, "historical");
		const reference = [...annual.entries()]
			.filter(([year]) => year >= BASELINE.from && year <= BASELINE.to)
			.map(([, value]) => value);
		if (reference.length === 0) throw new Error(`aucune année ${BASELINE.from}-${BASELINE.to} pour ${member.model}`);
		baselines.set(member.model, reference.reduce((sum, value) => sum + value, 0) / reference.length);
	});

	const byScenario = {} as ScenarioStats["byScenario"];

	for (const scenario of SSPS) {
		const perYear = new Map<number, number[]>();

		await mapLimit(members, 6, async (member) => {
			const annual = await annualWorldMeans(member, scenario);
			const baseline = baselines.get(member.model);
			if (baseline === undefined) return;
			for (const [year, value] of annual) {
				const bucket = perYear.get(year);
				if (bucket) bucket.push(value - baseline);
				else perYear.set(year, [value - baseline]);
			}
		});

		const stats = new Map<number, { median: number; low: number; high: number }>();
		for (const [year, anomalies] of [...perYear.entries()].sort((a, b) => a[0] - b[0])) {
			// Une année à laquelle tous les modèles ne contribuent pas ferait
			// bouger la médiane pour une raison qui n'est pas climatique.
			if (anomalies.length !== members.length) continue;
			const sorted = [...anomalies].sort((a, b) => a - b);
			stats.set(year, {
				median: percentile(sorted, 0.5),
				low: percentile(sorted, 0.05),
				high: percentile(sorted, 0.95),
			});
		}

		byScenario[scenario] = stats;
		console.log(`    ${scenario} — ${stats.size} années`);
	}

	return { members: members.length, byScenario };
}

/**
 * Année de franchissement de chaque palier de réchauffement, telle que publiée
 * par l'Atlas. L'année donnée est le *centre* d'une fenêtre glissante de 20 ans :
 * le palier est atteint sur la période [n-9, n+10], pas à l'année n.
 *
 * Le fichier distingue deux absences, et les confondre fausserait tout :
 * « NA » signale un palier non atteint avant 2100 — le modèle compte, mais pas
 * dans les franchissements — tandis que « 9999 » signale un modèle qui n'a pas
 * tourné ce scénario, et qui doit sortir entièrement du décompte.
 */
export async function warmingLevelYears(): Promise<{
	levels: {
		level: number;
		byScenario: Record<Ssp, { median: number | null; reaching: number; available: number }>;
	}[];
}> {
	const text = await fetchText(`${RAW}/warming-levels/CMIP6_Atlas_WarmingLevels.csv`);
	const lines = text.split("\n").filter((line) => line.trim());
	const header = lines[0].split(",").map((cell) => cell.trim());
	const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));

	const NO_DATA = "9999";

	const levels = [1.5, 2, 3, 4].map((level) => {
		const byScenario = {} as Record<Ssp, { median: number | null; reaching: number; available: number }>;

		for (const scenario of SSPS) {
			const index = header.indexOf(`${level}_${scenario}`);
			const cells = rows.map((row) => row[index]).filter((cell) => cell !== NO_DATA);
			const years = cells
				.map((cell) => Number(cell))
				.filter((year) => Number.isFinite(year))
				.sort((a, b) => a - b);

			byScenario[scenario] = {
				// Pas de médiane si moins de la moitié des modèles disponibles
				// franchissent le palier : elle décrirait une minorité.
				median: years.length > cells.length / 2 ? Math.round(percentile(years, 0.5)) : null,
				reaching: years.length,
				available: cells.length,
			};
		}

		return { level, byScenario };
	});

	return { levels };
}
