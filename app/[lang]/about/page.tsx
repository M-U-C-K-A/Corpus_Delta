import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { DitherSurface } from "@/components/site/Dither";
import { getCorpusStats } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { getPaths } from "@/lib/content/paths";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return pageMetadata({
		lang: params.lang,
		title: dict.about.title,
		description: siteConfig.description[params.lang],
		section: "about",
	});
}

const CONTENT: Record<Lang, { paragraphs: string[]; statusTitle: string }> = {
	fr: {
		paragraphs: [
			`${siteConfig.name} rassemble des publications scientifiques sur le climat et les risques naturels, et définit le vocabulaire technique qui les accompagne — canicule, forçage radiatif, albédo, magnitude sismique.`,
			"L'idée de départ est simple : la littérature existe, elle est en grande partie accessible, mais elle est difficile à parcourir quand on n'a pas l'habitude des bases bibliographiques, et son vocabulaire est un obstacle avant même la lecture. Ce site ne cherche pas à la remplacer, seulement à en rendre l'accès praticable.",
			"C'est un projet indépendant et ouvert. Il n'est adossé à aucune institution, ne reçoit aucun financement et ne parle au nom de personne.",
		],
		statusTitle: "État du corpus",
	},
	en: {
		paragraphs: [
			`${siteConfig.name} gathers scientific publications on climate and natural hazards, and defines the technical vocabulary that comes with them — heatwave, radiative forcing, albedo, seismic magnitude.`,
			"The starting point is simple: the literature exists and is largely accessible, but it is hard to navigate without practice in bibliographic databases, and its vocabulary is an obstacle before reading even begins. This site does not try to replace it, only to make it approachable.",
			"It is an independent, open project. It is backed by no institution, receives no funding, and speaks for no one.",
		],
		statusTitle: "Corpus status",
	},
};

export default function AboutPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const content = CONTENT[lang];
	const stats = getCorpusStats();

	const counters = [
		{ label: dict.home.statStudies, value: formatNumber(stats.total, lang) },
		{ label: dict.home.statOpenAccess, value: formatNumber(stats.openAccess, lang) },
		{ label: dict.home.statTerms, value: formatNumber(getGlossary("fr").length, lang) },
		{ label: dict.home.statTopics, value: formatNumber(getTopics("fr").length, lang) },
		{ label: dict.paths.title, value: formatNumber(getPaths("fr").length, lang) },
	];

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{dict.about.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{siteConfig.tagline[lang]}
					</p>
				</div>
			</section>

			<div className="container grid gap-12 py-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
				<div className="min-w-0 max-w-2xl space-y-4">
					{content.paragraphs.map((paragraph) => (
						<p key={paragraph} className="text-[1.0625rem] leading-relaxed text-foreground/85">
							{paragraph}
						</p>
					))}
				</div>

				{/* L'état du corpus tient la colonne de droite, plutôt que d'allonger le texte. */}
				<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
					<section>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{content.statusTitle}
						</h2>
						<dl className="mt-3 space-y-1.5 text-sm">
							{counters.map((item) => (
								<div key={item.label} className="flex items-baseline justify-between gap-3">
									<dt className="text-muted-foreground">{item.label}</dt>
									<dd className="tabular font-medium">{item.value}</dd>
								</div>
							))}
							{stats.yearRange && (
								<div className="flex items-baseline justify-between gap-3">
									<dt className="text-muted-foreground">{dict.common.year}</dt>
									<dd className="tabular">
										{stats.yearRange.from}–{stats.yearRange.to}
									</dd>
								</div>
							)}
							{stats.lastAddedAt && (
								<div className="flex items-baseline justify-between gap-3">
									<dt className="text-muted-foreground">{dict.common.addedOn}</dt>
									<dd className="tabular">{formatDate(stats.lastAddedAt, lang)}</dd>
								</div>
							)}
						</dl>
					</section>

					<section className="rule space-y-2 pt-6 text-sm">
						<Link href={route(lang, "author")} className="block text-primary hover:underline">
							{dict.author.title}
						</Link>
						<Link href={route(lang, "methodology")} className="block text-primary hover:underline">
							{dict.methodology.title}
						</Link>
						<Link href={route(lang, "contribute")} className="block text-primary hover:underline">
							{dict.nav.contribute}
						</Link>
						<a
							href={siteConfig.repository}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-primary hover:underline"
						>
							{dict.footer.sourceCode}
							<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
						</a>
					</section>
				</aside>
			</div>
		</div>
	);
}
