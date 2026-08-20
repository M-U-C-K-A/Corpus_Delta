"use client";

import { AreaChart, LineChart } from "@/components/dither-kit/area-chart";
import { BarChart } from "@/components/dither-kit/bar-chart";
import { Area, Line } from "@/components/dither-kit/area";
import { Bar } from "@/components/dither-kit/bar";
import { Grid } from "@/components/dither-kit/grid";
import { Legend } from "@/components/dither-kit/legend";
import { Tooltip } from "@/components/dither-kit/tooltip";
import { XAxis } from "@/components/dither-kit/x-axis";
import { YAxis } from "@/components/dither-kit/y-axis";
import { SERIES_COLORS, type DitherColor } from "@/lib/content/chart-colors";

export type ChartKind = "line" | "area" | "bar";

export interface SeriesSpec {
	key: string;
	label: string;
}

/**
 * Rendu d'un graphique tramé. Le chargement du jeu de données, sa validation et
 * l'affichage de la source restent côté serveur, dans `Chart`.
 *
 * Le tramage n'est pas décoratif ici : c'est le même vocabulaire visuel que les
 * bandeaux de thème, ce qui relie les graphiques au reste du site.
 */
export function ChartCanvas({
	kind,
	rows,
	series,
	xKey,
	unit,
	height = 300,
	color,
	decimals = 2,
}: {
	kind: ChartKind;
	rows: Record<string, number | string | null>[];
	series: SeriesSpec[];
	xKey: string;
	unit?: string;
	height?: number;
	color?: DitherColor;
	decimals?: number;
}) {
	const config = Object.fromEntries(
		series.map((item, index) => [
			item.key,
			{
				label: item.label,
				color: series.length === 1 ? (color ?? "blue") : SERIES_COLORS[index % SERIES_COLORS.length],
			},
		])
	);

	const formatValue = (value: number) =>
		// Même nombre de décimales pour toute la série : dans une infobulle qui
		// compare quatre scénarios, « 2,7 » aligné sous « 1,96 » se lit mal.
		`${new Intl.NumberFormat("fr-FR", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value)}${unit ? ` ${unit}` : ""}`;

	/*
	  Un tableau, surtout pas un fragment : la racine du graphique trie ses enfants
	  par couche de rendu avec `Children.forEach`, qui aplatit les tableaux mais ne
	  traverse pas les fragments. Enveloppés dans un fragment, ces éléments étaient
	  tous versés dans la couche SVG — la grille passait devant le tracé, et
	  l'infobulle, qui est un <div>, se retrouvait dans le <svg> où elle ne pouvait
	  pas s'afficher.
	*/
	const chrome = [
		<Grid key="grid" />,
		<XAxis key="x" dataKey={xKey} />,
		<YAxis key="y" tickFormatter={(value) => String(value)} />,
		<Tooltip key="tooltip" labelKey={xKey} valueFormatter={(value) => formatValue(value)} />,
		series.length > 1 ? <Legend key="legend" /> : null,
	];

	return (
		<div className="not-prose w-full" style={{ height }}>
			{kind === "bar" ? (
				<BarChart data={rows} config={config}>
					{chrome}
					{series.map((item) => (
						<Bar key={item.key} dataKey={item.key} />
					))}
				</BarChart>
			) : kind === "line" ? (
				<LineChart data={rows} config={config}>
					{chrome}
					{series.map((item) => (
						<Line key={item.key} dataKey={item.key} />
					))}
				</LineChart>
			) : (
				<AreaChart data={rows} config={config}>
					{chrome}
					{series.map((item) => (
						<Area key={item.key} dataKey={item.key} />
					))}
				</AreaChart>
			)}
		</div>
	);
}
