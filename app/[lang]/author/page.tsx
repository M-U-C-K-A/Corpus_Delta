import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";
import { DitherSurface } from "@/components/site/Dither";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return pageMetadata({
		lang: params.lang,
		title: dict.author.title,
		description: dict.author.lead,
		section: "author",
	});
}

/**
 * Page d'auteur.
 *
 * Le contenu vit ici plutôt que dans les dictionnaires : c'est un texte suivi,
 * pas une interface, et le découper en clés le rendrait illisible à relire.
 */
const CONTENT: Record<Lang, { heading: string; body: string[] }[]> = {
	fr: [
		{
			heading: "Ce que je fais",
			body: [
				"Je suis développeur web. J'ai vingt-quatre ans, et ce site est né d'une frustration simple : les données sur le climat existent, elles sont publiques, souvent gratuites — et pourtant presque personne ne les consulte à la source. Entre le fichier brut d'un observatoire et ce qu'en comprend quelqu'un qui n'est pas du métier, il manque un travail que personne n'a intérêt à faire. C'est celui-là qui m'intéresse.",
				"Mon métier consiste à rendre de l'information manipulable : la récupérer là où elle se trouve, la structurer, la présenter de façon qu'on puisse s'en servir. Appliqué au climat, ça donne ce site. Je n'apporte pas de science ; j'apporte de l'accès.",
			],
		},
		{
			heading: "Ce que je ne suis pas",
			body: [
				"Je ne suis ni climatologue, ni chercheur, ni journaliste scientifique. Cette précision n'est pas de la modestie de façade : elle explique la manière dont ce site est construit.",
				"Comme je n'ai aucune autorité propre sur le sujet, je ne peux pas demander qu'on me croie sur parole. D'où la règle qui gouverne tout le reste : aucune métadonnée bibliographique n'est saisie à la main, aucune série chiffrée n'est recopiée, chaque définition cite la source dont elle est tirée. Ce ne sont pas des scrupules de développeur — c'est la seule façon pour un non-spécialiste de produire quelque chose de vérifiable.",
				"La contrepartie est que vous n'avez pas à me faire confiance. Vous pouvez remonter à la source de chaque affirmation, et le code qui les produit est lisible par n'importe qui.",
			],
		},
		{
			heading: "Pourquoi le climat",
			body: [
				"Parce que c'est le sujet où l'écart entre ce que la science établit et ce qui circule dans le débat public est le plus large, et le plus coûteux. Il ne manque pas de recherche sur le climat — il en manque terriblement peu. Ce qui manque, ce sont des chemins praticables pour y entrer.",
				"Une part de cet écart est du vocabulaire. « Canicule », « forçage radiatif », « point de bascule », « scénario SSP » : ces mots ont un sens précis, et ce sens est presque toujours plus intéressant que l'usage flou qu'on en fait. Le glossaire est né de là, et il est devenu la partie du site à laquelle je tiens le plus.",
				"Le reste tient à des données qui me fascinent pour elles-mêmes. Une courbe de CO₂ mesurée sans interruption depuis 1958 au milieu du Pacifique, l'année où chaque modèle franchit un palier de réchauffement, l'étendue de la banquise chaque mois de septembre depuis 1979 : ce sont des objets remarquables avant d'être des arguments.",
			],
		},
		{
			heading: "Pourquoi tout est ouvert",
			body: [
				"Le code, le contenu, les scripts d'ingestion, l'historique des modifications : tout est public, sous licence MIT, sur un dépôt que n'importe qui peut cloner.",
				"C'est d'abord cohérent avec la promesse du site. Un annuaire qui demande qu'on vérifie ses sources et qui garderait sa fabrication secrète serait mal placé pour parler de transparence. On peut lire le script qui interroge OpenAlex, voir exactement ce qu'il conserve et ce qu'il écarte, et refaire le corpus depuis zéro.",
				"C'est ensuite ce à quoi je crois. Le web s'est construit sur des spécifications publiques, des implémentations qu'on pouvait lire et des gens qui publiaient leur travail sans savoir qui s'en servirait. J'ai appris ce métier grâce à des inconnus qui avaient rendu leur code lisible. Rendre le mien ouvert est la seule manière que je connaisse de rendre la pareille.",
				"Concrètement : si une définition est fausse, corrigez-la. Si une étude manque, proposez son DOI. Si le code est maladroit, dites-le. Tout passe par le dépôt, ce qui laisse une trace publique de chaque correction.",
			],
		},
		{
			heading: "Ce que ce projet n'est pas",
			body: [
				"Il n'est financé par personne, ne vend rien, n'affiche aucune publicité et ne collecte aucune donnée sur ses visiteurs. Il n'est adossé à aucune institution et ne parle au nom d'aucune organisation.",
				"Il n'a pas non plus vocation à remplacer la lecture des sources. Au mieux, il y conduit plus vite.",
			],
		},
	],
	en: [
		{
			heading: "What I do",
			body: [
				"I am a web developer. I am twenty-four, and this site grew out of a simple frustration: climate data exists, it is public, often free — and yet almost nobody consults it at the source. Between an observatory's raw file and what someone outside the field can make of it lies a piece of work nobody has an interest in doing. That is the work that interests me.",
				"My trade is making information workable: fetching it where it lives, structuring it, presenting it so that it can be used. Applied to climate, that gives this site. I contribute no science; I contribute access.",
			],
		},
		{
			heading: "What I am not",
			body: [
				"I am not a climate scientist, not a researcher, not a science journalist. This is not false modesty: it explains how the site is built.",
				"Since I hold no authority of my own on the subject, I cannot ask to be taken at my word. Hence the rule that governs everything else: no bibliographic metadata is typed by hand, no numerical series is retyped, every definition cites the source it comes from. These are not a developer's scruples — they are the only way a non-specialist can produce something verifiable.",
				"The upside is that you do not have to trust me. You can trace every claim back to its source, and the code that produces them is readable by anyone.",
			],
		},
		{
			heading: "Why climate",
			body: [
				"Because it is the subject where the gap between what science establishes and what circulates in public debate is widest, and costliest. There is no shortage of climate research — there is remarkably little shortage of it. What is missing are workable ways in.",
				"Part of that gap is vocabulary. \"Heatwave\", \"radiative forcing\", \"tipping point\", \"SSP scenario\": these words have precise meanings, and those meanings are almost always more interesting than the loose usage they get. The glossary grew out of that, and it has become the part of the site I care most about.",
				"The rest comes down to data I find remarkable in its own right. A CO₂ curve measured without interruption since 1958 in the middle of the Pacific, the year each model crosses a warming threshold, Arctic sea ice extent every September since 1979: these are remarkable objects before they are arguments.",
			],
		},
		{
			heading: "Why everything is open",
			body: [
				"The code, the content, the ingestion scripts, the full history of changes: all of it is public, MIT-licensed, in a repository anyone can clone.",
				"First, it is consistent with what the site promises. A directory that asks you to check its sources while keeping its own making secret would be poorly placed to talk about transparency. You can read the script that queries OpenAlex, see exactly what it keeps and what it discards, and rebuild the corpus from scratch.",
				"Second, it is what I believe. The web was built on public specifications, implementations you could read, and people who published their work without knowing who would use it. I learned this trade thanks to strangers who had made their code legible. Making mine open is the only way I know to return the favour.",
				"In practice: if a definition is wrong, correct it. If a study is missing, propose its DOI. If the code is clumsy, say so. Everything goes through the repository, which leaves a public trace of every correction.",
			],
		},
		{
			heading: "What this project is not",
			body: [
				"It is funded by no one, sells nothing, carries no advertising and collects no data about its visitors. It is backed by no institution and speaks for no organisation.",
				"Nor is it meant to replace reading the sources. At best, it gets you there faster.",
			],
		},
	],
};

