import { cn } from "@/lib/utils";

/**
 * Marque du site : une carotte de forage stylisée — un cylindre strié dont les
 * couches se resserrent vers le haut. C'est l'objet dont on tire les archives
 * climatiques, et le geste du site est le même : empiler des couches de sources.
 */
export function Mark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className={cn("h-6 w-6", className)}
		>
			<rect x="6.5" y="2.5" width="11" height="19" rx="2.5" className="stroke-current" strokeWidth="1.6" />
			<path d="M6.5 8h11M6.5 12h11M6.5 15.5h11M6.5 18.5h11" className="stroke-current" strokeWidth="1.2" opacity="0.55" />
		</svg>
	);
}

export function Wordmark({
	name,
	tagline,
	className,
}: {
	name: string;
	tagline?: string;
	className?: string;
}) {
	return (
		<span className={cn("flex items-center gap-2.5", className)}>
			<Mark className="h-6 w-6 shrink-0 text-primary" />
			<span className="flex flex-col leading-none">
				<span className="font-serif text-[1.0625rem] font-semibold tracking-tight">{name}</span>
				{tagline && (
					<span className="mt-1 hidden text-[0.6875rem] uppercase tracking-[0.09em] text-muted-foreground lg:block">
						{tagline}
					</span>
				)}
			</span>
		</span>
	);
}
