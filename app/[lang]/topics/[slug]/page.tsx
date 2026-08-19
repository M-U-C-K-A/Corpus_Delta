import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import "katex/dist/katex.min.css";
import { MdxContent } from "@/components/mdx";
import { StudyList } from "@/components/site/StudyCard";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getTopic, getTopics } from "@/lib/content/topics";
import { getGlossaryEntries } from "@/lib/content/glossary";
import { getStudies } from "@/lib/content/studies";
import { extractHeadings } from "@/lib/content/mdx-source";
import { themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate } from "@/lib/format";
import { route } from "@/lib/routes";

export function generateStaticParams() {
	// Les slugs sont communs à toutes les langues : le contenu français sert de
	// repli tant que la traduction n'existe pas, donc les URLs anglaises existent.
	return LANGS.flatMap((lang) =>
		getTopics(DEFAULT_LANG).map((topic) => ({ lang, slug: topic.slug }))
	);
}

function resolveTopic(lang: Lang, slug: string) {
	const own = getTopic(lang, slug);
	if (own) return { topic: own, fallback: false };
	const fallback = getTopic(DEFAULT_LANG, slug);
	return fallback ? { topic: fallback, fallback: lang !== DEFAULT_LANG } : null;
}

export function generateMetadata({ params }: { params: { lang: string; slug: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const resolved = resolveTopic(params.lang, params.slug);
	if (!resolved) return {};

	return {
		title: resolved.topic.frontmatter.title,
		description: resolved.topic.frontmatter.description,
		alternates: {
			canonical: route(params.lang, "topics", params.slug),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "topics", params.slug)])),
		},
		openGraph: {
			type: "article",
			title: resolved.topic.frontmatter.title,
			description: resolved.topic.frontmatter.description,
			modifiedTime: resolved.topic.frontmatter.updatedAt,
		},
	};
}

export default function TopicPage({ params }: { params: { lang: string; slug: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;

	const resolved = resolveTopic(lang, params.slug);
	if (!resolved) notFound();

	const { topic, fallback } = resolved;
	const dict = getDictionary(lang);
	const headings = extractHeadings(topic.content);
	const studies = getStudies(topic.frontmatter.studies);
	const terms = getGlossaryEntries(topic.lang, topic.frontmatter.glossary);

	return (
		<div className="container py-10">
			<nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={route(lang, "topics")} className="hover:text-foreground">
					{dict.topics.title}
				</Link>
				<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="truncate text-foreground">{topic.frontmatter.title}</span>
			</nav>

			<div className="mt-6 grid gap-12 lg:grid-cols-[1fr_16rem]">
				<article className="min-w-0">
					<header>
						<h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight">
							{topic.frontmatter.title}
						</h1>
						<p className="mt-3 text-lg leading-relaxed text-muted-foreground">
							{topic.frontmatter.description}
						</p>
						<p className="mt-4 text-xs uppercase tracking-[0.07em] text-muted-foreground">
							{dict.common.updatedOn} {formatDate(topic.frontmatter.updatedAt, lang)} ·{" "}
							{topic.frontmatter.themes.map((theme) => themeLabel(theme as ThemeId, lang)).join(", ")}
						</p>
					</header>

					{fallback && <TranslationNotice lang={lang} className="mt-6" />}

					<div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-a:underline-offset-2">
						<MdxContent source={topic.content} lang={topic.lang} />
					</div>

					{topic.frontmatter.sources.length > 0 && (
						<section className="mt-12 border-t border-border pt-6">
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.common.sources}
							</h2>
							<ol className="mt-3 space-y-2 text-sm">
								{topic.frontmatter.sources.map((source) => (
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
										{source.year && <span className="text-muted-foreground"> ({source.year})</span>}
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
				</aside>
			</div>
		</div>
	);
}
