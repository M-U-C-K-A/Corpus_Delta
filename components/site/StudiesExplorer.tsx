"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import MiniSearch from "minisearch";
import { Lock, Search, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/lib/search/documents";
import { THEME_IDS, PUBLICATION_TYPE_IDS, themeLabel, publicationTypeLabel, type ThemeId, type PublicationType } from "@/lib/content/taxonomy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { route } from "@/lib/routes";
import { formatNumber, plural } from "@/lib/format";
import type { Lang } from "@/lib/i18n/config";

type Sort = "relevance" | "recent" | "cited";

interface Filters {
	query: string;
	themes: string[];
	types: string[];
	openAccessOnly: boolean;
	sort: Sort;
}

function readFilters(params: URLSearchParams): Filters {
	const sort = params.get("sort");
	return {
		query: params.get("q") ?? "",
		themes: params.getAll("theme").filter((t) => THEME_IDS.includes(t as ThemeId)),
		types: params.getAll("type").filter((t) => PUBLICATION_TYPE_IDS.includes(t as PublicationType)),
		openAccessOnly: params.get("oa") === "1",
		sort: sort === "recent" || sort === "cited" ? sort : "relevance",
	};
}

function toSearchParams(filters: Filters): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.query) params.set("q", filters.query);
	for (const theme of filters.themes) params.append("theme", theme);
	for (const type of filters.types) params.append("type", type);
	if (filters.openAccessOnly) params.set("oa", "1");
	if (filters.sort !== "relevance") params.set("sort", filters.sort);
	return params;
}

