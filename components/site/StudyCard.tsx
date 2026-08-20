import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { citationLine } from "@/lib/content/citation";
import { displayTitle } from "@/lib/content/studies";
import type { Study } from "@/lib/content/schemas";
import { ThemeTagList } from "@/components/site/ThemeTag";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { route } from "@/lib/routes";
import type { Lang } from "@/lib/i18n/config";

export function OpenAccessTag({ isOpen, lang }: { isOpen: boolean; lang: Lang }) {
	const dict = getDictionary(lang);
	const Icon = isOpen ? Unlock : Lock;

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium",
				isOpen
					? "bg-openAccess-surface text-openAccess"
					: "bg-muted text-muted-foreground"
			)}
		>
			<Icon className="h-3 w-3" aria-hidden="true" />
			{isOpen ? dict.common.openAccess : dict.common.closedAccess}
		</span>
	);
}

export function StudyCard({
	study,
	lang,
	showAbstract = false,
}: {
	study: Study;
	lang: Lang;
	showAbstract?: boolean;
}) {
	return (
		<article className="group py-5">
			<div className="flex items-start justify-between gap-4">
				<h3 className="font-serif text-lg font-semibold leading-snug tracking-tight">
					<Link
						href={route(lang, "studies", study.id)}
						className="rounded-sm outline-none transition-colors group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
					>
						{displayTitle(study)}
					</Link>
				</h3>
				<OpenAccessTag isOpen={study.openAccess.isOpen} lang={lang} />
			</div>

			<p className="mt-1.5 text-sm text-muted-foreground tabular">{citationLine(study)}</p>

			{showAbstract && study.abstract && (
				<p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-foreground/75">
					{study.abstract}
				</p>
			)}

			<ThemeTagList themes={study.themes} lang={lang} className="mt-3" />
		</article>
	);
}

/** Liste séparée par des filets : plus dense qu'une grille de cartes, et plus lisible. */
export function StudyList({ studies, lang, showAbstract }: { studies: Study[]; lang: Lang; showAbstract?: boolean }) {
	return (
		<div className="divide-y divide-border/70">
			{studies.map((study) => (
				<StudyCard key={study.id} study={study} lang={lang} showAbstract={showAbstract} />
			))}
		</div>
	);
}
