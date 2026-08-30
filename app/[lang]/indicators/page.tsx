import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, TriangleAlert, TrendingUp } from "lucide-react";
import { ChartCanvas, type ChartKind } from "@/components/mdx/ChartCanvas";
import type { DitherColor } from "@/lib/content/chart-colors";
import { DitherSurface } from "@/components/site/Dither";
import { getDataset } from "@/lib/content/datasets";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);

	return pageMetadata({
		lang: params.lang,
		title: dict.indicators.title,
		description: dict.indicators.lead,
		section: "indicators",
	});
}

/** Ordre d'affichage et forme du graphique, choisis pour chaque série. */
const INDICATORS: { id: string; kind: ChartKind; decimals: number; color: DitherColor }[] = [
	// Les causes d'abord, les réponses du système ensuite.
	{ id: "co2-mauna-loa", kind: "area", decimals: 2, color: "orange" },
	{ id: "methane-global", kind: "line", decimals: 1, color: "purple" },
	{ id: "nitrous-oxide-global", kind: "line", decimals: 1, color: "pink" },
	{ id: "greenhouse-forcing-aggi", kind: "area", decimals: 3, color: "orange" },
	{ id: "temperature-anomaly-gistemp", kind: "area", decimals: 2, color: "red" },
	{ id: "ocean-heat-content", kind: "area", decimals: 1, color: "red" },
	{ id: "sea-level-altimetry", kind: "area", decimals: 1, color: "blue" },
	{ id: "arctic-sea-ice-september", kind: "line", decimals: 2, color: "blue" },
	{ id: "antarctic-sea-ice-february", kind: "line", decimals: 2, color: "blue" },
	{ id: "snow-cover-march", kind: "line", decimals: 2, color: "grey" },
	{ id: "co2-growth-rate", kind: "bar", decimals: 2, color: "orange" },
];

/** Scénarios comparés, du plus sobre au plus émetteur — l'ordre porte le sens. */
const SCENARIOS = ["ssp126", "ssp245", "ssp370", "ssp585"] as const;

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

	const projections = getDataset("ssp-warming-projections");
	const levels = getDataset("ssp-warming-levels");

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

				{projections && levels && (
					<section aria-labelledby="scenarios" className="rule mt-16 pt-12">
						<h2 id="scenarios" className="font-serif text-2xl font-semibold tracking-tight">
							{dict.indicators.scenariosTitle}
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
							{dict.indicators.scenariosLead}
						</p>

						<div className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-6">
							<ChartCanvas
								kind="line"
								rows={projections.rows}
								series={projections.series.map((item) => ({
									key: item.key,
									label: item.label[lang] ?? item.label.fr ?? item.key,
								}))}
								xKey="year"
								unit={projections.unit}
								height={320}
								decimals={2}
							/>
						</div>

						{projections.note?.[lang] && (
							<p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
								{projections.note[lang]}
							</p>
						)}

						<p className="mt-2 text-xs text-muted-foreground">
							{projections.source.publisher} —{" "}
							<a
								href={projections.source.url}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
							>
								{projections.source.label}
								<ArrowUpRight className="h-3 w-3" aria-hidden="true" />
							</a>
							{projections.source.accessedAt &&
								` · ${dict.common.updatedOn.toLowerCase()} ${formatDate(projections.source.accessedAt, lang)}`}
						</p>

						{/*
						  L'avertissement précède le tableau : cette page ne présente que
						  des mesures, et rien ne doit laisser croire que ces courbes en
						  sont. La distinction n'a de valeur que si elle est lue avant.
						*/}
						<div className="mt-6 max-w-3xl rounded-lg border border-border bg-muted/30 p-4">
							<h3 className="inline-flex items-center gap-1.5 text-sm font-medium">
								<TriangleAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
								{dict.indicators.scenariosCaveat}
							</h3>
							<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
								{dict.indicators.scenariosCaveatBody}
							</p>
						</div>

						<h3 className="mt-12 font-serif text-xl font-semibold tracking-tight">
							{dict.indicators.levelsTitle}
						</h3>
						<p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
							{dict.indicators.levelsLead}
						</p>

						<div className="mt-5 overflow-x-auto">
							<table className="w-full min-w-[34rem] border-collapse text-sm">
								<thead>
									<tr className="border-b border-border text-left">
										<th scope="col" className="py-2 pr-3 font-medium">
											{dict.indicators.levelsColumn}
										</th>
										{SCENARIOS.map((scenario) => (
											<th key={scenario} scope="col" className="px-3 py-2 text-right font-medium">
												{levels.series.find((item) => item.key === scenario)?.label[lang] ?? scenario}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{levels.rows.map((row) => (
										<tr key={String(row.level)} className="border-b border-border/60 last:border-0">
											<th scope="row" className="py-2.5 pr-3 text-left font-normal tabular">
												+{Number(row.level).toFixed(1)} °C
											</th>
											{SCENARIOS.map((scenario) => {
												const year = row[scenario];
												const reaching = row[`${scenario}_reaching`];
												const available = row[`${scenario}_available`];

												return (
													<td key={scenario} className="px-3 py-2.5 text-right">
														{typeof year === "number" ? (
															<span className="font-medium tabular">{year}</span>
														) : (
															<>
																{/* Le tiret seul serait muet à l'oreille d'un lecteur d'écran. */}
																<span aria-hidden="true" className="text-muted-foreground">
																	—
																</span>
																<span className="sr-only">{dict.indicators.levelsNever}</span>
															</>
														)}
														<span className="mt-0.5 block text-xs text-muted-foreground tabular">
															{String(reaching)}{" "}
															{reaching === 1
																? dict.indicators.levelsModelOne
																: dict.indicators.levelsModels}{" "}
															{String(available)}
														</span>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{levels.note?.[lang] && (
							<p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
								{levels.note[lang]}
							</p>
						)}
					</section>
				)}
			</div>
		</div>
	);
}
