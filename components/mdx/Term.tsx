import Link from "next/link";
import { getGlossaryEntry } from "@/lib/content/glossary";
import { route } from "@/lib/routes";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

/**
 * Renvoi vers une définition du glossaire : `<Term id="canicule">canicules</Term>`.
 * Le texte affiché reste libre, pour s'accorder à la phrase.
 */
export function Term({
	id,
	lang,
	children,
}: {
	id: string;
	lang: Lang;
	children?: React.ReactNode;
}) {
	const entry = getGlossaryEntry(lang, id) ?? getGlossaryEntry(DEFAULT_LANG, id);
	if (!entry) throw new Error(`<Term id="${id}"> ne correspond à aucune entrée du glossaire.`);

	return (
		<Link
			href={route(lang, "glossary", id)}
			title={entry.frontmatter.shortDefinition}
			className="border-b border-dotted border-primary/50 text-inherit no-underline hover:border-solid hover:text-primary"
		>
			{children ?? entry.frontmatter.term}
		</Link>
	);
}