export default function AuthorPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;
	const dict = getDictionary(lang);
	const sections = CONTENT[lang];

	const links = [
		{ label: dict.methodology.title, href: route(lang, "methodology") },
		{ label: dict.nav.contribute, href: route(lang, "contribute") },
		{ label: dict.about.title, href: route(lang, "about") },
	];

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<p className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
						{dict.author.eyebrow}
					</p>
					<h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{siteConfig.author.name}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.author.lead}
					</p>
				</div>
			</section>

			<div className="container grid gap-12 py-12 lg:grid-cols-[1fr_16rem] lg:gap-16">
				<div className="min-w-0 max-w-2xl space-y-10">
					{sections.map((section) => (
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
				</div>

				<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
					<section>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.author.reach}
						</h2>
						<div className="mt-3 space-y-2 text-sm">
							<a
								href={siteConfig.author.github}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 text-primary hover:underline"
							>
								<Github className="h-3.5 w-3.5" aria-hidden="true" />
								{dict.author.githubLabel}
							</a>
							<a
								href={siteConfig.repository}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1 text-primary hover:underline"
							>
								{dict.footer.sourceCode}
								<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
							</a>
						</div>
					</section>

					<section className="rule space-y-2 pt-6 text-sm">
						{links.map((link) => (
							<Link key={link.href} href={link.href} className="block text-primary hover:underline">
								{link.label}
							</Link>
						))}
					</section>
				</aside>
			</div>
		</div>
	);
}
