"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { route, type Section } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export interface NavItem {
	section: Section;
	label: string;
}

export function useNavItems(lang: Lang, items: NavItem[]) {
	const pathname = usePathname();

	return items.map((item) => {
		const href = route(lang, item.section);
		return { ...item, href, active: pathname === href || pathname.startsWith(`${href}/`) };
	});
}

export function MainNav({ lang, items }: { lang: Lang; items: NavItem[] }) {
	const resolved = useNavItems(lang, items);

	return (
		<nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
			{resolved.map((item) => (
				<Link
					key={item.section}
					href={item.href}
					aria-current={item.active ? "page" : undefined}
					className={cn(
						"relative rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground",
						item.active ? "font-medium text-foreground" : "text-muted-foreground"
					)}
				>
					{item.label}
					{item.active && (
						<span className="absolute inset-x-3 -bottom-[13px] hidden h-px bg-primary md:block" />
					)}
				</Link>
			))}
		</nav>
	);
}
