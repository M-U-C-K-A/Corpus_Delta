"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LANGS, LANG_LABELS, type Lang } from "@/lib/i18n/config";
import { translatePathname } from "@/lib/routes";

export function LangSwitcher({ lang, label }: { lang: Lang; label: string }) {
	const pathname = usePathname() || `/${lang}`;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1.5 px-2" aria-label={label}>
					<Languages className="h-4 w-4" aria-hidden="true" />
					<span className="text-xs font-medium uppercase">{lang}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[9rem]">
				{LANGS.map((target) => (
					<DropdownMenuItem key={target} asChild disabled={target === lang}>
						<Link href={translatePathname(pathname, lang, target)} hrefLang={target}>
							<span className={target === lang ? "font-medium" : undefined}>
								{LANG_LABELS[target]}
							</span>
						</Link>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
