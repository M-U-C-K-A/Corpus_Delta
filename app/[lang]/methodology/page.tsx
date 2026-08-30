import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { DitherSurface } from "@/components/site/Dither";
import { getCorpusStats } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { formatDate, formatNumber } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
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
		title: dict.methodology.title,
		description: dict.methodology.lead,
		section: "methodology",
	});
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
			heading: "Comment une étude est retenue",
			body: [
				"Quatre critères, dans cet ordre. La publication doit avoir passé une évaluation par les pairs, ou émaner d'une institution scientifique dont la procédure de relecture est publique — GIEC, agences spatiales, services météorologiques nationaux. Un préprint n'est référencé que s'il fait autorité dans son domaine, et son statut est alors affiché.",
				"Priorité est donnée aux synthèses et aux méta-analyses sur les études primaires isolées : une revue de littérature dit ce qu'établit un champ, un résultat unique dit ce qu'a trouvé une équipe. Cette hiérarchie évite de donner à un travail exploratoire le même poids qu'à un consensus.",
				"Le comptage de citations sert de signal, pas de critère. Il repère les travaux structurants d'un domaine, mais favorise mécaniquement les publications anciennes et les sujets populaires : il est corrigé à la main pour ne pas laisser des pans entiers du corpus dans l'ombre.",
				"Enfin, la couverture thématique est surveillée. Un thème sous-représenté est complété délibérément, ce qui est visible sur le radar de la page Thèmes. Un annuaire dont l'équilibre ne dépendrait que des hasards de la recherche donnerait une image faussée de la littérature.",
			],
		},
		{
			heading: "Les résumés et les nombres",
			body: [
				"Les résumés affichés sont ceux des éditeurs, reproduits sans reformulation. Certains éditeurs n'en diffusent pas de version réutilisable : la fiche renvoie alors directement au DOI.",
				"Les compteurs de citations proviennent d'OpenAlex et sont affichés comme tels. Ils diffèrent d'une base à l'autre et sous-estiment parfois nettement le nombre réel : ce sont des ordres de grandeur, pas des mesures.",
				"Le type de publication vient lui aussi d'OpenAlex, qui se trompe souvent : une revue de littérature y est fréquemment étiquetée « article ». Quand la classification est manifestement fausse, elle est corrigée à la main et la fiche le signale. Sans cela, la facette de l'annuaire contredirait le critère de sélection annoncé plus haut.",
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
			heading: "How a study is selected",
			body: [
				"Four criteria, in this order. The publication must have been peer-reviewed, or come from a scientific institution whose review procedure is public — the IPCC, space agencies, national weather services. A preprint is indexed only if it carries authority in its field, and its status is then displayed.",
				"Priority goes to syntheses and meta-analyses over isolated primary studies: a literature review states what a field has established, a single result states what one team found. This ordering avoids giving exploratory work the same weight as a consensus.",
				"Citation counts serve as a signal, not a criterion. They identify the structuring work of a field, but mechanically favour older publications and popular subjects: they are corrected by hand so that whole parts of the corpus are not left in the dark.",
				"Finally, thematic coverage is watched. An under-represented theme is filled in deliberately, which the radar on the Themes page makes visible. A directory whose balance depended only on the accidents of research would give a distorted picture of the literature.",
			],
		},
		{
			heading: "Abstracts and numbers",
			body: [
				"Abstracts are the publishers' own, reproduced without rewording. Some publishers release no reusable abstract; those records link straight to the DOI instead.",
				"Citation counts come from OpenAlex and are labelled as such. They differ between databases and sometimes badly understate the real figure: treat them as orders of magnitude, not measurements.",
				"Publication type also comes from OpenAlex, which often gets it wrong: a literature review is frequently tagged as an article. Where the classification is plainly mistaken it is corrected by hand and the record says so. Without that, the directory's facet would contradict the selection criterion stated above.",
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

/** Ancre stable dérivée du titre de section, pour le sommaire latéral. */
function anchor(heading: string): string {
	return heading
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export default function MethodologyPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const sections = CONTENT[lang];
	const stats = getCorpusStats();
	const glossary = getGlossary(lang).length || getGlossary("fr").length;

	// Les garanties tenues par la chaîne de production, chiffrées sur le corpus réel.
	const guarantees = [
		{ value: formatNumber(stats.total, lang), label: dict.home.statStudies },
		{ value: formatNumber(stats.openAccess, lang), label: dict.home.statOpenAccess },
		{ value: formatNumber(glossary, lang), label: dict.home.statTerms },
	];

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{dict.methodology.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.methodology.lead}
					</p>
				</div>
			</section>

			<div className="container grid gap-12 py-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
				<div className="min-w-0 max-w-2xl space-y-10">
					{sections.map((section) => (
						<section key={section.heading} id={anchor(section.heading)}>
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
				</div>

				{/*
				  Colonne de droite : sommaire collant et état réel du corpus. La page
				  n'avait aucun repère de navigation et laissait sa moitié droite vide.
				*/}
				<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
					<nav aria-labelledby="method-outline">
						<h2
							id="method-outline"
							className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground"
						>
							{dict.topics.contents}
						</h2>
						<ol className="mt-3 space-y-1.5 border-l border-border">
							{sections.map((section) => (
								<li key={section.heading} className="pl-3">
									<a
										href={`#${anchor(section.heading)}`}
										className="block text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground"
									>
										{section.heading}
									</a>
								</li>
							))}
						</ol>
					</nav>

					<section className="rule pt-6">
						<h2 className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
							{dict.about.corpusState}
						</h2>
						<dl className="mt-3 space-y-1.5 text-sm">
							{guarantees.map((item) => (
								<div key={item.label} className="flex items-baseline justify-between gap-3">
									<dt className="text-muted-foreground">{item.label}</dt>
									<dd className="tabular font-medium">{item.value}</dd>
								</div>
							))}
							{stats.lastAddedAt && (
								<div className="flex items-baseline justify-between gap-3">
									<dt className="text-muted-foreground">{dict.common.addedOn}</dt>
									<dd className="tabular">{formatDate(stats.lastAddedAt, lang)}</dd>
								</div>
							)}
						</dl>
					</section>

					<section className="rule space-y-2 pt-6 text-sm">
						<Link href={route(lang, "contribute")} className="block text-primary hover:underline">
							{dict.nav.contribute}
						</Link>
						<Link href={route(lang, "about")} className="block text-primary hover:underline">
							{dict.about.title}
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
