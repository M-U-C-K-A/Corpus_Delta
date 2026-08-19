"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export interface GlossaryItem {
	slug: string;
	term: string;
	shortDefinition: string;
	synonyms: string[];
	initial: string;
}

function normalise(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase();
}

export function GlossaryIndex({
	lang,
	items,
	labels,
}: {
	lang: Lang;
	items: GlossaryItem[];
	labels: { search: string; placeholder: string; empty: string };
}) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const needle = normalise(query.trim());
		if (!needle) return items;
		// La recherche porte aussi sur les synonymes et la définition courte :
		// on cherche souvent un terme par sa périphrase, pas par son nom exact.
		return items.filter((item) =>
			[item.term, item.shortDefinition, ...item.synonyms].some((field) =>
				normalise(field).includes(needle)
			)
		);
	}, [items, query]);

	const groups = useMemo(() => {
		const map = new Map<string, GlossaryItem[]>();
		for (const item of filtered) {
			const bucket = map.get(item.initial) ?? [];
			bucket.push(item);
			map.set(item.initial, bucket);
		}
		return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
	}, [filtered]);

	return (
		<div>
			<div className="relative max-w-md">
				<label htmlFor="glossary-search" className="sr-only">
					{labels.search}
				</label>
				<Search
					aria-hidden="true"
					className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					id="glossary-search"
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={labels.placeholder}
					className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
				/>
			</div>

			{groups.length === 0 ? (
				<p className="mt-10 text-sm text-muted-foreground">{labels.empty}</p>
			) : (
				<div className="mt-10 space-y-10">
					{groups.map(([initial, entries]) => (
						<section key={initial} aria-labelledby={`letter-${initial}`}>
							<h2
								id={`letter-${initial}`}
								className="border-b border-border pb-1.5 font-serif text-lg font-semibold text-muted-foreground"
							>
								{initial}
							</h2>
							<ul className="mt-3 grid gap-x-10 gap-y-4 sm:grid-cols-2">
								{entries.map((entry) => (
									<li key={entry.slug}>
										<Link href={route(lang, "glossary", entry.slug)} className="group block">
											<span className="font-medium transition-colors group-hover:text-primary">
												{entry.term}
											</span>
											<span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
												{entry.shortDefinition}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
