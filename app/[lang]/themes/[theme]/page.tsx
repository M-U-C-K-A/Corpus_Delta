import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookMarked, FileText, Library, Route as RouteIcon, Rss } from "lucide-react";
import { DitherBand } from "@/components/site/Dither";
import { StudyCard } from "@/components/site/StudyCard";
import { TranslationNotice } from "@/components/site/TranslationNotice";
import { getThemeCollection } from "@/lib/content/themes";
import { THEME_IDS, isThemeId, themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS, type Lang } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { formatNumber } from "@/lib/format";

export function generateStaticParams() {
	return LANGS.flatMap((lang) => THEME_IDS.map((theme) => ({ lang, theme })));
}

export function generateMetadata({ params }: { params: { lang: string; theme: string } }) {
	if (!isLang(params.lang) || !isThemeId(params.theme)) return {};
	const dict = getDictionary(params.lang);
	const collection = getThemeCollection(params.lang, params.theme);

	return pageMetadata({
		lang: params.lang,
		title: themeLabel(params.theme, params.lang),
		description: `${formatNumber(collection.studies.length, params.lang)} ${dict.themes.studies}, ${formatNumber(collection.glossary.length, params.lang)} ${dict.themes.glossary}, ${formatNumber(collection.topics.length, params.lang)} ${dict.themes.topics}.`,
		section: "themes",
		segments: [params.theme],
	});
}

/** Le corps de page n'affiche que les sections qui ont de la matière. */
function Section({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof BookMarked;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h2 className="inline-flex items-center gap-2 font-serif text-xl font-semibold tracking-tight">
				<Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
				{title}
			</h2>
			<div className="mt-4">{children}</div>
		</section>
	);
}

export default function ThemePage({ params }: { params: { lang: string; theme: string } }) {
	if (!isLang(params.lang) || !isThemeId(params.theme)) notFound();
	const lang: Lang = params.lang;
	const theme: ThemeId = params.theme;
	const dict = getDictionary(lang);
	const { studies, glossary, topics, paths, fallback } = getThemeCollection(lang, theme);

	const counters = [
		{ value: studies.length, label: dict.themes.studies },
		{ value: glossary.length, label: dict.themes.glossary },
		{ value: topics.length, label: dict.themes.topics },
		{ value: paths.length, label: dict.themes.paths },
	].filter((item) => item.value > 0);

	const siblings = THEME_IDS.filter((id) => id !== theme);

	return (
		<div className="relative">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-80">
				<DitherBand theme={theme} />
			</div>

			<div className="container relative py-10">
				<nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
					<Link href={route(lang, "themes")} className="hover:text-foreground">
						{dict.themes.title}
					</Link>
				</nav>

				<div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_17rem]">
					<div className="min-w-0">
						<header className="max-w-2xl">
							<h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight">
								{themeLabel(theme, lang)}
							</h1>
							<dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
								{counters.map((item) => (
									<div key={item.label} className="flex items-baseline gap-1.5">
										<dt className="sr-only">{item.label}</dt>
										<dd className="tabular font-medium text-foreground">
											{formatNumber(item.value, lang)}
										</dd>
										<span>{item.label}</span>
									</div>
								))}
							</dl>
						</header>

						{fallback && <TranslationNotice lang={lang} className="mt-6 max-w-2xl" />}

						<div className="mt-10 space-y-12">
							{topics.length > 0 && (
								<Section title={dict.nav.topics} icon={FileText}>
									<ul className="space-y-3">
										{topics.map((entry) => (
											<li key={entry.slug}>
												<Link
													href={route(lang, "topics", entry.slug)}
													className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
												>
													<span className="font-serif text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
														{entry.frontmatter.title}
													</span>
													<span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
														{entry.frontmatter.description}
													</span>
												</Link>
											</li>
										))}
									</ul>
								</Section>
							)}

							{paths.length > 0 && (
								<Section title={dict.paths.title} icon={RouteIcon}>
									<ul className="space-y-2">
										{paths.map((entry) => (
											<li key={entry.slug}>
												<Link
													href={route(lang, "paths", entry.slug)}
													className="group inline-flex items-baseline gap-2"
												>
													<span className="transition-colors group-hover:text-primary">
														{entry.frontmatter.title}
													</span>
													<span className="text-xs text-muted-foreground tabular">
														{entry.frontmatter.steps.length} {dict.paths.steps}
													</span>
												</Link>
											</li>
										))}
									</ul>
								</Section>
							)}

							{glossary.length > 0 && (
								<Section title={dict.nav.glossary} icon={BookMarked}>
									<ul className="flex flex-wrap gap-2">
										{glossary.map((entry) => (
											<li key={entry.slug}>
												<Link
													href={route(lang, "glossary", entry.slug)}
													className="inline-block rounded-md border border-border px-2.5 py-1 text-sm transition-colors hover:border-primary/40 hover:text-primary"
												>
													{entry.frontmatter.term}
												</Link>
											</li>
										))}
									</ul>
								</Section>
							)}

							{studies.length > 0 && (
								<Section title={dict.themes.mostCited} icon={Library}>
									<ul className="space-y-3">
										{studies.slice(0, 8).map((study) => (
											<li key={study.id}>
												<StudyCard study={study} lang={lang} />
											</li>
										))}
									</ul>

									{studies.length > 8 && (
										<Link
											href={`${route(lang, "studies")}?theme=${theme}`}
											className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
										>
											{dict.themes.allStudies}
											<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
										</Link>
									)}
								</Section>
							)}
						</div>
					</div>

					<aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
						<section>
							<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
								{dict.themes.otherThemes}
							</h2>
							<ul className="mt-3 space-y-1.5">
								{siblings.map((id) => (
									<li key={id}>
										<Link
											href={route(lang, "themes", id)}
											className="block text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground"
										>
											{themeLabel(id, lang)}
										</Link>
									</li>
								))}
							</ul>
						</section>

						{/* Discret et propre au thème : rien n'est ajouté à la navigation du site. */}
						<section className="rule pt-6">
							<a
								href={`/${lang}/themes/${theme}/rss.xml`}
								className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
							>
								<Rss className="h-3.5 w-3.5" aria-hidden="true" />
								{dict.themes.feed}
							</a>
						</section>
					</aside>
				</div>
			</div>
		</div>
	);
}
