import { cn } from "@/lib/utils";
import { themeHue, type ThemeId } from "@/lib/content/taxonomy";

/**
 * Dégradé tramé, décliné sur la teinte d'un thème.
 *
 * Le rendu imite un tramage ordonné : une trame de points de densité constante,
 * révélée par un masque à paliers francs plutôt qu'à fondu continu. Ce sont les
 * paliers qui produisent l'effet « dither » — un fondu progressif donnerait un
 * simple dégradé flou.
 *
 * Écrit à la main plutôt qu'importé : il s'agit de quelques règles CSS, et une
 * dépendance supplémentaire pour cela se paierait en surface de maintenance.
 */

const STEPS = [
	{ size: 3, opacity: 1, from: 0, to: 22 },
	{ size: 4, opacity: 0.85, from: 22, to: 42 },
	{ size: 5, opacity: 0.65, from: 42, to: 60 },
	{ size: 7, opacity: 0.45, from: 60, to: 76 },
	{ size: 10, opacity: 0.3, from: 76, to: 90 },
];

export function DitherBand({
	theme,
	className,
	direction = "to bottom",
}: {
	theme: ThemeId;
	className?: string;
	/** Sens d'atténuation de la trame. */
	direction?: "to bottom" | "to top" | "to right";
}) {
	const hue = themeHue(theme);

	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
			style={{ "--h": hue } as React.CSSProperties}
		>
			{/* Fond continu : donne la couleur, la trame donne la texture. */}
			<div
				className="absolute inset-0 opacity-[0.16] dark:opacity-[0.22]"
				style={{
					backgroundImage: `linear-gradient(${direction}, hsl(${hue} 70% 45%), transparent 85%)`,
				}}
			/>
			{STEPS.map((step) => (
				<div
					key={step.from}
					className="absolute inset-0"
					style={{
						backgroundImage: `radial-gradient(circle at 50% 50%, hsl(${hue} 65% 42%) 0.9px, transparent 1px)`,
						backgroundSize: `${step.size}px ${step.size}px`,
						opacity: step.opacity * 0.5,
						// Palier franc : la trame est pleine puis disparaît net, sans interpolation.
						maskImage: `linear-gradient(${direction}, #000 ${step.from}%, #000 ${step.to}%, transparent ${step.to}%)`,
						WebkitMaskImage: `linear-gradient(${direction}, #000 ${step.from}%, #000 ${step.to}%, transparent ${step.to}%)`,
					}}
				/>
			))}
		</div>
	);
}

/**
 * Variante neutre pour l'accueil et les pages sans thème, sur la couleur d'accent
 * du site plutôt que sur celle d'un thème.
 */
export function DitherSurface({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
		>
			<div className="absolute inset-0 bg-gradient-to-b from-accent/60 to-transparent" />
			{STEPS.map((step) => (
				<div
					key={step.from}
					className="absolute inset-0 text-primary"
					style={{
						backgroundImage:
							"radial-gradient(circle at 50% 50%, currentColor 0.9px, transparent 1px)",
						backgroundSize: `${step.size}px ${step.size}px`,
						opacity: step.opacity * 0.22,
						maskImage: `linear-gradient(to bottom, #000 ${step.from}%, #000 ${step.to}%, transparent ${step.to}%)`,
						WebkitMaskImage: `linear-gradient(to bottom, #000 ${step.from}%, #000 ${step.to}%, transparent ${step.to}%)`,
					}}
				/>
			))}
		</div>
	);
}
