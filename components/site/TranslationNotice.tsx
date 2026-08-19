import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Lang } from "@/lib/i18n/config";

/**
 * Le contenu rédactionnel est produit en français d'abord. Quand une page anglaise
 * retombe sur le français, on le dit franchement plutôt que de servir une page
 * vide ou de faire croire à une traduction.
 */
export function TranslationNotice({ lang, className }: { lang: Lang; className?: string }) {
	const dict = getDictionary(lang);

	return (
		<div
			className={cn(
				"flex items-start gap-2.5 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm",
				className
			)}
		>
			<Languages className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<p className="text-muted-foreground">
				<span className="text-foreground">{dict.fallback.notTranslated}</span>{" "}
				{dict.fallback.showingFrench}
			</p>
		</div>
	);
}
