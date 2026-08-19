import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCorpusStats } from "@/lib/content/studies";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return {
		title: dict.about.title,
		description: siteConfig.description[params.lang],
		alternates: {
			canonical: route(params.lang, "about"),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "about")])),
		},
	};
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

	return (
		<div className="container py-12">
			<div className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.about.title}</h1>

				<div className="mt-6 space-y-4">
					{content.paragraphs.map((paragraph) => (
						<p key={paragraph} className="leading-relaxed text-foreground/85">
							{paragraph}
						</p>
					))}
				</div>

				<section className="mt-10 rounded-lg border border-border bg-card p-5">
					<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
						{content.statusTitle}
					</h2>
					<dl className="mt-3 space-y-1.5 text-sm">
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">{dict.home.statStudies}</dt>
							<dd className="tabular">{formatNumber(stats.total, lang)}</dd>
						</div>
						<div className="flex justify-between gap-4">
							<dt className="text-muted-foreground">{dict.home.statOpenAccess}</dt>
							<dd className="tabular">{formatNumber(stats.openAccess, lang)}</dd>
						</div>
						{stats.yearRange && (
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">{dict.common.year}</dt>
								<dd className="tabular">
									{stats.yearRange.from} – {stats.yearRange.to}
								</dd>
							</div>
						)}
						{stats.lastAddedAt && (
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">{dict.common.addedOn}</dt>
								<dd className="tabular">{formatDate(stats.lastAddedAt, lang)}</dd>
							</div>
						)}
					</dl>
				</section>

				<p className="mt-8 text-sm">
					<Link href={route(lang, "methodology")} className="text-primary hover:underline">
						{dict.methodology.title}
					</Link>{" "}
					·{" "}
					<Link href={route(lang, "contribute")} className="text-primary hover:underline">
						{dict.nav.contribute}
					</Link>{" "}
					·{" "}
					<a
						href={siteConfig.repository}
						target="_blank"
						rel="noreferrer"
						className="text-primary hover:underline"
					>
						{dict.footer.sourceCode}
					</a>
				</p>
			</div>
		</div>
	);
}
