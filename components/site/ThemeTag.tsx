import Link from "next/link";
import { cn } from "@/lib/utils";
import { themeHue, themeLabel, type ThemeId } from "@/lib/content/taxonomy";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

/**
 * Pastille de thème colorée.
 *
 * La teinte vient de la taxonomie et n'est injectée que comme variable CSS :
 * saturation et luminosité sont fixées ici, séparément pour le clair et le sombre,
 * ce qui garantit un contraste comparable sur les treize thèmes.
 */
export function ThemeTag({
	theme,
	lang,
	href,
	className,
	size = "sm",
}: {
	theme: ThemeId;
	lang: Lang;
	href?: string;
	className?: string;
	size?: "sm" | "md";
}) {
	const style = { "--h": themeHue(theme) } as React.CSSProperties;

	const classes = cn(
		"inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
		"border-[hsl(var(--h)_45%_82%)] bg-[hsl(var(--h)_60%_96%)] text-[hsl(var(--h)_55%_28%)]",
		"dark:border-[hsl(var(--h)_35%_28%)] dark:bg-[hsl(var(--h)_40%_14%)] dark:text-[hsl(var(--h)_55%_74%)]",
		size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs",
		href && "hover:border-[hsl(var(--h)_50%_65%)]",
		className
	);

	const content = (
		<>
			<span
				aria-hidden="true"
				className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--h)_60%_45%)] dark:bg-[hsl(var(--h)_55%_60%)]"
			/>
			{themeLabel(theme, lang)}
		</>
	);

	if (href) {
		return (
			<Link href={href} style={style} className={classes}>
				{content}
			</Link>
		);
	}

	return (
		<span style={style} className={classes}>
			{content}
		</span>
	);
}

export function ThemeTagList({
	themes,
	lang,
	linked = false,
	className,
}: {
	themes: readonly string[];
	lang: Lang;
	/** Rend chaque pastille cliquable vers la page du thème. */
	linked?: boolean;
	className?: string;
}) {
	return (
		<ul className={cn("flex flex-wrap gap-1.5", className)}>
			{themes.map((theme) => (
				<li key={theme}>
					<ThemeTag
						theme={theme as ThemeId}
						lang={lang}
						// La page du thème, pas l'annuaire filtré : elle mène aux études,
						// mais aussi aux définitions, dossiers et parcours du sujet.
						href={linked ? route(lang, "themes", theme) : undefined}
					/>
				</li>
			))}
		</ul>
	);
}
