import Link from "next/link";
import { notFound } from "next/navigation";
import { BookMarked, FileText, Library, Route as RouteIcon, Rss } from "lucide-react";
import { DitherSurface } from "@/components/site/Dither";
import { getTimeline, groupByDate, type TimelineKind } from "@/lib/content/timeline";
import { getDictionary, interpolate } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { route } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);
	return pageMetadata({
		lang: params.lang,
		title: dict.updates.title,
		description: dict.updates.lead,
		section: "updates",
	});
}

const KIND_ICONS: Record<TimelineKind, typeof Library> = {
	study: Library,
	topic: FileText,
	path: RouteIcon,
	glossary: BookMarked,
};

/*
  Plafonner par jour plutôt qu'au total. Une seule journée d'ajout massif
  remplissait sinon toute la page, et les journées suivantes devenaient
  inatteignables — un journal doit montrer plusieurs dates.
*/
const PER_DAY = 20;
const DAYS = 8;

export default function UpdatesPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);

	const all = getTimeline(lang);
	const days = groupByDate(all)
		.slice(0, DAYS)
		.map((day) => ({ ...day, shown: day.items.slice(0, PER_DAY), hidden: day.items.length - PER_DAY }));

	return (
		<div>
			<section className="relative overflow-hidden border-b border-border">
				<DitherSurface />
				<div className="container relative py-14">
					<h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
						{dict.updates.title}
					</h1>
					<p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{dict.updates.lead}
					</p>
					<a
						href={`/${lang}/rss.xml`}
						className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
					>
						<Rss className="h-3.5 w-3.5" aria-hidden="true" />
						{dict.updates.follow}
					</a>
				</div>
			</section>

			<div className="container grid gap-12 py-12 lg:grid-cols-[1fr_16rem] lg:gap-16">
				<div className="min-w-0">
					{days.map((day) => (
						<section key={day.date} className="rule pt-8 first:border-t-0 first:pt-0">
							<div className="flex flex-wrap items-baseline justify-between gap-x-4">
								<h2 className="font-serif text-xl font-semibold tracking-tight">
									{formatDate(day.date, lang)}
								</h2>
								<p className="text-xs text-muted-foreground tabular">
									{formatNumber(day.items.length, lang)} {dict.updates.entries}
								</p>
							</div>

							<ul className="mt-4 space-y-4">
								{day.shown.map((item) => {
									const Icon = KIND_ICONS[item.kind];
									return (
										<li key={item.url} className="flex gap-3">
											<Icon
												className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
												aria-hidden="true"
											/>
											<div className="min-w-0">
												<Link href={item.url} className="group block">
													<span className="text-[0.9375rem] leading-snug transition-colors group-hover:text-primary">
														{item.title}
													</span>
												</Link>
												<p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
													{item.description}
												</p>
											</div>
										</li>
									);
								})}
							</ul>

							{day.hidden > 0 && (
								<p className="mt-3 text-sm text-muted-foreground">
									{interpolate(dict.updates.more, { count: formatNumber(day.hidden, lang) })}
								</p>
							)}
						</section>
					))}
				</div>

				<aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
					{/*
					  Dit franchement pourquoi les dates sont groupées, plutôt que de
					  laisser croire à un défaut d'affichage.
					*/}
					<p className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
						{dict.updates.seeded}
					</p>

					<dl className="space-y-1.5 text-sm">
						<div className="flex items-baseline justify-between gap-3">
							<dt className="text-muted-foreground">{dict.updates.entries}</dt>
							<dd className="tabular font-medium">{formatNumber(all.length, lang)}</dd>
						</div>
					</dl>

					<Link
						href={route(lang, "methodology")}
						className="block text-sm text-primary hover:underline"
					>
						{dict.methodology.title}
					</Link>
				</aside>
			</div>
		</div>
	);
}
