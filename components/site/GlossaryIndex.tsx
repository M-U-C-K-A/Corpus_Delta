"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { route } from "@/lib/routes";
import { themeHue, themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import type { Lang } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export interface GlossaryItem {
	slug: string;
	term: string;
	shortDefinition: string;
	synonyms: string[];
	themes: string[];
	initial: string;
}

function normalise(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase();
}

/**
 * Index du glossaire : recherche plein texte, filtre par thème et saut à la
 * lettre.
 *
 * Les trois servent des usages distincts. On cherche quand on sait quel terme
 * on veut, on filtre quand on explore un domaine, et on saute à la lettre
 * quand on balaie une liste trop longue pour la molette — ce qu'elle est
 * devenue en passant quatre-vingts entrées.
 */
export function GlossaryIndex({
	lang,
	items,
	labels,
}: {
	lang: Lang;
	items: GlossaryItem[];
	labels: {
		search: string;
		placeholder: string;
		empty: string;
		reset: string;
		results: string;
		resultsPlural: string;
	};
}) {
	const [query, setQuery] = useState("");
	const [theme, setTheme] = useState<ThemeId | null>(null);

	/** Thèmes réellement portés par au moins un terme, et leur compte. */
	const themes = useMemo(() => {
		const counts = new Map<string, number>();
		for (const item of items) {
			for (const id of item.themes) counts.set(id, (counts.get(id) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1]) as [ThemeId, number][];
	}, [items]);

	const filtered = useMemo(() => {
		const needle = normalise(query.trim());
		return items.filter((item) => {
			if (theme && !item.themes.includes(theme)) return false;
			if (!needle) return true;
			// La recherche porte aussi sur les synonymes et la définition courte :
			// on cherche souvent un terme par sa périphrase, pas par son nom exact.
			return [item.term, item.shortDefinition, ...item.synonyms].some((field) =>
				normalise(field).includes(needle)
			);
		});
	}, [items, query, theme]);

	const groups = useMemo(() => {
		const map = new Map<string, GlossaryItem[]>();
		for (const item of filtered) {
			const bucket = map.get(item.initial) ?? [];
			bucket.push(item);
			map.set(item.initial, bucket);
		}
		return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
	}, [filtered]);

	// L'alphabet entier est affiché, pas seulement les lettres présentes : une
	// barre dont les touches changent de place à chaque frappe ne se vise plus.
	const alphabet = useMemo(() => {
		const present = new Set(groups.map(([initial]) => initial));
		return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
			letter,
			present: present.has(letter),
		}));
	}, [groups]);

	const active = query.trim() !== "" || theme !== null;

	return (
		<div>
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative min-w-[16rem] flex-1 sm:max-w-md sm:flex-none">
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

				<p className="text-sm text-muted-foreground tabular" aria-live="polite">
					{filtered.length} {filtered.length === 1 ? labels.results : labels.resultsPlural}
				</p>

				{active && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							setTheme(null);
						}}
						className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					>
						<X className="h-3 w-3" aria-hidden="true" />
						{labels.reset}
					</button>
				)}
			</div>

			<ul className="mt-4 flex flex-wrap gap-1.5">
				{themes.map(([id, count]) => {
					const selected = theme === id;
					return (
						<li key={id}>
							<button
								type="button"
								aria-pressed={selected}
								onClick={() => setTheme(selected ? null : id)}
								style={{ "--h": themeHue(id) } as React.CSSProperties}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
									selected
										? "border-[hsl(var(--h)_50%_55%)] bg-[hsl(var(--h)_60%_92%)] text-[hsl(var(--h)_55%_24%)] dark:bg-[hsl(var(--h)_45%_22%)] dark:text-[hsl(var(--h)_60%_82%)]"
										: "border-[hsl(var(--h)_45%_82%)] bg-[hsl(var(--h)_60%_96%)] text-[hsl(var(--h)_55%_28%)] hover:border-[hsl(var(--h)_50%_65%)] dark:border-[hsl(var(--h)_35%_28%)] dark:bg-[hsl(var(--h)_40%_14%)] dark:text-[hsl(var(--h)_55%_74%)]"
								)}
							>
								{themeLabel(id, lang)}
								<span className="tabular opacity-60">{count}</span>
							</button>
						</li>
					);
				})}
			</ul>

			<nav aria-label="A–Z" className="rule mt-6 flex flex-wrap gap-x-1 gap-y-1 pt-5">
				{alphabet.map(({ letter, present }) =>
					present ? (
						<a
							key={letter}
							href={`#letter-${letter}`}
							className="inline-flex h-7 w-7 items-center justify-center rounded text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							{letter}
						</a>
					) : (
						<span
							key={letter}
							aria-hidden="true"
							className="inline-flex h-7 w-7 items-center justify-center rounded text-xs text-muted-foreground/25"
						>
							{letter}
						</span>
					)
				)}
			</nav>

			{groups.length === 0 ? (
				<p className="mt-10 text-sm text-muted-foreground">{labels.empty}</p>
			) : (
				<div className="mt-10 space-y-10">
					{groups.map(([initial, entries]) => (
						<section key={initial} aria-labelledby={`letter-${initial}`}>
							{/* scroll-mt : l'en-tête du site est fixe et masquerait la lettre visée. */}
							<h2
								id={`letter-${initial}`}
								className="scroll-mt-24 border-b border-border pb-1.5 font-serif text-lg font-semibold text-muted-foreground"
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