export function StudiesExplorer({ lang, documents }: { lang: Lang; documents: StudyDocument[] }) {
	const dict = getDictionary(lang);
	const router = useRouter();
	const searchParams = useSearchParams();
	const filters = readFilters(new URLSearchParams(searchParams.toString()));

	// Champ contrôlé localement : l'URL n'est mise à jour qu'à la validation,
	// pour ne pas empiler une entrée d'historique à chaque frappe.
	const [draftQuery, setDraftQuery] = useState(filters.query);

	const index = useMemo(() => {
		const miniSearch = new MiniSearch<StudyDocument>({
			fields: ["title", "fullTitle", "authors", "venue", "topics", "excerpt"],
			storeFields: ["id"],
			searchOptions: {
				prefix: true,
				fuzzy: 0.15,
				boost: { title: 3, fullTitle: 2, authors: 2 },
			},
		});
		miniSearch.addAll(documents);
		return miniSearch;
	}, [documents]);

	const updateFilters = useCallback(
		(next: Filters) => {
			const params = toSearchParams(next);
			const query = params.toString();
			router.replace(query ? `${route(lang, "studies")}?${query}` : route(lang, "studies"), {
				scroll: false,
			});
		},
		[lang, router]
	);

	const results = useMemo(() => {
		const byId = new Map(documents.map((doc) => [doc.id, doc]));

		let matched: StudyDocument[];
		let rank: Map<string, number> | null = null;

		if (filters.query.trim()) {
			const hits = index.search(filters.query.trim());
			rank = new Map(hits.map((hit, position) => [hit.id as string, position]));
			matched = hits
				.map((hit) => byId.get(hit.id as string))
				.filter((doc): doc is StudyDocument => Boolean(doc));
		} else {
			matched = [...documents];
		}

		const filtered = matched.filter((doc) => {
			if (filters.openAccessOnly && !doc.openAccess) return false;
			if (filters.themes.length && !filters.themes.some((theme) => doc.themes.includes(theme))) return false;
			if (filters.types.length && !filters.types.includes(doc.type)) return false;
			return true;
		});

		if (filters.sort === "recent") return filtered.sort((a, b) => b.year - a.year);
		if (filters.sort === "cited") return filtered.sort((a, b) => b.citedByCount - a.citedByCount);
		// Sans requête, « pertinence » n'a pas de sens : on retombe sur l'ordre chronologique.
		if (!rank) return filtered.sort((a, b) => b.year - a.year);
		return filtered.sort((a, b) => (rank!.get(a.id) ?? 0) - (rank!.get(b.id) ?? 0));
	}, [documents, filters, index]);

	// Compte de chaque facette parmi les résultats des autres facettes, pour ne
	// jamais proposer une case qui donnerait zéro résultat.
	const themeCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const doc of documents) {
			for (const theme of doc.themes) counts.set(theme, (counts.get(theme) ?? 0) + 1);
		}
		return counts;
	}, [documents]);

	const typeCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const doc of documents) counts.set(doc.type, (counts.get(doc.type) ?? 0) + 1);
		return counts;
	}, [documents]);

	const hasFilters =
		Boolean(filters.query) || filters.themes.length > 0 || filters.types.length > 0 || filters.openAccessOnly;

	const toggle = (list: string[], value: string) =>
		list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

	return (
		<div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
			<aside className="lg:sticky lg:top-24 lg:self-start">
				<div className="flex items-center justify-between">
					<h2 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
						{dict.common.filters}
					</h2>
					{hasFilters && (
						<button
							type="button"
							onClick={() => {
								setDraftQuery("");
								updateFilters({ query: "", themes: [], types: [], openAccessOnly: false, sort: "relevance" });
							}}
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						>
							<X className="h-3 w-3" aria-hidden="true" />
							{dict.common.reset}
						</button>
					)}
				</div>

				<FacetGroup title={dict.common.themes}>
					{THEME_IDS.filter((theme) => themeCounts.has(theme)).map((theme) => (
						<FacetCheckbox
							key={theme}
							label={themeLabel(theme, lang)}
							count={themeCounts.get(theme) ?? 0}
							checked={filters.themes.includes(theme)}
							onChange={() => updateFilters({ ...filters, themes: toggle(filters.themes, theme) })}
						/>
					))}
				</FacetGroup>

				<FacetGroup title={dict.common.type}>
					{PUBLICATION_TYPE_IDS.filter((type) => typeCounts.has(type)).map((type) => (
						<FacetCheckbox
							key={type}
							label={publicationTypeLabel(type, lang)}
							count={typeCounts.get(type) ?? 0}
							checked={filters.types.includes(type)}
							onChange={() => updateFilters({ ...filters, types: toggle(filters.types, type) })}
						/>
					))}
				</FacetGroup>

				<FacetGroup title={dict.common.access}>
					<FacetCheckbox
						label={dict.common.openAccessOnly}
						count={documents.filter((doc) => doc.openAccess).length}
						checked={filters.openAccessOnly}
						onChange={() => updateFilters({ ...filters, openAccessOnly: !filters.openAccessOnly })}
					/>
				</FacetGroup>
			</aside>

			<div>
				<form
					role="search"
					onSubmit={(event) => {
						event.preventDefault();
						updateFilters({ ...filters, query: draftQuery });
					}}
					className="flex gap-2"
				>
					<div className="relative flex-1">
						<label htmlFor="studies-search" className="sr-only">
							{dict.common.search}
						</label>
						<Search
							aria-hidden="true"
							className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<input
							id="studies-search"
							type="search"
							value={draftQuery}
							onChange={(event) => setDraftQuery(event.target.value)}
							placeholder={dict.common.searchPlaceholder}
							className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
						/>
					</div>
					<Button type="submit" variant="secondary" className="h-10">
						{dict.common.search}
					</Button>
				</form>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
					<p className="text-sm text-muted-foreground tabular">
						{formatNumber(results.length, lang)}{" "}
						{plural(results.length, dict.common.results, dict.common.resultsPlural)}
					</p>

					<div className="flex items-center gap-2">
						<label htmlFor="studies-sort" className="text-xs text-muted-foreground">
							{dict.common.sortBy}
						</label>
						<select
							id="studies-sort"
							value={filters.sort}
							onChange={(event) => updateFilters({ ...filters, sort: event.target.value as Sort })}
							className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
						>
							<option value="relevance">{dict.common.sortRelevance}</option>
							<option value="recent">{dict.common.sortRecent}</option>
							<option value="cited">{dict.common.sortCited}</option>
						</select>
					</div>
				</div>

				{results.length === 0 ? (
					<div className="py-16 text-center">
						<p className="font-serif text-lg">{dict.common.noResults}</p>
						<p className="mt-1 text-sm text-muted-foreground">{dict.common.noResultsHint}</p>
					</div>
				) : (
					<ul className="divide-y divide-border/70">
						{results.map((doc) => (
							<li key={doc.id} className="group py-5">
								<div className="flex items-start justify-between gap-4">
									<h3 className="font-serif text-lg font-semibold leading-snug tracking-tight">
										<Link
											href={route(lang, "studies", doc.id)}
											className="rounded-sm outline-none transition-colors group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
										>
											{doc.title}
										</Link>
									</h3>
									<span
										className={cn(
											"inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium",
											doc.openAccess ? "bg-openAccess-surface text-openAccess" : "bg-muted text-muted-foreground"
										)}
									>
										{doc.openAccess ? (
											<Unlock className="h-3 w-3" aria-hidden="true" />
										) : (
											<Lock className="h-3 w-3" aria-hidden="true" />
										)}
										{doc.openAccess ? dict.common.openAccess : dict.common.closedAccess}
									</span>
								</div>

								<p className="mt-1.5 text-sm text-muted-foreground tabular">
									{[doc.authors.split(", ")[0], doc.venue, doc.year].filter(Boolean).join(" · ")}
								</p>

								{doc.excerpt && (
									<p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-foreground/75">
										{doc.excerpt}
									</p>
								)}

								<ul className="mt-3 flex flex-wrap gap-1.5">
									{doc.themes.map((theme) => (
										<li key={theme}>
											<span className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
												{themeLabel(theme as ThemeId, lang)}
											</span>
										</li>
									))}
								</ul>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mt-6">
			<h3 className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">{title}</h3>
			<div className="mt-2 space-y-0.5">{children}</div>
		</section>
	);
}

function FacetCheckbox({
	label,
	count,
	checked,
	onChange,
}: {
	label: string;
	count: number;
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<label className="flex cursor-pointer items-baseline gap-2 rounded px-1.5 py-1 text-sm transition-colors hover:bg-muted">
			<input
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[hsl(var(--primary))]"
			/>
			<span className="flex-1">{label}</span>
			<span className="tabular text-xs text-muted-foreground">{count}</span>
		</label>
	);
}
