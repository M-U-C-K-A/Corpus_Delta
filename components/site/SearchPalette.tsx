"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { BookMarked, CornerDownLeft, FileText, Library, Route, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GlobalEntry, GlobalKind } from "@/lib/search/global";

const KIND_ICONS: Record<GlobalKind, typeof Search> = {
	path: Route,
	topic: FileText,
	glossary: BookMarked,
	study: Library,
};

const KIND_ORDER: GlobalKind[] = ["path", "topic", "glossary", "study"];

export interface PaletteLabels {
	open: string;
	placeholder: string;
	empty: string;
	emptyHint: string;
	groups: Record<GlobalKind, string>;
	hintNavigate: string;
	hintSelect: string;
	hintClose: string;
}

export function SearchPalette({
	entries,
	labels,
}: {
	entries: GlobalEntry[];
	labels: PaletteLabels;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const listRef = useRef<HTMLUListElement>(null);
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
	}, []);

	// L'index n'est construit qu'à la première ouverture : inutile de le payer
	// au chargement de chaque page alors que la plupart des visiteurs ne l'ouvriront pas.
	const [primed, setPrimed] = useState(false);
	const index = useMemo(() => {
		if (!primed) return null;
		const miniSearch = new MiniSearch<GlobalEntry>({
			fields: ["title", "subtitle", "keywords"],
			storeFields: ["id"],
			searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 4, keywords: 2 } },
		});
		miniSearch.addAll(entries);
		return miniSearch;
	}, [entries, primed]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setPrimed(true);
				setOpen((value) => !value);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const results = useMemo(() => {
		const trimmed = query.trim();
		// Sans requête, on montre une sélection d'entrées plutôt qu'un panneau vide.
		if (!trimmed || !index) return entries.slice(0, 8);

		const byId = new Map(entries.map((entry) => [entry.id, entry]));
		return index
			.search(trimmed)
			.slice(0, 12)
			.map((hit) => byId.get(hit.id as string))
			.filter((entry): entry is GlobalEntry => Boolean(entry));
	}, [entries, index, query]);

	const grouped = useMemo(() => {
		const groups = new Map<GlobalKind, GlobalEntry[]>();
		for (const entry of results) {
			const bucket = groups.get(entry.kind) ?? [];
			bucket.push(entry);
			groups.set(entry.kind, bucket);
		}
		// Ordre stable des groupes, indépendant de l'ordre des résultats.
		return KIND_ORDER.filter((kind) => groups.has(kind)).map(
			(kind) => [kind, groups.get(kind)!] as const
		);
	}, [results]);

	/** Résultats à plat, dans l'ordre d'affichage : c'est ce que parcourent les flèches. */
	const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

	useEffect(() => setActive(0), [query]);

	const go = useCallback(
		(entry: GlobalEntry | undefined) => {
			if (!entry) return;
			setOpen(false);
			setQuery("");
			router.push(entry.href);
		},
		[router]
	);

	function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActive((value) => (value + 1) % Math.max(1, flat.length));
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActive((value) => (value - 1 + flat.length) % Math.max(1, flat.length));
		} else if (event.key === "Enter") {
			event.preventDefault();
			go(flat[active]);
		}
	}

	useEffect(() => {
		listRef.current
			?.querySelector<HTMLElement>(`[data-index="${active}"]`)
			?.scrollIntoView({ block: "nearest" });
	}, [active]);

	let cursor = -1;

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setPrimed(true);
					setOpen(true);
				}}
				className="hidden h-9 items-center gap-2 rounded-md border border-input bg-background pl-2.5 pr-2 text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
			>
				<Search className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="pr-8">{labels.open}</span>
				<kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[0.6875rem] text-muted-foreground">
					{isMac ? "⌘" : "Ctrl"} K
				</kbd>
			</button>

			<button
				type="button"
				onClick={() => {
					setPrimed(true);
					setOpen(true);
				}}
				aria-label={labels.open}
				className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted lg:hidden"
			>
				<Search className="h-4 w-4" aria-hidden="true" />
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
					<DialogTitle className="sr-only">{labels.open}</DialogTitle>

					<div className="flex items-center gap-2.5 border-b border-border px-4">
						<Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
						<input
							autoFocus
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={onInputKeyDown}
							placeholder={labels.placeholder}
							aria-label={labels.placeholder}
							className="h-12 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground"
						/>
					</div>

					{flat.length === 0 ? (
						<div className="px-4 py-10 text-center">
							<p className="text-sm font-medium">{labels.empty}</p>
							<p className="mt-1 text-sm text-muted-foreground">{labels.emptyHint}</p>
						</div>
					) : (
						<ul ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
							{grouped.map(([kind, items]) => {
								const Icon = KIND_ICONS[kind];
								return (
									<li key={kind}>
										<p className="px-2 pb-1 pt-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
											{labels.groups[kind]}
										</p>
										<ul>
											{items.map((entry) => {
												cursor += 1;
												const index = cursor;
												return (
													<li key={entry.id}>
														<button
															type="button"
															data-index={index}
															onMouseEnter={() => setActive(index)}
															onClick={() => go(entry)}
															className={cn(
																"flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
																index === active ? "bg-muted" : "hover:bg-muted/60"
															)}
														>
															<Icon
																className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
																aria-hidden="true"
															/>
															<span className="min-w-0 flex-1">
																<span className="block truncate text-sm font-medium">
																	{entry.title}
																</span>
																<span className="block truncate text-xs text-muted-foreground">
																	{entry.subtitle}
																</span>
															</span>
															{index === active && (
																<CornerDownLeft
																	className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
																	aria-hidden="true"
																/>
															)}
														</button>
													</li>
												);
											})}
										</ul>
									</li>
								);
							})}
						</ul>
					)}

					<div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[0.6875rem] text-muted-foreground">
						<span className="flex items-center gap-1">
							<Key>↑</Key>
							<Key>↓</Key>
							{labels.hintNavigate}
						</span>
						<span className="flex items-center gap-1">
							<Key>↵</Key>
							{labels.hintSelect}
						</span>
						<span className="flex items-center gap-1">
							<Key>esc</Key>
							{labels.hintClose}
						</span>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function Key({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[0.625rem]">
			{children}
		</kbd>
	);
}
