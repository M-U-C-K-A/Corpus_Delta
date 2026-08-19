"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({
	labels,
}: {
	labels: { toggle: string; light: string; dark: string; system: string };
}) {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="px-2" aria-label={labels.toggle}>
					{/* Les deux icônes sont rendues et permutées en CSS : cela évite d'attendre
					    la résolution du thème côté client, donc tout écart d'hydratation. */}
					<Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[9rem]">
				<DropdownMenuItem onClick={() => setTheme("light")}>{labels.light}</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>{labels.dark}</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>{labels.system}</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
