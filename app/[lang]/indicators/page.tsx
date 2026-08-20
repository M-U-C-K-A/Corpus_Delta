import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { ChartCanvas, type ChartKind } from "@/components/mdx/ChartCanvas";
import type { DitherColor } from "@/lib/content/chart-colors";
import { DitherSurface } from "@/components/site/Dither";
import { getDataset } from "@/lib/content/datasets";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);

	return {
		title: dict.indicators.title,
		description: dict.indicators.lead,
		alternates: {
			canonical: route(params.lang, "indicators"),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "indicators")])),
		},
	};
}

/** Ordre d'affichage et forme du graphique, choisis pour chaque série. */
const INDICATORS: { id: string; kind: ChartKind; decimals: number; color: DitherColor }[] = [
	{ id: "co2-mauna-loa", kind: "area", decimals: 2, color: "orange" },
	{ id: "temperature-anomaly-gistemp", kind: "area", decimals: 2, color: "red" },
	{ id: "methane-global", kind: "line", decimals: 1, color: "purple" },
	{ id: "nitrous-oxide-global", kind: "line", decimals: 1, color: "blue" },
];

function summarise(rows: Record<string, number | string | null>[], key: string) {
	const values = rows
		.map((row) => ({ year: Number(row.year), value: row[key] }))
		.filter((point): point is { year: number; value: number } => typeof point.value === "number");

	if (values.length === 0) return null;

	const first = values[0];
	const last = values[values.length - 1];
	return { first, last, change: last.value - first.value, count: values.length };
}

export default function IndicatorsPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;
	const dict = getDictionary(lang);

	const indicators = INDICATORS.map((config) => {
		const dataset = getDataset(config.id);
		if (!dataset) return null;
		const key = dataset.series[0].key;
		const stats = summarise(dataset.rows, key);
		return stats ? { config, dataset, key, stats } : null;
	}).filter((item): item is NonNullable<typeof item> => item !== null);

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{dict.indicators.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.indicators.lead}
					</p>
				</div>
			</section>

			<div className="container py-12">
				{/*
				  Bandeau de synthèse : la dernière valeur de chaque série, telle que
				  publiée par l'organisme qui la mesure. Aucun arrondi maison.
				*/}
				<dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
					{indicators.map(({ config, dataset, stats }) => (
						<div key={config.id} className="bg-card p-5">
							<dt className="text-xs uppercase tracking-[0.07em] text-muted-foreground">
								{dataset.title[lang] ?? dataset.title.fr}
							</dt>
							<dd className="mt-2">
								<span className="font-serif text-3xl font-semibold tabular">
									{stats.last.value.toFixed(config.decimals)}
								</span>
								<span className="ml-1.5 text-sm text-muted-foreground">{dataset.unit}</span>
								<span className="mt-1 block text-xs text-muted-foreground tabular">
									{stats.last.year}
								</span>
								<span className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
									<TrendingUp className="h-3 w-3" aria-hidden="true" />
									{stats.change > 0 ? "+" : ""}
									{stats.change.toFixed(config.decimals)} {dataset.unit}{" "}
									<span className="tabular">
										({stats.first.year}–{stats.last.year})
									</span>
								</span>
							</dd>
						</div>
					))}
				</dl>

				<p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					<span className="font-medium text-foreground">{dict.indicators.howToRead} — </span>
					{dict.indicators.howToReadBody}
				</p>

				<div className="mt-12 space-y-14">
					{indicators.map(({ config, dataset, key, stats }) => (
						<section key={config.id} aria-labelledby={`indicator-${config.id}`}>
							<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
								<h2
									id={`indicator-${config.id}`}
									className="font-serif text-2xl font-semibold tracking-tight"
								>
									{dataset.title[lang] ?? dataset.title.fr}
								</h2>
								<p className="text-xs text-muted-foreground tabular">
									{formatNumber(stats.count, lang)} {dict.indicators.points} · {stats.first.year}–
									{stats.last.year}
								</p>
							</div>

							{dataset.note?.[lang] && (
								<p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
									{dataset.note[lang]}
								</p>
							)}

							<div className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-6">
								<ChartCanvas
									kind={config.kind}
									rows={dataset.rows}
									series={[
										{
											key,
											label: dataset.series[0].label[lang] ?? dataset.series[0].label.fr ?? key,
										},
									]}
									xKey="year"
									unit={dataset.unit}
									height={280}
									color={config.color}
									decimals={config.decimals}
								/>
							</div>

							<p className="mt-3 text-xs text-muted-foreground">
								{dataset.source.publisher} —{" "}
								<a
									href={dataset.source.url}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
								>
									{dataset.source.label}
									<ArrowUpRight className="h-3 w-3" aria-hidden="true" />
								</a>
								{dataset.source.accessedAt &&
									` · ${dict.common.updatedOn.toLowerCase()} ${formatDate(dataset.source.accessedAt, lang)}`}
							</p>
						</section>
					))}
				</div>
			</div>
		</div>
	);
}
