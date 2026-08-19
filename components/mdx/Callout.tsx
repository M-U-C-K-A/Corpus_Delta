import { AlertTriangle, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
	info: { icon: Info, className: "border-l-primary bg-accent/40" },
	caution: { icon: AlertTriangle, className: "border-l-chart-2 bg-chart-2/5" },
	/** Pour signaler une incertitude scientifique, pas une opinion. */
	uncertainty: { icon: TriangleAlert, className: "border-l-chart-3 bg-chart-3/5" },
	key: { icon: Lightbulb, className: "border-l-openAccess bg-openAccess-surface/50" },
} as const;

export function Callout({
	variant = "info",
	title,
	children,
}: {
	variant?: keyof typeof VARIANTS;
	title?: string;
	children: React.ReactNode;
}) {
	const { icon: Icon, className } = VARIANTS[variant];

	return (
		<aside className={cn("not-prose my-6 rounded-r-md border-l-2 px-4 py-3.5", className)}>
			<div className="flex gap-3">
				<Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden="true" />
				<div className="min-w-0 flex-1">
					{title && <p className="mb-1 font-medium leading-snug">{title}</p>}
					<div className="space-y-2 text-[0.9375rem] leading-relaxed text-foreground/85">{children}</div>
				</div>
			</div>
		</aside>
	);
}
