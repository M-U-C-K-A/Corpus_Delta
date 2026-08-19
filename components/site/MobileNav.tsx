"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavItems, type NavItem } from "@/components/site/MainNav";
import type { Lang } from "@/lib/i18n/config";

export function MobileNav({
	lang,
	items,
	label,
	title,
}: {
	lang: Lang;
	items: NavItem[];
	label: string;
	title: string;
}) {
	const [open, setOpen] = useState(false);
	const resolved = useNavItems(lang, items);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="sm" className="px-2 md:hidden" aria-label={label}>
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-[17rem]">
				<SheetHeader className="text-left">
					<SheetTitle className="font-serif">{title}</SheetTitle>
				</SheetHeader>
				<nav className="mt-6 flex flex-col" aria-label="Navigation principale">
					{resolved.map((item) => (
						<Link
							key={item.section}
							href={item.href}
							onClick={() => setOpen(false)}
							aria-current={item.active ? "page" : undefined}
							className={cn(
								"border-b border-border/60 py-3 text-[0.9375rem] transition-colors last:border-0",
								item.active ? "font-medium text-foreground" : "text-muted-foreground"
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
