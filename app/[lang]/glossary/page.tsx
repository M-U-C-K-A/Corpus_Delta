import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryIndex, type GlossaryItem } from "@/components/site/GlossaryIndex";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getGlossaryWithFallback } from "@/lib/content/glossary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);

	return pageMetadata({
		lang: params.lang,
		title: dict.glossary.title,
		description: dict.glossary.lead,
		section: "glossary",
	});
}

export default function GlossaryPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const { entries, fallback } = getGlossaryWithFallback(lang);

	const items: GlossaryItem[] = entries.map((entry) => ({
		slug: entry.slug,
		term: entry.frontmatter.term,
		shortDefinition: entry.frontmatter.shortDefinition,
		synonyms: entry.frontmatter.synonyms,
		initial: entry.frontmatter.term
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.charAt(0)
			.toUpperCase(),
	}));

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.glossary.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.glossary.lead}</p>
			</header>

			{fallback && <TranslationNotice lang={lang} className="mt-6" />}

			<div className="mt-8">
				<GlossaryIndex
					lang={lang}
					items={items}
					labels={{
						search: dict.common.search,
						placeholder: dict.glossary.searchPlaceholder,
						empty: dict.glossary.empty,
					}}
				/>
			</div>
		</div>
	);
}
