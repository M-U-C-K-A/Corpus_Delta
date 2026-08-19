"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export function HomeSearch({
	lang,
	label,
	placeholder,
	cta,
}: {
	lang: Lang;
	label: string;
	placeholder: string;
	cta: string;
}) {
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
			className="flex flex-col gap-2 sm:flex-row"
		>
			<div className="relative flex-1">
				<label htmlFor="home-search" className="sr-only">
					{label}
				</label>
				<Search
					aria-hidden="true"
					className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					id="home-search"
					type="search"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					placeholder={placeholder}
					className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
				/>
			</div>
			<Button type="submit" size="lg" className="h-12 shrink-0">
				{cta}
			</Button>
		</form>
	);
}
