import { cn } from "@/lib/utils";

/**
 * Bandes du delta, du sommet à la base.
 *
 * Le tracé est découpé en trapèzes séparés par un jour constant, plutôt que
 * strié par des traits de la couleur du fond : la marque reste ainsi lisible sur
 * n'importe quel support, y compris une vignette de partage ou un favicon.
 */
export const MARK_BANDS = [
	"M12 2.60L14.40 7.40H9.60Z",
	"M9.29 8.02H14.71L16.50 11.60H7.50Z",
	"M7.19 12.22H16.81L18.35 15.30H5.65Z",
	"M5.34 15.92H18.66L19.95 18.50H4.05Z",
	"M3.74 19.12H20.26L21.40 21.40H2.60Z",
] as const;

/**
 * Marque du site : un delta plein — le symbole de l'écart, grandeur que manipule
 * toute la science du climat — entaillé de coutures horizontales qui se lisent
 * comme des strates climatiques empilées, et comme les pages d'un corpus.
 */
export function Mark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("h-6 w-6", className)}>
			{MARK_BANDS.map((d) => (
				<path key={d} d={d} className="fill-current" />
			))}
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
			<Mark className="h-[1.35rem] w-[1.35rem] shrink-0 text-primary" />
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
