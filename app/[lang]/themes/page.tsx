import { notFound } from "next/navigation";
import Link from "next/link";
import { DitherSurface } from "@/components/site/Dither";
import { getThemeSummaries } from "@/lib/content/themes";
import { themeHue, themeLabel } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { formatNumber } from "@/lib/format";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return pageMetadata({
		lang: params.lang,
		title: dict.themes.title,
		description: dict.themes.lead,
		section: "themes",
	});
}

export default function ThemesPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const summaries = getThemeSummaries(lang);

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{dict.themes.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.themes.lead}
					</p>
				</div>
			</section>

			<div className="container py-12">
				<ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
					{summaries.map((summary) => (
						<li key={summary.id}>
							<Link
								href={route(lang, "themes", summary.id)}
								style={{ "--h": themeHue(summary.id) } as React.CSSProperties}
								className="group flex h-full flex-col bg-card p-5 transition-colors hover:bg-[hsl(var(--h)_60%_97%)] dark:hover:bg-[hsl(var(--h)_40%_11%)]"
							>
								<span className="flex items-center gap-2">
									<span
										aria-hidden="true"
										className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--h)_60%_45%)] dark:bg-[hsl(var(--h)_55%_60%)]"
									/>
									<span className="font-serif text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[hsl(var(--h)_55%_32%)] dark:group-hover:text-[hsl(var(--h)_55%_72%)]">
										{themeLabel(summary.id, lang)}
									</span>
								</span>

								<span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular">
									<span>
										{formatNumber(summary.studies, lang)} {dict.themes.studies}
									</span>
									<span>
										{formatNumber(summary.glossary, lang)} {dict.themes.glossary}
									</span>
									<span>
										{formatNumber(summary.topics, lang)} {dict.themes.topics}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
