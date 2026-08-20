import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Layers } from "lucide-react";
import { DitherBand } from "@/components/site/Dither";
import { ThemeTagList } from "@/components/site/ThemeTag";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getPathsWithFallback, resolveSteps, totalMinutes } from "@/lib/content/paths";
import { getDictionary, interpolate } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import type { ThemeId } from "@/lib/content/taxonomy";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);

	return pageMetadata({
		lang: params.lang,
		title: dict.paths.title,
		description: dict.paths.lead,
		section: "paths",
	});
}

export default function PathsPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const { entries, fallback } = getPathsWithFallback(lang);

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.paths.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.paths.lead}</p>
			</header>

			{fallback && <TranslationNotice lang={lang} className="mt-6" />}

			<ul className="mt-10 grid gap-6 lg:grid-cols-2">
				{entries.map((entry) => {
					const steps = resolveSteps(lang, entry.lang, entry.frontmatter.steps);
					const primaryTheme = entry.frontmatter.themes[0] as ThemeId;

					return (
						<li key={entry.slug}>
							<Link
								href={route(lang, "paths", entry.slug)}
								className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
							>
								<DitherBand theme={primaryTheme} className="h-32" />

								<div className="relative">
									<ThemeTagList themes={entry.frontmatter.themes.slice(0, 2)} lang={lang} />

									<h2 className="mt-3 font-serif text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
										{entry.frontmatter.title}
									</h2>
									<p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
										{entry.frontmatter.description}
									</p>

									<div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
										<span className="inline-flex items-center gap-1.5">
											<Layers className="h-3.5 w-3.5" aria-hidden="true" />
											{steps.length} {dict.paths.steps}
										</span>
										<span className="inline-flex items-center gap-1.5">
											<Clock className="h-3.5 w-3.5" aria-hidden="true" />
											{interpolate(dict.paths.duration, { minutes: totalMinutes(steps) })}
										</span>
										<span className="ml-auto inline-flex items-center gap-1 text-primary">
											{dict.paths.start}
											<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
										</span>
									</div>
								</div>
							</Link>
						</li>
					);
				})}
			</ul>

			{entries.length === 0 && (
				<p className="mt-10 text-sm text-muted-foreground">{dict.common.noResults}</p>
			)}
		</div>
	);
}
