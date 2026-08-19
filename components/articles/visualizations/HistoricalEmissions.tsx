"use client"

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, BarChart, CartesianGrid, XAxis, Bar, Line, Tooltip, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const historicalData = [
	{ year: "1990", US: 5570, China: 2150, India: 590, UE: 4200 },
	{ year: "2000", US: 5920, China: 3200, India: 850, UE: 4000 },
	{ year: "2010", US: 5400, China: 8000, India: 1800, UE: 3500 },
	{ year: "2020", US: 4570, China: 10065, India: 2654, UE: 2850 },
];

const chartConfig = {
	China: {
		label: "China",
		color: "hsl(var(--chart-1))",
	},
	India: {
		label: "India",
		color: "hsl(var(--chart-2))",
	},
	US: {
		label: "United States",
		color: "hsl(var(--chart-3))",
	},
	UE: {
		label: "European Union",
		color: "hsl(var(--chart-4))",
	},
} satisfies ChartConfig

export function HistoricalEmissionsChart() {
	return (
		<ChartContainer config={chartConfig} className="max-h-[300px] w-full">
			<AreaChart
				accessibilityLayer
				data={historicalData}
				margin={{
					left: 12,
					right: 12,
				}}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="year"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => value.slice(0, 4)}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dot" />}
				/>
				<Area
					dataKey="US"
					type="natural"
					fill="var(--color-US)"
					fillOpacity={0.4}
					stroke="var(--color-US)"
					stackId="a"
				/>
				<Area
					dataKey="China"
					type="natural"
					fill="var(--color-China)"
					fillOpacity={0.4}
					stroke="var(--color-China)"
					stackId="a"
				/>
				<Area
					dataKey="India"
					type="natural"
					fill="var(--color-India)"
					fillOpacity={0.4}
					stroke="var(--color-India)"
					stackId="a"
				/>
				<Area
					dataKey="UE"
					type="natural"
					fill="var(--color-UE)"
					fillOpacity={0.4}
					stroke="var(--color-UE)"
					stackId="a"
				/>
			</AreaChart>
		</ChartContainer>
	)
}

export function HistoricalEmissionsTable() {
	return (
		<Table>
			<TableCaption>Historical CO₂ Emissions Data (in Mt)</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Country</TableHead>
					<TableHead>CO₂ Emissions (Mt) - 1990</TableHead>
					<TableHead>CO₂ Emissions (Mt) - 2020</TableHead>
					<TableHead>Growth (%)</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">United States</TableCell>
					<TableCell>5,570</TableCell>
					<TableCell>4,570</TableCell>
					<TableCell>-18%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">China</TableCell>
					<TableCell>2,150</TableCell>
					<TableCell>10,065</TableCell>
					<TableCell>368%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">India</TableCell>
					<TableCell>590</TableCell>
					<TableCell>2,654</TableCell>
					<TableCell>349%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">European Union</TableCell>
					<TableCell>4,200</TableCell>
					<TableCell>2,850</TableCell>
					<TableCell>-32%</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className="text-right">-</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	)
}
