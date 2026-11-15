import { getDataset, type Dataset } from "@/lib/content/datasets";

/**
 * Lecture d'une série chiffrée : ce dont une vignette d'indicateur a besoin,
 * extrait une seule fois et au même endroit.
 *
 * Rien n'est arrondi ni lissé ici. La seule décision prise est d'ignorer les
 * points manquants, parce qu'un `null` traité comme un zéro transformerait une
 * lacune de relevé en effondrement de la grandeur mesurée.
 */

export interface SeriesPoint {
	year: number;
	value: number;
}

export interface SeriesSummary {
	dataset: Dataset;
	key: string;
	points: SeriesPoint[];
	first: SeriesPoint;
	last: SeriesPoint;
	/** Écart entre le premier et le dernier point retenus. */
	change: number;
	/** Pente moyenne par an sur l'ensemble de la série. */
	perYear: number;
	/** Pente moyenne par an sur les trente dernières années, si elles existent. */
	recentPerYear: number | null;
	/** Extremums, pour situer la dernière valeur dans l'histoire de la série. */
	min: SeriesPoint;
	max: SeriesPoint;
}

export function readSeries(datasetId: string, seriesKey?: string): SeriesSummary | null {
	const dataset = getDataset(datasetId);
	if (!dataset) return null;

	const key = seriesKey ?? dataset.series[0]?.key;
	if (!key) return null;

	const points = dataset.rows
		.map((row) => ({ year: Number(row.year), value: row[key] }))
		.filter(
			(point): point is SeriesPoint =>
				Number.isFinite(point.year) && typeof point.value === "number"
		)
		.sort((a, b) => a.year - b.year);

	if (points.length < 2) return null;

	const first = points[0];
	const last = points[points.length - 1];
	const span = last.year - first.year;

	const slope = (from: SeriesPoint, to: SeriesPoint) =>
		to.year === from.year ? 0 : (to.value - from.value) / (to.year - from.year);

	const recentStart = points.find((point) => point.year >= last.year - 30);
	const recentPerYear =
		recentStart && recentStart.year < last.year ? slope(recentStart, last) : null;

	let min = first;
	let max = first;
	for (const point of points) {
		if (point.value < min.value) min = point;
		if (point.value > max.value) max = point;
	}

	return {
		dataset,
		key,
		points,
		first,
		last,
		change: last.value - first.value,
		perYear: span === 0 ? 0 : (last.value - first.value) / span,
		recentPerYear,
		min,
		max,
	};
}

/**
 * Moyennes par décennie, pour les graphiques qui comparent des périodes.
 *
 * Une décennie entamée est conservée, mais signalée : elle porte moins
 * d'années que les autres, et la masquer reviendrait à cacher la plus récente,
 * qui est souvent la plus parlante.
 */
export interface DecadeBucket {
	decade: number;
	mean: number;
	years: number;
	partial: boolean;
}

export function byDecade(points: readonly SeriesPoint[]): DecadeBucket[] {
	const buckets = new Map<number, number[]>();
	for (const point of points) {
		const decade = Math.floor(point.year / 10) * 10;
		const bucket = buckets.get(decade);
		if (bucket) bucket.push(point.value);
		else buckets.set(decade, [point.value]);
	}

	return [...buckets.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([decade, values]) => ({
			decade,
			mean: values.reduce((sum, v) => sum + v, 0) / values.length,
			years: values.length,
			partial: values.length < 10,
		}));
}
