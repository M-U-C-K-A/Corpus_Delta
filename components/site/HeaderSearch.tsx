"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

/**
 * Raccourci vers l'annuaire : le champ n'effectue pas la recherche lui-même,
 * il la délègue à la page dédiée qui porte les filtres et l'index complet.
 */
export function HeaderSearch({ lang, label, placeholder }: { lang: Lang; label: string; placeholder: string }) {
	const router = useRouter();
	const [value, setValue] = useState("");

	return (
		<form
			role="search"
			onSubmit={(event) => {
				event.preventDefault();
				const query = value.trim();
				router.push(query ? `${route(lang, "studies")}?q=${encodeURIComponent(query)}` : route(lang, "studies"));
			}}
			className="relative hidden lg:block"
		>
			<label htmlFor="header-search" className="sr-only">
				{label}
			</label>
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				id="header-search"
				type="search"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder={placeholder}
				className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none transition-[width,box-shadow] placeholder:text-muted-foreground focus:w-72 focus:ring-2 focus:ring-ring/40"
			/>
		</form>
	);
}
