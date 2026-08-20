import Link from "next/link";
import { MainNav, type NavItem } from "@/components/site/MainNav";
import { MobileNav } from "@/components/site/MobileNav";
import { SearchPalette } from "@/components/site/SearchPalette";
import { LangSwitcher } from "@/components/site/LangSwitcher";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Wordmark } from "@/components/site/Wordmark";
import { getGlobalEntries } from "@/lib/search/global";
import { siteConfig } from "@/lib/site-config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homeRoute } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export function SiteHeader({ lang }: { lang: Lang }) {
	const dict = getDictionary(lang);

	const items: NavItem[] = [
		{ section: "studies", label: dict.nav.studies },
		{ section: "glossary", label: dict.nav.glossary },
		{ section: "topics", label: dict.nav.topics },
		{ section: "paths", label: dict.nav.paths },
		{ section: "indicators", label: dict.nav.indicators },
	];

	const mobileItems: NavItem[] = [...items, { section: "methodology", label: dict.nav.methodology }];

	return (
		<header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
			{/*
			  Trois zones alignées sur une seule ligne de base : identité, navigation,
			  outils. La version précédente utilisait une grille en trois colonnes qui
			  décalait le titre dès que la navigation changeait de largeur.
			*/}
			<div className="container flex h-16 items-center gap-6">
				<Link
					href={homeRoute(lang)}
					className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Wordmark name={siteConfig.name} tagline={siteConfig.tagline[lang]} />
				</Link>

				<div className="flex-1">
					<MainNav lang={lang} items={items} />
				</div>

				<div className="flex shrink-0 items-center gap-1">
					<SearchPalette
						entries={getGlobalEntries(lang)}
						labels={{
							open: dict.search.open,
							placeholder: dict.search.placeholder,
							empty: dict.search.empty,
							emptyHint: dict.search.emptyHint,
							groups: {
								study: dict.search.groupStudies,
								glossary: dict.search.groupGlossary,
								topic: dict.search.groupTopics,
								path: dict.search.groupPaths,
							},
							hintNavigate: dict.search.hintNavigate,
							hintSelect: dict.search.hintSelect,
							hintClose: dict.search.hintClose,
						}}
					/>
					<LangSwitcher lang={lang} label={dict.common.language} />
					<ThemeToggle
						labels={{
							toggle: dict.common.toggleTheme,
							light: dict.common.lightTheme,
							dark: dict.common.darkTheme,
							system: dict.common.systemTheme,
						}}
					/>
					<MobileNav lang={lang} items={mobileItems} label={dict.nav.openMenu} title={siteConfig.name} />
				</div>
			</div>
		</header>
	);
}
