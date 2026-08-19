import Link from "next/link";
import { Wordmark } from "@/components/site/Wordmark";
import { siteConfig } from "@/lib/site-config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { route, homeRoute } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export function SiteFooter({ lang }: { lang: Lang }) {
	const dict = getDictionary(lang);

	const columns = [
		{
			heading: dict.footer.browse,
			links: [
				{ label: dict.nav.studies, href: route(lang, "studies") },
				{ label: dict.nav.glossary, href: route(lang, "glossary") },
				{ label: dict.nav.topics, href: route(lang, "topics") },
			],
		},
		{
			heading: dict.footer.project,
			links: [
				{ label: dict.nav.methodology, href: route(lang, "methodology") },
				{ label: dict.nav.contribute, href: route(lang, "contribute") },
				{ label: dict.nav.about, href: route(lang, "about") },
			],
		},
	];

	return (
		<footer className="mt-20 border-t border-border bg-muted/30">
			<div className="container grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
				<div className="max-w-sm">
					<Link href={homeRoute(lang)} className="inline-block">
						<Wordmark name={siteConfig.name} />
					</Link>
					<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
						{siteConfig.description[lang]}
					</p>
				</div>

				{columns.map((column) => (
					<div key={column.heading}>
						<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
							{column.heading}
						</h2>
						<ul className="mt-3 space-y-2">
							{column.links.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-foreground/80 transition-colors hover:text-foreground"
									>
										{link.label}
									</Link>
								</li>
							))}
							{column.heading === dict.footer.project && (
								<li>
									<a
										href={siteConfig.repository}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-foreground/80 transition-colors hover:text-foreground"
									>
										{dict.footer.sourceCode}
									</a>
								</li>
							)}
						</ul>
					</div>
				))}
			</div>

			{/*
			  Mention d'indépendance : la version précédente affichait des logos
			  d'ONG comme s'il s'agissait de partenaires. Le rapport aux organisations
			  citées doit être explicite et lisible.
			*/}
			<div className="border-t border-border/70">
				<div className="container flex flex-col gap-1 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<p>{dict.footer.builtWith}</p>
					<p>{dict.footer.noAffiliation}</p>
				</div>
			</div>
		</footer>
	);
}
