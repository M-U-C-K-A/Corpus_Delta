import Link from "next/link";
import { getStudy } from "@/lib/content/studies";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

/**
 * Renvoi en ligne vers une étude de l'annuaire : `<Cite id="hugonnet-2021-…" />`.
 *
 * L'identifiant est vérifié au build par `scripts/validate-content.ts`, donc un
 * renvoi cassé arrête le déploiement au lieu de produire un lien mort.
 */
export function Cite({ id, lang }: { id: string; lang: Lang }) {
	const study = getStudy(id);
	if (!study) throw new Error(`<Cite id="${id}"> ne correspond à aucune étude de l'annuaire.`);

	const author = study.authors[0]?.name.split(/\s+/).at(-1) ?? study.publisher ?? "?";
	const label = study.authorCount > 1 ? `${author} et al., ${study.year}` : `${author}, ${study.year}`;

	return (
		<Link
			href={route(lang, "studies", study.id)}
			title={study.title}
			className="whitespace-nowrap rounded-sm bg-muted px-1 py-0.5 text-[0.85em] text-primary no-underline hover:bg-accent"
		>
			{label}
		</Link>
	);
}
