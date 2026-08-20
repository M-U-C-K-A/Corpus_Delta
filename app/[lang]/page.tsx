import Link from "next/link";
import { ArrowRight, BookMarked, Clock, Layers, Library, Quote, Unlock } from "lucide-react";
import { notFound } from "next/navigation";
import { DitherBand, DitherSurface } from "@/components/site/Dither";
import { HomeSearch } from "@/components/site/HomeSearch";
import { StudyList } from "@/components/site/StudyCard";
import { ThemeTagList } from "@/components/site/ThemeTag";
import { getAllStudies, getCorpusStats } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths, resolveSteps, totalMinutes } from "@/lib/content/paths";
import { getDataset } from "@/lib/content/datasets";
import { THEME_IDS, themeHue, themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary, interpolate } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

/** Séries mises en avant sur l'accueil, avec leur précision d'affichage. */
const HIGHLIGHTED = [
	{ id: "co2-mauna-loa", decimals: 1 },
	{ id: "temperature-anomaly-gistemp", decimals: 2 },
];

export default function HomePage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);

	const stats = getCorpusStats();
	const contentLang = getTopics(lang).length > 0 ? lang : DEFAULT_LANG;
	const glossary = getGlossary(contentLang);
	const topics = getTopics(contentLang);
	const paths = getPaths(contentLang);
	const latest = getAllStudies().slice(0, 4);

	const counters = [
		{ icon: Library, value: stats.total, label: dict.home.statStudies },
		{ icon: Unlock, value: stats.openAccess, label: dict.home.statOpenAccess },
		{ icon: BookMarked, value: glossary.length, label: dict.home.statTerms },
		{ icon: Quote, value: topics.length, label: dict.home.statTopics },
	];

	const highlights = HIGHLIGHTED.map((config) => {
		const dataset = getDataset(config.id);
		if (!dataset) return null;
		const key = dataset.series[0].key;
		const last = [...dataset.rows]
			.reverse()
			.find((row) => typeof row[key] === "number") as Record<string, number> | undefined;
		return last ? { config, dataset, value: last[key], year: last.year } : null;
	}).filter((item): item is NonNullable<typeof item> => item !== null);

	return (
		<>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-16 md:py-24">
					<div className="max-w-3xl">
						<h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
							{siteConfig.name}
						</h1>
						<p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							{dict.home.lead}
						</p>

						<div className="mt-8 max-w-2xl">
							<HomeSearch
								lang={lang}
								label={dict.common.search}
								placeholder={dict.common.searchPlaceholder}
								cta={dict.home.searchCta}
							/>
						</div>
					</div>

					<dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 lg:max-w-3xl">
						{counters.map(({ icon: Icon, value, label }) => (
							<div key={label} className="flex flex-col gap-1">
								<dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.07em] text-muted-foreground">
									<Icon className="h-3.5 w-3.5" aria-hidden="true" />
									{label}
								</dt>
								<dd className="font-serif text-3xl font-semibold tabular">
									{formatNumber(value, lang)}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			{/* Les parcours répondent à la première question du visiteur : par où entrer. */}
			{paths.length > 0 && (
				<section className="border-b border-border bg-muted/25">
					<div className="container py-14">
						<div className="flex items-baseline justify-between gap-4">
							<h2 className="font-serif text-2xl font-semibold tracking-tight">{dict.paths.title}</h2>
							<Link
								href={route(lang, "paths")}
								className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
							>
								{dict.common.seeAll}
								<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
							</Link>
						</div>
						<p className="mt-1.5 max-w-2xl text-muted-foreground">{dict.paths.lead}</p>

						<ul className="mt-8 grid gap-5 md:grid-cols-3">
							{paths.slice(0, 3).map((entry) => {
								const steps = resolveSteps(lang, entry.lang, entry.frontmatter.steps);
								return (
									<li key={entry.slug}>
										<Link
											href={route(lang, "paths", entry.slug)}
											className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
										>
											<DitherBand theme={entry.frontmatter.themes[0] as ThemeId} className="h-24" />
											<div className="relative flex h-full flex-col">
												<h3 className="font-serif text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
													{entry.frontmatter.title}
												</h3>
												<p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
													{entry.frontmatter.description}
												</p>
												<div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
													<span className="inline-flex items-center gap-1.5">
														<Layers className="h-3.5 w-3.5" aria-hidden="true" />
														{steps.length} {dict.paths.steps}
													</span>
													<span className="inline-flex items-center gap-1.5">
														<Clock className="h-3.5 w-3.5" aria-hidden="true" />
														{interpolate(dict.paths.duration, { minutes: totalMinutes(steps) })}
													</span>
												</div>
											</div>
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				</section>
			)}

			<div className="container grid gap-14 py-14 lg:grid-cols-[1fr_19rem] lg:gap-16">
				<div className="min-w-0">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="font-serif text-2xl font-semibold tracking-tight">
							{dict.home.latestAdditions}
						</h2>
						<Link
							href={route(lang, "studies")}
							className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							{dict.studies.allStudies}
							<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
						</Link>
					</div>
					<div className="mt-2">
						<StudyList studies={latest} lang={lang} showAbstract />
					</div>

					{topics.length > 0 && (
						<section className="mt-14">
							<div className="flex items-baseline justify-between gap-4">
								<h2 className="font-serif text-2xl font-semibold tracking-tight">
									{dict.topics.title}
								</h2>
								<Link
									href={route(lang, "topics")}
									className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
								>
									{dict.common.seeAll}
									<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
								</Link>
							</div>
							<ul className="mt-4 grid gap-4 sm:grid-cols-2">
								{topics.slice(0, 4).map((topic) => (
									<li key={topic.slug}>
										<Link
											href={route(lang, "topics", topic.slug)}
											className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
										>
											<ThemeTagList themes={topic.frontmatter.themes.slice(0, 1)} lang={lang} />
											<h3 className="mt-2.5 font-serif text-base font-semibold leading-snug transition-colors group-hover:text-primary">
												{topic.frontmatter.title}
											</h3>
											<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
												{topic.frontmatter.description}
											</p>
										</Link>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>

				<aside className="space-y-10">
					{highlights.length > 0 && (
						<section className="rounded-xl border border-border bg-card p-5">
							<div className="flex items-baseline justify-between gap-3">
								<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
									{dict.indicators.title}
								</h2>
								<Link
									href={route(lang, "indicators")}
									className="text-xs text-primary hover:underline"
								>
									{dict.common.seeAll}
								</Link>
							</div>
							<dl className="mt-3 space-y-4">
								{highlights.map(({ config, dataset, value, year }) => (
									<div key={config.id}>
										<dt className="text-sm leading-snug text-muted-foreground">
											{dataset.title[lang] ?? dataset.title.fr}
										</dt>
										<dd className="mt-0.5 flex items-baseline gap-1.5">
											<span className="font-serif text-2xl font-semibold tabular">
												{value.toFixed(config.decimals)}
											</span>
											<span className="text-sm text-muted-foreground">{dataset.unit}</span>
											<span className="ml-auto text-xs text-muted-foreground tabular">{year}</span>
										</dd>
									</div>
								))}
							</dl>
						</section>
					)}

					<section>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.home.browseByTheme}
						</h2>
						<ul className="mt-3 space-y-0.5">
							{THEME_IDS.filter((theme) => (stats.themeCounts.get(theme) ?? 0) > 0).map((theme) => (
								<li key={theme}>
									<Link
										href={`${route(lang, "studies")}?theme=${theme}`}
										className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
									>
										<span
											aria-hidden="true"
											className="h-1.5 w-1.5 shrink-0 rounded-full"
											style={{ background: `hsl(${themeHue(theme)} 60% 48%)` }}
										/>
										<span className="flex-1">{themeLabel(theme, lang)}</span>
										<span className="tabular text-xs text-muted-foreground">
											{stats.themeCounts.get(theme)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</section>

					<section className="rounded-xl border border-border bg-muted/30 p-5">
						<h2 className="font-serif text-base font-semibold">{dict.home.howItWorks}</h2>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{dict.home.howItWorksBody}
						</p>
						<Link
							href={route(lang, "methodology")}
							className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							{dict.home.readMethodology}
							<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
						</Link>
					</section>
				</aside>
			</div>
		</>
	);
}
