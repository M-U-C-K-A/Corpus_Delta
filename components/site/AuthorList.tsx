"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AuthorEntry {
	name: string;
	orcid?: string;
	affiliation?: string;
}

const VISIBLE = 5;

/**
 * Liste d'auteurs repliée par défaut.
 *
 * Certaines publications du corpus comptent plus de cent signataires : les
 * déployer intégralement noyait le titre et le résumé sous un mur de noms.
 * Le décompte réel reste affiché, et la liste complète à un clic.
 */
export function AuthorList({
	authors,
	total,
	labels,
}: {
	authors: AuthorEntry[];
	total: number;
	labels: { showAll: string; showLess: string; andOthers: string; truncated: string };
}) {
	const [expanded, setExpanded] = useState(false);

	if (authors.length === 0) return null;

	const hidden = Math.max(0, total - VISIBLE);
	const shown = expanded ? authors : authors.slice(0, VISIBLE);
	// L'ingestion ne conserve que les vingt premiers auteurs : au-delà, la liste
	// déployée reste incomplète et doit le dire.
	const listIsPartial = total > authors.length;

	return (
		<div className="text-sm leading-relaxed">
			<p className="text-foreground/80">
				{shown.map((author, index) => (
					<span key={`${author.name}-${index}`}>
						{author.orcid ? (
							<a
								href={author.orcid}
								target="_blank"
								rel="noreferrer"
								title={author.affiliation}
								className="decoration-dotted underline-offset-2 hover:underline"
							>
								{author.name}
							</a>
						) : (
							<span title={author.affiliation}>{author.name}</span>
						)}
						{index < shown.length - 1 && <span className="text-muted-foreground">, </span>}
					</span>
				))}

				{!expanded && hidden > 0 && (
					<>
						<span className="text-muted-foreground"> </span>
						<button
							type="button"
							onClick={() => setExpanded(true)}
							className="inline-flex items-center gap-0.5 rounded-sm text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
						>
							{labels.andOthers.replace("{count}", String(hidden))}
							<ChevronDown className="h-3 w-3" aria-hidden="true" />
						</button>
					</>
				)}
			</p>

			{expanded && (
				<div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
					<button
						type="button"
						onClick={() => setExpanded(false)}
						className="underline decoration-dotted underline-offset-2 hover:text-foreground"
					>
						{labels.showLess}
					</button>
					{listIsPartial && <span>{labels.truncated.replace("{count}", String(total))}</span>}
				</div>
			)}
		</div>
	);
}
