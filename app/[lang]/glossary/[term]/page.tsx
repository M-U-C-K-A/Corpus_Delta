import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import "katex/dist/katex.min.css";
import { MdxContent } from "@/components/mdx";
import { StudyList } from "@/components/site/StudyCard";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getGlossary, getGlossaryEntry, getGlossaryEntries } from "@/lib/content/glossary";
import { getStudies } from "@/lib/content/studies";
import { getTopicsUsingTerm } from "@/lib/content/topics";
import { themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate } from "@/lib/format";
import { route } from "@/lib/routes";

export function generateStaticParams() {
	return LANGS.flatMap((lang) =>
		getGlossary(DEFAULT_LANG).map((entry) => ({ lang, term: entry.slug }))
	);
}

function resolveEntry(lang: Lang, slug: string) {
	const own = getGlossaryEntry(lang, slug);
	if (own) return { entry: own, fallback: false };
	const fallback = getGlossaryEntry(DEFAULT_LANG, slug);
	return fallback ? { entry: fallback, fallback: lang !== DEFAULT_LANG } : null;
}

export function generateMetadata({ params }: { params: { lang: string; term: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const resolved = resolveEntry(params.lang, params.term);
	if (!resolved) return {};

	return {
		title: resolved.entry.frontmatter.term,
		description: resolved.entry.frontmatter.shortDefinition,
		alternates: {
			canonical: route(params.lang, "glossary", params.term),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "glossary", params.term)])),
		},
	};
}

export default function GlossaryTermPage({ params }: { params: { lang: string; term: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;

	const resolved = resolveEntry(lang, params.term);
	if (!resolved) notFound();

	const { entry, fallback } = resolved;
	const dict = getDictionary(lang);
	const related = getGlossaryEntries(entry.lang, entry.frontmatter.related);
	const studies = getStudies(entry.frontmatter.studies);
	const topics = getTopicsUsingTerm(lang, entry.slug);

	// Un terme défini est une entité que les moteurs savent représenter.
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "DefinedTerm",
		name: entry.frontmatter.term,
		description: entry.frontmatter.shortDefinition,
		inDefinedTermSet: {
			"@type": "DefinedTermSet",
			name: dict.glossary.title,
		},
	};

	return (
		<div className="container py-10">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

			<nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={route(lang, "glossary")} className="hover:text-foreground">
					{dict.glossary.title}
				</Link>
				<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="text-foreground">{entry.frontmatter.term}</span>
			</nav>

			<div className="mt-6 grid gap-12 lg:grid-cols-[1fr_17rem]">
				<article className="min-w-0">
					<h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight">
						{entry.frontmatter.term}
					</h1>

					{entry.frontmatter.synonyms.length > 0 && (
						<p className="mt-2 text-sm text-muted-foreground">
							{dict.glossary.synonyms} : {entry.frontmatter.synonyms.join(", ")}
						</p>
					)}

					<p className="mt-5 border-l-2 border-primary pl-4 text-lg leading-relaxed">
						{entry.frontmatter.shortDefinition}
					</p>

					{fallback && <TranslationNotice lang={lang} className="mt-6" />}

					{entry.content.trim().length > 0 && (
						<div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight">
							<MdxContent source={entry.content} lang={entry.lang} />
						</div>
					)}

					<section className="mt-10 border-t border-border pt-6">
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.glossary.definitionSource}
						</h2>
						<ol className="mt-3 space-y-2 text-sm">
							{entry.frontmatter.sources.map((source) => (
								<li key={source.url} className="leading-relaxed">
									<a
										href={source.url}
										target="_blank"
										rel="noreferrer"
										className="text-primary hover:underline"
									>
										{source.label}
									</a>
									{source.publisher && <span className="text-muted-foreground"> — {source.publisher}</span>}
									{source.year && <span className="text-muted-foreground"> ({source.year})</span>}
								</li>
							))}
						</ol>
					</section>

					{studies.length > 0 && (
						<section className="mt-12 border-t border-border pt-6">
							<h2 className="font-serif text-xl font-semibold tracking-tight">
								{dict.glossary.relatedStudies}
							</h2>
							<div className="mt-1">
								<StudyList studies={studies} lang={lang} />
							</div>
						</section>
					)}
				</article>

				<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
					<section>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.common.themes}
						</h2>
						<p className="mt-2 text-sm">
							{entry.frontmatter.themes.map((theme) => themeLabel(theme as ThemeId, lang)).join(", ")}
						</p>
					</section>

					{related.length > 0 && (
						<section className="rule pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.glossary.related}
							</h2>
							<ul className="mt-2 space-y-1">
								{related.map((item) => (
									<li key={item.slug}>
										<Link
											href={route(lang, "glossary", item.slug)}
											className="text-sm text-primary hover:underline"
										>
											{item.frontmatter.term}
										</Link>
									</li>
								))}
							</ul>
						</section>
					)}

					{topics.length > 0 && (
						<section className="rule pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.topics.title}
							</h2>
							<ul className="mt-2 space-y-1">
								{topics.map((topic) => (
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

					<p className="rule pt-6 text-xs text-muted-foreground">
						{dict.common.updatedOn} {formatDate(entry.frontmatter.updatedAt, lang)}
					</p>
				</aside>
			</div>
		</div>
	);
}
