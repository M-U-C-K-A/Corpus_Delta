"use client"

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, BarChart, CartesianGrid, XAxis, Bar, Line, Tooltip, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
	{ sector: 'Manufacturing', China: 50, India: 35, US: 20 },
	{ sector: 'Energy', China: 30, India: 45, US: 40 },
	{ sector: 'Agriculture', China: 5, India: 15, US: 10 },
	{ sector: 'Transportation', China: 10, India: 5, US: 30 },
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

export function SectoralEmissionsChart() {
	return (
		<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
			<BarChart accessibilityLayer data={chartData}>
				<XAxis
					dataKey="sector"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) => value}
				/>
				<ChartLegend content={<ChartLegendContent />} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="US" fill="var(--color-US)" radius={4} />
				<Bar dataKey="China" fill="var(--color-China)" radius={4} />
				<Bar dataKey="India" fill="var(--color-India)" radius={4} />
			</BarChart>
		</ChartContainer>
	)
}

export function SectoralEmissionsTable() {
	return (
		<Table>
			<TableCaption>Sectoral Contribution to CO₂ Emissions (%)</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Sector</TableHead>
					<TableHead>China (%)</TableHead>
					<TableHead>India (%)</TableHead>
					<TableHead>United States (%)</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Manufacturing</TableCell>
					<TableCell>50%</TableCell>
					<TableCell>35%</TableCell>
					<TableCell>20%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Energy</TableCell>
					<TableCell>30%</TableCell>
					<TableCell>45%</TableCell>
					<TableCell>40%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Agriculture</TableCell>
					<TableCell>5%</TableCell>
					<TableCell>15%</TableCell>
					<TableCell>10%</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Transportation</TableCell>
					<TableCell>10%</TableCell>
					<TableCell>5%</TableCell>
					<TableCell>30%</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	)
}
