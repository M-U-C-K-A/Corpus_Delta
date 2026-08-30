import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight, History } from "lucide-react";
import { Abstract } from "@/components/site/Abstract";
import { AuthorList } from "@/components/site/AuthorList";
import { CitationBlock } from "@/components/site/CitationBlock";
import { DitherBand } from "@/components/site/Dither";
import { OpenAccessTag, StudyList } from "@/components/site/StudyCard";
import { ThemeTagList } from "@/components/site/ThemeTag";
import {
	AGEING_YEARS,
	displayTitle,
	getAllStudies,
	getEditorial,
	getNewerStudies,
	getRelatedStudies,
	getStudy,
} from "@/lib/content/studies";
import { getGlossaryEntries } from "@/lib/content/glossary";
import { getTopicsCitingStudy } from "@/lib/content/topics";
import { toApa, toBibtex } from "@/lib/content/citation";
import { publicationTypeLabel, type PublicationType, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary, interpolate } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.flatMap((lang) => getAllStudies().map((study) => ({ lang, id: study.id })));
}

export function generateMetadata({ params }: { params: { lang: string; id: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const study = getStudy(params.id);
	if (!study) return {};

	const description =
		study.abstract?.slice(0, 200) ??
		`${study.authors[0]?.name ?? ""} — ${study.venue ?? ""} (${study.year})`.trim();

	return pageMetadata({
		lang: params.lang,
		title: displayTitle(study),
		description,
		section: "studies",
		segments: [study.id],
		modifiedTime: study.addedAt,
	});
}

export default function StudyPage({ params }: { params: { lang: string; id: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;

	const study = getStudy(params.id);
	// Un identifiant inconnu doit produire un vrai 404 : la version précédente
	// renvoyait une page « introuvable » avec un statut 200, donc indexable.
	if (!study) notFound();

	const dict = getDictionary(lang);
	const editorial = getEditorial(study, lang);
	const related = getRelatedStudies(study);

	/*
	  L'avertissement d'ancienneté n'a d'intérêt que s'il mène quelque part :
	  répéter « publiée en 2012 » n'apprend rien de plus que la date affichée
	  deux lignes au-dessus. On ne l'affiche donc que si des travaux plus
	  récents existent réellement sur les mêmes thèmes.
	*/
	const newer = new Date().getFullYear() - study.year >= AGEING_YEARS ? getNewerStudies(study) : [];
	const terms = getGlossaryEntries(lang, study.glossaryTerms);
	const citingTopics = getTopicsCitingStudy(lang, study.id);

	const metadataRows: { label: string; value: React.ReactNode }[] = [
		{ label: dict.studies.publishedIn, value: study.venue ?? study.publisher ?? "—" },
		{ label: dict.studies.publishedOn, value: String(study.year) },
		{
			label: dict.common.type,
			value: (
				<>
					{publicationTypeLabel(study.type as PublicationType, lang)}
					{/* Le type effectif diffère de celui de la source : le dire, comme
					    tout ce qui relève d'une décision humaine sur ce site. */}
					{study.typeOverride && (
						<span className="ml-2 text-xs text-muted-foreground">{dict.studies.typeCorrected}</span>
					)}
				</>
			),
		},
		{
			label: dict.common.themes,
			value: <ThemeTagList themes={study.themes} lang={lang} linked className="mt-1" />,
		},
	];

	if (study.citedByCount !== null) {
		metadataRows.push({
			label: dict.studies.citedBy,
			value: (
				<>
					<span className="tabular">{formatNumber(study.citedByCount, lang)}</span>{" "}
					<span className="text-xs text-muted-foreground">
						(
						{interpolate(dict.studies.citedBySource, {
							date: formatDate(study.provenance.retrievedAt, lang),
						})}
						)
					</span>
				</>
			),
		});
	}

	// Décrit la fiche pour les moteurs : c'est une référence vers un travail tiers,
	// pas un article publié par le site.
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "ScholarlyArticle",
		headline: study.title,
		datePublished: String(study.year),
		author: study.authors.map((author) => ({ "@type": "Person", name: author.name })),
		...(study.venue ? { publication: study.venue } : {}),
		...(study.doi ? { identifier: `https://doi.org/${study.doi}` } : {}),
		url: study.url,
		isAccessibleForFree: study.openAccess.isOpen,
		...(study.abstract ? { abstract: study.abstract } : {}),
	};

	const primaryTheme = study.themes[0] as ThemeId;

	return (
		<div className="relative">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-64">
				<DitherBand theme={primaryTheme} />
			</div>

			<div className="container relative py-10">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={route(lang, "studies")} className="hover:text-foreground">
					{dict.studies.title}
				</Link>
				<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="truncate text-foreground">{displayTitle(study)}</span>
			</nav>

			<div className="mt-6 grid gap-12 lg:grid-cols-[1fr_19rem]">
				<article className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<OpenAccessTag isOpen={study.openAccess.isOpen} lang={lang} />
						<span className="text-xs text-muted-foreground">
							{publicationTypeLabel(study.type as PublicationType, lang)}
						</span>
					</div>

					<h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
						{study.title}
					</h1>

					<div className="mt-3">
						<AuthorList
							authors={study.authors}
							total={study.authorCount}
							labels={{
								showAll: dict.studies.authors,
								showLess: dict.studies.showLessAuthors,
								andOthers: dict.studies.andOthers,
								truncated: dict.studies.authorsTruncated,
							}}
						/>
					</div>

					<div className="mt-6 flex flex-wrap gap-2">
						<a
							href={study.url}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
						>
							{dict.studies.readAtSource}
							<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
						</a>
						{study.openAccess.url && study.openAccess.url !== study.url && (
							<a
								href={study.openAccess.url}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted"
							>
								{dict.studies.readOpenAccess}
								<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
							</a>
						)}
					</div>

					{newer.length > 0 && (
						<section className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
							<h2 className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								<History className="h-3.5 w-3.5" aria-hidden="true" />
								{dict.studies.ageing}
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{dict.studies.ageingBody}
							</p>
							<ul className="mt-3 space-y-1.5">
								{newer.map((candidate) => (
									<li key={candidate.id}>
										<Link
											href={route(lang, "studies", candidate.id)}
											className="group inline-flex items-baseline gap-2 text-sm"
										>
											<span className="tabular text-xs text-muted-foreground">{candidate.year}</span>
											<span className="transition-colors group-hover:text-primary">
												{displayTitle(candidate)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</section>
					)}

					{editorial && (
						<section className="mt-8 rounded-lg border-l-2 border-primary bg-accent/40 p-4">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-accent-foreground">
								{dict.studies.editorialNote}
							</h2>
							<p className="mt-2 text-[0.9375rem] leading-relaxed">{editorial.summary}</p>
							{editorial.relevance && (
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{editorial.relevance}</p>
							)}
						</section>
					)}

					<section className="mt-8">
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.studies.abstract}
						</h2>
						{study.abstract ? (
							<div className="mt-2">
								<Abstract
									text={study.abstract}
									language={study.language}
									pageLang={lang}
									labels={{
										readMore: dict.studies.readMore,
										readLess: dict.studies.readLess,
										foreignLanguage: dict.studies.abstractForeign,
									}}
								/>
							</div>
						) : (
							<p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
								{dict.studies.noAbstract}
							</p>
						)}
					</section>

					{related.length > 0 && (
						<section className="mt-12 border-t border-border pt-6">
							<h2 className="font-serif text-xl font-semibold tracking-tight">
								{dict.studies.relatedStudies}
							</h2>
							<div className="mt-1">
								<StudyList studies={related} lang={lang} />
							</div>
						</section>
					)}
				</article>

				<aside className="space-y-8 lg:border-l lg:border-border lg:pl-8">
					<section>
						<dl className="space-y-3 text-sm">
							{metadataRows.map((row) => (
								<div key={row.label}>
									<dt className="text-xs uppercase tracking-[0.07em] text-muted-foreground">
										{row.label}
									</dt>
									<dd className="mt-0.5 leading-snug">{row.value}</dd>
								</div>
							))}
							{study.doi && (
								<div>
									<dt className="text-xs uppercase tracking-[0.07em] text-muted-foreground">DOI</dt>
									<dd className="mt-0.5">
										<a
											href={`https://doi.org/${study.doi}`}
											target="_blank"
											rel="noreferrer"
											className="break-all font-mono text-xs text-primary hover:underline"
										>
											{study.doi}
										</a>
									</dd>
								</div>
							)}
						</dl>
					</section>

					<div className="rule pt-6">
						<CitationBlock
							apa={toApa(study)}
							bibtex={toBibtex(study)}
							labels={{
								citation: dict.studies.citation,
								copy: dict.common.copy,
								copied: dict.common.copied,
							}}
						/>
					</div>

					{terms.length > 0 && (
						<section className="rule pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.studies.glossaryTerms}
							</h2>
							<ul className="mt-2 space-y-1">
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

					{citingTopics.length > 0 && (
						<section className="rule pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.studies.inTopics}
							</h2>
							<ul className="mt-2 space-y-1">
								{citingTopics.map((topic) => (
									<li key={topic.slug}>
										<Link
											href={route(lang, "topics", topic.slug)}
											className="text-sm text-primary hover:underline"
										>
											{topic.frontmatter.title}
										</Link>
									</li>
								))}
							</ul>
						</section>
					)}

					{/* Traçabilité : d'où viennent ces métadonnées et quand elles ont été relevées. */}
					<p className="rule pt-6 text-xs leading-relaxed text-muted-foreground">
						{interpolate(dict.studies.metadataFrom, {
							source: study.provenance.source === "manual" ? siteConfig.name : study.provenance.source,
							date: formatDate(study.provenance.retrievedAt, lang),
						})}
					</p>
				</aside>
			</div>
		</div>
		</div>
	);
}
