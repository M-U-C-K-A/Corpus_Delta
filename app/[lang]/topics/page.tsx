import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getTopicsWithFallback } from "@/lib/content/topics";
import { themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import { formatDate } from "@/lib/format";
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
		title: dict.topics.title,
		description: dict.topics.lead,
		section: "topics",
	});
}

export default function TopicsPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const { entries, fallback } = getTopicsWithFallback(lang);

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.topics.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.topics.lead}</p>
			</header>

			{fallback && <TranslationNotice lang={lang} className="mt-6" />}

			<ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
				{entries.map((topic) => (
					<li key={topic.slug} className="bg-background">
						<Link
							href={route(lang, "topics", topic.slug)}
							className="group flex h-full flex-col p-6 transition-colors hover:bg-muted/40"
						>
							<h2 className="font-serif text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
								{topic.frontmatter.title}
							</h2>
							<p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
								{topic.frontmatter.description}
							</p>
							<div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
								<span>
									{dict.common.updatedOn} {formatDate(topic.frontmatter.updatedAt, lang)}
								</span>
								<span aria-hidden="true">·</span>
								<span>
									{topic.frontmatter.themes
										.map((theme) => themeLabel(theme as ThemeId, lang))
										.join(", ")}
								</span>
							</div>
						</Link>
					</li>
				))}
			</ul>

			{entries.length === 0 && (
				<p className="mt-10 text-sm text-muted-foreground">{dict.common.noResults}</p>
			)}
		</div>
	);
}
