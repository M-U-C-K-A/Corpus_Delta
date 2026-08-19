import Link from "next/link";
import { ArrowRight, BookMarked, Library, Quote, Unlock } from "lucide-react";
import { notFound } from "next/navigation";
import { HomeSearch } from "@/components/site/HomeSearch";
import { StudyList } from "@/components/site/StudyCard";
import { getAllStudies, getCorpusStats } from "@/lib/content/studies";
import { getGlossary } from "@/lib/content/glossary";
import { getTopics } from "@/lib/content/topics";
import { THEME_IDS, themeLabel } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export default function HomePage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);

	const stats = getCorpusStats();
	const glossary = getGlossary(lang).length || getGlossary("fr").length;
	const topics = getTopics(lang).length || getTopics("fr").length;
	const latest = getAllStudies().slice(0, 5);

	// Chaque compteur est calculé sur le corpus réel : aucune valeur n'est saisie en dur.
	const counters = [
		{ icon: Library, value: stats.total, label: dict.home.statStudies },
		{ icon: Unlock, value: stats.openAccess, label: dict.home.statOpenAccess },
		{ icon: BookMarked, value: glossary, label: dict.home.statTerms },
		{ icon: Quote, value: topics, label: dict.home.statTopics },
	];

	return (
		<>
			<section className="border-b border-border bg-gradient-to-b from-accent/40 to-transparent">
				<div className="container max-w-4xl py-16 md:py-24">
					<h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
						{siteConfig.name}
					</h1>
					<p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.home.lead}
					</p>

					<div className="mt-8 max-w-2xl">
						<HomeSearch
							lang={lang}
							label={dict.common.search}
							placeholder={dict.common.searchPlaceholder}
							cta={dict.home.searchCta}
						/>
					</div>

					<dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
						{counters.map(({ icon: Icon, value, label }) => (
							<div key={label} className="flex flex-col gap-1">
								<dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.07em] text-muted-foreground">
									<Icon className="h-3.5 w-3.5" aria-hidden="true" />
									{label}
								</dt>
								<dd className="font-serif text-2xl font-semibold tabular">
									{formatNumber(value, lang)}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			<div className="container grid gap-14 py-14 lg:grid-cols-[1fr_20rem] lg:gap-16">
				<div>
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="font-serif text-2xl font-semibold tracking-tight">
							{dict.home.latestAdditions}
						</h2>
						<Link
							href={route(lang, "studies")}
							className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							{dict.studies.allStudies}
							<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
						</Link>
					</div>
					<div className="mt-2">
						<StudyList studies={latest} lang={lang} showAbstract />
					</div>
				</div>

				<aside className="space-y-10">
					<section>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{dict.home.browseByTheme}
						</h2>
						<ul className="mt-3 space-y-1">
							{THEME_IDS.filter((theme) => (stats.themeCounts.get(theme) ?? 0) > 0).map((theme) => (
								<li key={theme}>
									<Link
										href={`${route(lang, "studies")}?theme=${theme}`}
										className="flex items-baseline justify-between gap-3 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
									>
										<span>{themeLabel(theme, lang)}</span>
										<span className="tabular text-xs text-muted-foreground">
											{stats.themeCounts.get(theme)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</section>

					<section className="rounded-lg border border-border bg-card p-5">
						<h2 className="font-serif text-base font-semibold">{dict.home.howItWorks}</h2>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{dict.home.howItWorksBody}
						</p>
						<Link
							href={route(lang, "methodology")}
							className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							{dict.home.readMethodology}
							<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
						</Link>
					</section>
				</aside>
			</div>
		</>
	);
}
