import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, GitPullRequest, MessageSquareWarning, Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";
import Link from "next/link";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return {
		title: dict.contribute.title,
		description: dict.contribute.lead,
		alternates: {
			canonical: route(params.lang, "contribute"),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "contribute")])),
		},
	};
}

/**
 * Remplace l'éditeur MDX en ligne. Un site de référence ne peut pas accepter de
 * contenu publié directement : tout passe par une relecture, donc par le dépôt.
 */
const CONTENT: Record<
	Lang,
	{
		intro: string;
		actions: { icon: "plus" | "warning" | "pr"; title: string; body: string; cta: string; href: string }[];
		criteriaTitle: string;
		criteria: string[];
		noteTitle: string;
		note: string;
	}
> = {
	fr: {
		intro:
			"Le contenu et le code de ce site sont publics. Il n'y a pas d'éditeur en ligne : toute proposition passe par le dépôt, ce qui garantit qu'aucune référence n'est publiée sans relecture et sans source vérifiable.",
		actions: [
			{
				icon: "plus",
				title: "Proposer une étude",
				body: "Ouvrez une issue en indiquant le DOI et le thème qui vous semble pertinent. Les métadonnées seront importées automatiquement depuis OpenAlex : inutile de les recopier.",
				cta: "Ouvrir une issue",
				href: "/issues/new",
			},
			{
				icon: "warning",
				title: "Signaler une erreur",
				body: "Rattachement thématique discutable, définition imprécise, lien mort, contresens de traduction : signalez-le en précisant la page concernée.",
				cta: "Signaler",
				href: "/issues/new",
			},
			{
				icon: "pr",
				title: "Écrire une définition ou un dossier",
				body: "Les entrées du glossaire et les dossiers sont des fichiers MDX. Chaque définition doit citer une source officielle, chaque graphique un jeu de données daté.",
				cta: "Voir le contenu",
				href: "/tree/main/content",
			},
		],
		criteriaTitle: "Ce qui est référencé",
		criteria: [
			"Articles publiés dans des revues à comité de lecture.",
			"Rapports d'institutions scientifiques : GIEC, agences spatiales, services météorologiques nationaux, Copernicus.",
			"Synthèses et méta-analyses, en particulier lorsqu'elles font consensus.",
			"Jeux de données scientifiques documentés et accessibles.",
		],
		noteTitle: "Ce qui n'est pas référencé",
		note: "Billets de blog, articles de presse, prépublications non commentées et documents de plaidoyer, même quand leur propos est juste. Ce n'est pas un jugement sur leur valeur : le site n'a d'utilité que si son périmètre est prévisible.",
	},
	en: {
		intro:
			"The content and code of this site are public. There is no online editor: every proposal goes through the repository, which is what guarantees no reference is published without review and a verifiable source.",
		actions: [
			{
				icon: "plus",
				title: "Suggest a study",
				body: "Open an issue with the DOI and the theme you think fits. Metadata is imported automatically from OpenAlex — no need to copy it out.",
				cta: "Open an issue",
				href: "/issues/new",
			},
			{
				icon: "warning",
				title: "Report an error",
				body: "Questionable theme assignment, imprecise definition, dead link, mistranslation: report it and name the page concerned.",
				cta: "Report",
				href: "/issues/new",
			},
			{
				icon: "pr",
				title: "Write a definition or a brief",
				body: "Glossary entries and topic briefs are MDX files. Every definition must cite an official source, every chart a dated dataset.",
				cta: "Browse the content",
				href: "/tree/main/content",
			},
		],
		criteriaTitle: "What gets indexed",
		criteria: [
			"Articles published in peer-reviewed journals.",
			"Reports from scientific institutions: IPCC, space agencies, national weather services, Copernicus.",
			"Reviews and meta-analyses, particularly where they reflect a consensus.",
			"Documented, accessible scientific datasets.",
		],
		noteTitle: "What does not get indexed",
		note: "Blog posts, news articles, uncommented preprints and advocacy documents, even when they are right. This is not a judgement on their worth: the site is only useful if its scope is predictable.",
	},
};

const ICONS = { plus: Plus, warning: MessageSquareWarning, pr: GitPullRequest };

export default function ContributePage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const content = CONTENT[lang];

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.contribute.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.contribute.lead}</p>
			</header>

			<div className="mt-8 max-w-2xl">
				<p className="leading-relaxed text-foreground/85">{content.intro}</p>
			</div>

			<ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
				{content.actions.map((action) => {
					const Icon = ICONS[action.icon];
					return (
						<li key={action.title} className="flex flex-col bg-background p-6">
							<Icon className="h-5 w-5 text-primary" aria-hidden="true" />
							<h2 className="mt-3 font-serif text-lg font-semibold tracking-tight">{action.title}</h2>
							<p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{action.body}</p>
							<a
								href={`${siteConfig.repository}${action.href}`}
								target="_blank"
								rel="noreferrer"
								className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
							>
								{action.cta}
								<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
							</a>
						</li>
					);
				})}
			</ul>

			<div className="mt-12 grid max-w-4xl gap-10 sm:grid-cols-2">
				<section>
					<h2 className="font-serif text-xl font-semibold tracking-tight">{content.criteriaTitle}</h2>
					<ul className="mt-3 space-y-2">
						{content.criteria.map((item) => (
							<li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
								<span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
								{item}
							</li>
						))}
					</ul>
				</section>

				<section>
					<h2 className="font-serif text-xl font-semibold tracking-tight">{content.noteTitle}</h2>
					<p className="mt-3 text-sm leading-relaxed text-foreground/85">{content.note}</p>
					<p className="mt-4 text-sm">
						<Link href={route(lang, "methodology")} className="text-primary hover:underline">
							{dict.methodology.title}
						</Link>
					</p>
				</section>
			</div>
		</div>
	);
}
