"use client";

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export type ChartKind = "line" | "area" | "bar";

export interface SeriesSpec {
	key: string;
	label: string;
}

const PALETTE = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

/**
 * Rendu du graphique uniquement : le chargement du jeu de données, sa validation
 * et l'affichage de la source restent côté serveur, dans `Chart`.
 */
export function ChartCanvas({
	kind,
	rows,
	series,
	xKey,
	unit,
	height = 300,
}: {
	kind: ChartKind;
	rows: Record<string, number | string | null>[];
	series: SeriesSpec[];
	xKey: string;
	unit: string;
	height?: number;
}) {
	const axis = {
		stroke: "hsl(var(--muted-foreground))",
		fontSize: 12,
		tickLine: false,
	} as const;

	const common = (
		<>
			<CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
			<XAxis dataKey={xKey} {...axis} axisLine={{ stroke: "hsl(var(--border))" }} />
			<YAxis
				{...axis}
				axisLine={false}
				width={56}
				label={{
					value: unit,
					angle: -90,
					position: "insideLeft",
					style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
				}}
			/>
			<Tooltip
				contentStyle={{
					background: "hsl(var(--popover))",
					border: "1px solid hsl(var(--border))",
					borderRadius: "var(--radius)",
					fontSize: 12,
					color: "hsl(var(--popover-foreground))",
				}}
				labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
			/>
			{series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
		</>
	);

	return (
		<div className="not-prose" style={{ width: "100%", height }}>
			<ResponsiveContainer width="100%" height="100%">
				{kind === "bar" ? (
					<BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
						{common}
						{series.map((item, index) => (
							<Bar key={item.key} dataKey={item.key} name={item.label} fill={PALETTE[index % PALETTE.length]} />
						))}
					</BarChart>
				) : kind === "area" ? (
					<AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
						{common}
						{series.map((item, index) => (
							<Area
								key={item.key}
								type="monotone"
								dataKey={item.key}
								name={item.label}
								stroke={PALETTE[index % PALETTE.length]}
								fill={PALETTE[index % PALETTE.length]}
								fillOpacity={0.15}
								strokeWidth={2}
							/>
						))}
					</AreaChart>
				) : (
					<LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
						{common}
						{series.map((item, index) => (
							<Line
								key={item.key}
								type="monotone"
								dataKey={item.key}
								name={item.label}
								stroke={PALETTE[index % PALETTE.length]}
								strokeWidth={2}
								dot={false}
							/>
						))}
					</LineChart>
				)}
			</ResponsiveContainer>
		</div>
	);
}
