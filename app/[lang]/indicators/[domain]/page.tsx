import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import "katex/dist/katex.min.css";
import { MdxContent } from "@/components/mdx";
import { IndicatorTiles } from "@/components/mdx/IndicatorTiles";
import { DitherBand } from "@/components/site/Dither";
import { StudyList } from "@/components/site/StudyCard";
import { ThemeTagList } from "@/components/site/ThemeTag";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getDomains, resolveDomain } from "@/lib/content/domains";
import { getGlossaryEntries } from "@/lib/content/glossary";
import { getStudies } from "@/lib/content/studies";
import { extractHeadings } from "@/lib/content/mdx-source";
import { colorForTheme } from "@/lib/content/chart-colors";
import type { ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate } from "@/lib/format";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

/**
 * Un domaine du système climatique, pris par ses mesures.
 *
 * La page s'ouvre sur les grandeurs, pas sur le texte : les vignettes du
 * bandeau donnent l'état des lieux avant la première phrase. Le corps rédigé
 * explique ensuite le mécanisme qui relie ces grandeurs entre elles — c'est la
 * seule chose qu'un tableau de chiffres ne peut pas porter.
 */

export function generateStaticParams() {
	// Les slugs sont communs aux deux langues : le français sert de repli tant
	// que la traduction n'existe pas, donc les URLs anglaises existent aussi.
	return LANGS.flatMap((lang) =>
		getDomains(DEFAULT_LANG).map((domain) => ({ lang, domain: domain.slug }))
	);
}

export function generateMetadata({
	params,
}: {
	params: { lang: string; domain: string };
}): Metadata {
	if (!isLang(params.lang)) return {};
	const resolved = resolveDomain(params.lang, params.domain);
	if (!resolved) return {};

	return pageMetadata({
		lang: params.lang,
		title: resolved.domain.frontmatter.title,
		description: resolved.domain.frontmatter.description,
		section: "indicators",
		segments: [params.domain],
		modifiedTime: resolved.domain.frontmatter.updatedAt,
	});
}

export default function DomainPage({ params }: { params: { lang: string; domain: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;

	const resolved = resolveDomain(lang, params.domain);
	if (!resolved) notFound();

	const { domain, fallback } = resolved;
	const { frontmatter } = domain;
	const dict = getDictionary(lang);

	const accent = frontmatter.themes[0] as ThemeId;
	const headings = extractHeadings(domain.content);
	const studies = getStudies(frontmatter.studies);
	const terms = getGlossaryEntries(domain.lang, frontmatter.glossary);

	// La teinte des vignettes suit le thème dominant, comme celle du bandeau :
	// une page ne doit pas changer de couleur entre son en-tête et ses chiffres.
	const tiles = frontmatter.headline.map((entry) => ({
		...entry,
		color: colorForTheme(accent),
	}));

	const siblings = getDomains(domain.lang).filter((item) => item.slug !== domain.slug);

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherBand theme={accent} />
				<div className="container relative py-12">
					<nav
						aria-label="Fil d'Ariane"
						className="flex items-center gap-1.5 text-sm text-muted-foreground"
					>
						<Link href={route(lang, "indicators")} className="hover:text-foreground">
							{dict.indicators.title}
						</Link>
						<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
						<span className="truncate text-foreground">{frontmatter.title}</span>
					</nav>

					<h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{frontmatter.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{frontmatter.tagline}
					</p>

					<div className="mt-5 flex flex-wrap items-center gap-3">
						<ThemeTagList themes={frontmatter.themes} lang={lang} linked />
						<span className="text-xs uppercase tracking-[0.07em] text-muted-foreground">
							{dict.common.updatedOn} {formatDate(frontmatter.updatedAt, lang)}
						</span>
					</div>
				</div>
			</section>

			<div className="container py-10">
				{/* L'état des lieux avant le récit : les chiffres n'attendent pas. */}
				<IndicatorTiles specs={tiles} lang={lang} columns={4} />

				<div className="mt-10 grid gap-12 lg:grid-cols-[1fr_16rem]">
					<article className="min-w-0">
						{fallback && <TranslationNotice lang={lang} className="mb-6" />}

						<div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-a:underline-offset-2">
							<MdxContent source={domain.content} lang={domain.lang} />
						</div>

						{frontmatter.sources.length > 0 && (
							<section className="mt-12 border-t border-border pt-6">
								<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
									{dict.common.sources}
								</h2>
								<ol className="mt-3 space-y-2 text-sm">
									{frontmatter.sources.map((source) => (
										<li key={source.url} className="leading-relaxed">
											<a
												href={source.url}
												target="_blank"
												rel="noreferrer"
												className="text-primary hover:underline"
											>
												{source.label}
											</a>
											{source.publisher && (
												<span className="text-muted-foreground"> — {source.publisher}</span>
											)}
											{source.year && (
												<span className="text-muted-foreground"> ({source.year})</span>
											)}
										</li>
									))}
								</ol>
							</section>
						)}

						{studies.length > 0 && (
							<section className="mt-12 border-t border-border pt-6">
								<h2 className="font-serif text-xl font-semibold tracking-tight">
									{dict.topics.studiesUsed}
								</h2>
								<div className="mt-1">
									<StudyList studies={studies} lang={lang} />
								</div>
							</section>
						)}
					</article>

					<aside className="lg:sticky lg:top-24 lg:self-start">
						{headings.length > 1 && (
							<nav aria-labelledby="toc-heading">
								<h2
									id="toc-heading"
									className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground"
								>
									{dict.topics.contents}
								</h2>
								<ol className="mt-3 space-y-1.5 border-l border-border">
									{headings.map((heading) => (
										<li key={heading.id} className={heading.level === 3 ? "pl-6" : "pl-3"}>
											<a
												href={`#${heading.id}`}
												className="block text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground"
											>
												{heading.text}
											</a>
										</li>
									))}
								</ol>
							</nav>
						)}

						{terms.length > 0 && (
							<section className="mt-8">
								<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
									{dict.topics.termsUsed}
								</h2>
								<ul className="mt-3 space-y-1">
									{terms.map((term) => (
										<li key={term.slug}>
											<Link
												href={route(lang, "glossary", term.slug)}
												className="text-sm text-primary hover:underline"
											>
												{term.frontmatter.term}
											</Link>
										</li>
									))}
								</ul>
							</section>
						)}

						{siblings.length > 0 && (
							<section className="mt-8">
								<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
									{dict.indicators.otherDomains}
								</h2>
								<ul className="mt-3 space-y-1">
									{siblings.map((item) => (
										<li key={item.slug}>
											<Link
												href={route(lang, "indicators", item.slug)}
												className="text-sm text-primary hover:underline"
											>
												{item.frontmatter.title}
											</Link>
										</li>
									))}
								</ul>
							</section>
						)}
					</aside>
				</div>
			</div>
		</div>
	);
}
