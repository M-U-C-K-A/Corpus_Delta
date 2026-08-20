import { cn } from "@/lib/utils";

/**
 * Marque du site : un delta, le symbole de l'écart.
 *
 * C'est la grandeur que manipule toute la science du climat — l'anomalie de
 * température, la variation de concentration, l'écart à une référence. Le triangle
 * est strié pour évoquer la stratification des archives climatiques.
 */
export function Mark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("h-6 w-6", className)}>
			<path
				d="M12 3.2 21 20.2H3L12 3.2Z"
				className="stroke-current"
				strokeWidth="1.7"
				strokeLinejoin="round"
			/>
			<path d="M7.7 13h8.6M6 16.4h12" className="stroke-current" strokeWidth="1.2" opacity="0.5" />
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
