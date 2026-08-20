import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookMarked, Clock, FileText, Layers, Library } from "lucide-react";
import "katex/dist/katex.min.css";
import { MdxContent } from "@/components/mdx";
import { DitherBand } from "@/components/site/Dither";
import { ThemeTagList } from "@/components/site/ThemeTag";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getPath, getPaths, resolveSteps, totalMinutes } from "@/lib/content/paths";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary, interpolate } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getPaths(DEFAULT_LANG).map((entry) => ({ lang, slug: entry.slug })));
}

function resolvePath(lang: Lang, slug: string) {
	const own = getPath(lang, slug);
	if (own) return { entry: own, fallback: false };
	const fallback = getPath(DEFAULT_LANG, slug);
	return fallback ? { entry: fallback, fallback: lang !== DEFAULT_LANG } : null;
}

export function generateMetadata({ params }: { params: { lang: string; slug: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const resolved = resolvePath(params.lang, params.slug);
	if (!resolved) return {};

	return pageMetadata({
		lang: params.lang,
		title: resolved.entry.frontmatter.title,
		description: resolved.entry.frontmatter.description,
		section: "paths",
		segments: [params.slug],
		modifiedTime: resolved.entry.frontmatter.updatedAt,
	});
}

const STEP_ICONS = { glossary: BookMarked, topic: FileText, study: Library };

export default function PathPage({ params }: { params: { lang: string; slug: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;

	const resolved = resolvePath(lang, params.slug);
	if (!resolved) notFound();

	const { entry, fallback } = resolved;
	const dict = getDictionary(lang);
	const steps = resolveSteps(lang, entry.lang, entry.frontmatter.steps);
	const primaryTheme = entry.frontmatter.themes[0] as ThemeId;
	const siblings = getPaths(entry.lang).filter((candidate) => candidate.slug !== entry.slug);

	const kindLabels = {
		glossary: dict.paths.kindGlossary,
		topic: dict.paths.kindTopic,
		study: dict.paths.kindStudy,
	};

	return (
		<div className="relative">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-80">
				<DitherBand theme={primaryTheme} />
			</div>

			<div className="container relative py-10">
				<nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
					<Link href={route(lang, "paths")} className="hover:text-foreground">
						{dict.paths.title}
					</Link>
				</nav>

				{/*
				  La grille englobe l'en-tête, pas seulement les étapes : quand elle
				  ne commençait qu'à la séquence, le titre et le chapô restaient seuls
				  à gauche et laissaient toute la bande supérieure droite vide.
				*/}
				<div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_17rem]">
					<div className="min-w-0">
						<header className="max-w-2xl">
							<ThemeTagList themes={entry.frontmatter.themes} lang={lang} />
							<h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight">
								{entry.frontmatter.title}
							</h1>
							<p className="mt-3 text-lg leading-relaxed text-muted-foreground">
								{entry.frontmatter.description}
							</p>

							<div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
								<span className="inline-flex items-center gap-1.5">
									<Layers className="h-4 w-4" aria-hidden="true" />
									{steps.length} {dict.paths.steps}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<Clock className="h-4 w-4" aria-hidden="true" />
									{interpolate(dict.paths.duration, { minutes: totalMinutes(steps) })}
								</span>
							</div>
						</header>

						{fallback && <TranslationNotice lang={lang} className="mt-6 max-w-2xl" />}

						{entry.content.trim().length > 0 && (
							<div className="prose prose-neutral mt-8 max-w-2xl dark:prose-invert prose-headings:font-serif">
								<MdxContent source={entry.content} lang={entry.lang} />
							</div>
						)}

						{/*
					  Liste ordonnée reliée par un filet vertical : la séquence est
					  l'information principale d'un parcours, elle doit se voir avant les titres.
					*/}
						<ol className="mt-12">
							{steps.map((step, index) => {
								const Icon = STEP_ICONS[step.kind];
								const isLast = index === steps.length - 1;

								return (
									<li
										key={`${step.kind}-${step.id}`}
										id={`etape-${index + 1}`}
										className="relative flex gap-5 pb-8 last:pb-0"
									>
										{!isLast && (
											<span
												aria-hidden="true"
												className="absolute left-[1.1875rem] top-10 bottom-0 w-px bg-border"
											/>
										)}

										<span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
											<Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
										</span>

										<div className="min-w-0 flex-1 pt-1">
											<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
												<span className="tabular">
													{interpolate(dict.paths.stepLabel, { index: index + 1, total: steps.length })}
												</span>
												<span aria-hidden="true">·</span>
												<span>{kindLabels[step.kind]}</span>
												<span aria-hidden="true">·</span>
												<span>{interpolate(dict.paths.duration, { minutes: step.minutes })}</span>
											</div>

											<h2 className="mt-1.5 font-serif text-xl font-semibold leading-snug tracking-tight">
												<Link href={step.href} className="transition-colors hover:text-primary">
													{step.title}
												</Link>
											</h2>

											{step.subtitle && (
												<p className="mt-1 text-sm leading-snug text-muted-foreground">{step.subtitle}</p>
											)}

											{/* L'apport du parcours : pourquoi cette étape, à cette place. */}
											<p className="mt-3 border-l-2 border-border pl-3.5 text-[0.9375rem] leading-relaxed text-foreground/80">
												{step.note}
											</p>

											<Link
												href={step.href}
												className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
											>
												{kindLabels[step.kind]}
												<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
											</Link>
										</div>
									</li>
								);
							})}
						</ol>

						<div className="mt-8 rounded-lg border border-border bg-muted/30 p-5">
							<h2 className="font-serif text-lg font-semibold">{dict.paths.finished}</h2>
							<p className="mt-1.5 text-sm text-muted-foreground">{dict.paths.finishedBody}</p>
							<div className="mt-4 flex flex-wrap gap-3 text-sm">
								<Link href={route(lang, "studies")} className="text-primary hover:underline">
									{dict.studies.allStudies}
								</Link>
								<Link href={route(lang, "paths")} className="text-primary hover:underline">
									{dict.paths.title}
								</Link>
							</div>
						</div>
					</div>

					{/*
					  La colonne de droite tient le sommaire de la séquence et les parcours
					  voisins : sans elle, la page laissait un tiers de sa largeur vide.
					*/}
					<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
						<nav aria-labelledby="path-outline">
							<h2
								id="path-outline"
								className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground"
							>
								{dict.paths.inThisPath}
							</h2>
							<ol className="mt-3 space-y-1.5 border-l border-border">
								{steps.map((step, index) => (
									<li key={`outline-${step.kind}-${step.id}`} className="pl-3">
										<a
											href={`#etape-${index + 1}`}
											className="flex gap-2 text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground"
										>
											<span className="tabular text-xs opacity-60">{index + 1}</span>
											<span className="line-clamp-2">{step.title}</span>
										</a>
									</li>
								))}
							</ol>
						</nav>

						{siblings.length > 0 && (
							<section className="rule pt-6">
								<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
									{dict.paths.title}
								</h2>
								<ul className="mt-3 space-y-2.5">
									{siblings.map((sibling) => (
										<li key={sibling.slug}>
											<Link href={route(lang, "paths", sibling.slug)} className="group block">
												<span className="text-sm leading-snug transition-colors group-hover:text-primary">
													{sibling.frontmatter.title}
												</span>
												<span className="mt-0.5 block text-xs text-muted-foreground">
													{sibling.frontmatter.steps.length} {dict.paths.steps}
												</span>
											</Link>
										</li>
									))}
								</ul>
							</section>
						)}

						<section className="rule pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.common.themes}
							</h2>
							<ThemeTagList themes={entry.frontmatter.themes} lang={lang} linkToStudies className="mt-3" />
						</section>
					</aside>
				</div>
			</div>
		</div>
	);
}
