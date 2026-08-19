import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return {
		title: dict.methodology.title,
		description: dict.methodology.lead,
		alternates: {
			canonical: route(params.lang, "methodology"),
			languages: Object.fromEntries(LANGS.map((l) => [l, route(l, "methodology")])),
		},
	};
}

/**
 * Cette page est le contrat du site avec son lecteur. Elle doit énoncer aussi
 * clairement ce que le site ne fait pas — ne pas le dire est précisément ce qui
 * rendait la version précédente trompeuse.
 */
const CONTENT: Record<Lang, { heading: string; body: string[] }[]> = {
	fr: [
		{
			heading: "D'où viennent les références",
			body: [
				"Chaque étude est ajoutée à partir de son DOI. Un script interroge OpenAlex, et Crossref en second recours, puis enregistre les métadonnées telles qu'elles sont renvoyées : titre, auteurs, revue, année, résumé lorsqu'il est diffusé, statut d'accès ouvert.",
				"Ces champs ne sont jamais saisis ni retouchés à la main. La date de relevé est affichée sur chaque fiche : au-delà, les métadonnées peuvent avoir changé à la source.",
			],
		},
		{
			heading: "Ce qui relève d'un choix éditorial",
			body: [
				"Le rattachement d'une étude à un thème, sa présence dans un dossier, et les éventuelles notes de contexte sont des décisions humaines, prises au moment de l'ajout. Elles sont faillibles et discutables.",
				"Le choix des études référencées n'obéit pas à un protocole systématique : ce site n'est pas une revue de littérature. Il privilégie des travaux publiés dans des revues à comité de lecture, des rapports d'institutions scientifiques, et des synthèses largement citées.",
			],
		},
		{
			heading: "Les résumés et les nombres",
			body: [
				"Les résumés affichés sont ceux des éditeurs, reproduits sans reformulation. Certains éditeurs n'en diffusent pas de version réutilisable : la fiche renvoie alors directement au DOI.",
				"Les compteurs de citations proviennent d'OpenAlex et sont affichés comme tels. Ils diffèrent d'une base à l'autre et sous-estiment parfois nettement le nombre réel : ce sont des ordres de grandeur, pas des mesures.",
			],
		},
		{
			heading: "Les graphiques",
			body: [
				"Les séries chiffrées sont versionnées dans le dépôt, avec leur source et leur date de relevé, toutes deux affichées sous le graphique. Un graphique dont la provenance ne peut pas être montrée n'est pas publié.",
			],
		},
		{
			heading: "Ce que ce site ne fait pas",
			body: [
				"Il ne publie pas de recherche originale et n'organise aucune évaluation par les pairs. Les travaux référencés ont été évalués — ou non — par leurs éditeurs respectifs, pas par ce site.",
				"Il ne classe pas les études par qualité ou par fiabilité, et ne propose aucun mécanisme de vote. Un compteur d'approbations ne dit rien de la solidité d'un travail scientifique.",
				"Il n'est affilié à aucune institution, revue, ONG ou organisme public, et ne relaie l'identité visuelle d'aucune organisation.",
			],
		},
		{
			heading: "Corriger une erreur",
			body: [
				"Les erreurs de rattachement thématique, de traduction ou de contexte sont possibles. Le contenu et le code sont publics : toute correction peut être proposée directement sur le dépôt.",
			],
		},
	],
	en: [
		{
			heading: "Where the references come from",
			body: [
				"Each study is added from its DOI. A script queries OpenAlex, then Crossref as a fallback, and stores the metadata exactly as returned: title, authors, journal, year, abstract where one is released, and open-access status.",
				"These fields are never typed or edited by hand. The retrieval date is shown on every record: beyond it, the metadata may have changed at the source.",
			],
		},
		{
			heading: "What is an editorial decision",
			body: [
				"Assigning a study to a theme, including it in a topic brief, and any contextual note are human decisions made when the study is added. They are fallible and open to challenge.",
				"The selection of indexed studies does not follow a systematic protocol: this is not a literature review. It favours peer-reviewed work, reports from scientific institutions, and widely cited syntheses.",
			],
		},
		{
			heading: "Abstracts and numbers",
			body: [
				"Abstracts are the publishers' own, reproduced without rewording. Some publishers release no reusable abstract; those records link straight to the DOI instead.",
				"Citation counts come from OpenAlex and are labelled as such. They differ between databases and sometimes badly understate the real figure: treat them as orders of magnitude, not measurements.",
			],
		},
		{
			heading: "Charts",
			body: [
				"Numerical series are versioned in the repository along with their source and retrieval date, both displayed under the chart. A chart whose provenance cannot be shown is not published.",
			],
		},
		{
			heading: "What this site does not do",
			body: [
				"It publishes no original research and organises no peer review. The work indexed here was reviewed — or not — by its own publishers, not by this site.",
				"It does not rank studies by quality or reliability, and offers no voting mechanism. An approval counter says nothing about the soundness of a piece of research.",
				"It is not affiliated with any institution, journal, NGO or public body, and does not display any organisation's branding.",
			],
		},
		{
			heading: "Reporting an error",
			body: [
				"Mistakes in theme assignment, translation or context are possible. Content and code are public: corrections can be proposed directly on the repository.",
			],
		},
	],
};

export default function MethodologyPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.methodology.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.methodology.lead}</p>
			</header>

			<div className="mt-10 max-w-2xl space-y-10">
				{CONTENT[lang].map((section) => (
					<section key={section.heading}>
						<h2 className="font-serif text-xl font-semibold tracking-tight">{section.heading}</h2>
						<div className="mt-2 space-y-3">
							{section.body.map((paragraph) => (
								<p key={paragraph} className="leading-relaxed text-foreground/85">
									{paragraph}
								</p>
							))}
						</div>
					</section>
				))}

				<p className="rule pt-6 text-sm text-muted-foreground">
					<Link href={route(lang, "contribute")} className="text-primary hover:underline">
						{dict.nav.contribute}
					</Link>{" "}
					·{" "}
					<a href={siteConfig.repository} target="_blank" rel="noreferrer" className="text-primary hover:underline">
						{dict.footer.sourceCode}
					</a>
				</p>
			</div>
		</div>
	);
}
