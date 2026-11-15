"use client";

import { RadarChart } from "@/components/dither-kit/radar-chart";
import { Radar } from "@/components/dither-kit/radar";
import { Legend } from "@/components/dither-kit/legend";
import { Tooltip } from "@/components/dither-kit/tooltip";
import { LOCALES, type Lang } from "@/lib/i18n/config";

export interface ThemeRadarRow {
	axis: string;
	studies: number;
	glossary: number;
}

/**
 * Forme du corpus, thème par thème.
 *
 * Deux séries plutôt qu'une : un thème peut être riche en littérature et pauvre
 * en vocabulaire, ou l'inverse, et c'est précisément ce déséquilibre qui indique
 * où le corpus demande du travail.
 */
export function ThemeRadar({
	rows,
	labels,
	lang,
}: {
	rows: ThemeRadarRow[];
	labels: { studies: string; glossary: string };
	lang: Lang;
}) {
	/*
	  Sans formateur, l'infobulle de dither-kit retombe sur `toLocaleString()`
	  sans argument, qui suit la locale du navigateur et non celle de la page.
	*/
	const format = new Intl.NumberFormat(LOCALES[lang]);

	return (
		<div className="not-prose h-[26rem] w-full">
			<RadarChart
				data={rows}
				nameKey="axis"
				config={{
					studies: { label: labels.studies, color: "blue" },
					glossary: { label: labels.glossary, color: "orange" },
				}}
			>
				<Radar dataKey="studies" />
				<Radar dataKey="glossary" />
				<Legend />
				<Tooltip labelKey="axis" valueFormatter={(value) => format.format(value)} />
			</RadarChart>
		</div>
	);
}
