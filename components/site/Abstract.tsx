"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Languages } from "lucide-react";

/**
 * Résumé de l'éditeur, présenté sans être réécrit.
 *
 * Deux aménagements purement typographiques : les intertitres structurés que
 * beaucoup d'éditeurs insèrent en capitales (BACKGROUND, METHODS, FINDINGS) sont
 * détachés du texte courant, et le résumé se replie au-delà d'une certaine
 * longueur. Le contenu, lui, n'est jamais modifié.
 */

const SECTION_LABEL = /(^|\s)([A-Z][A-Z]{3,}(?:\s+[A-Z]{2,})*)\s*[::]\s*/g;
const LONG_ABSTRACT = 900;

interface Segment {
	label?: string;
	text: string;
}

function segment(abstract: string): Segment[] {
	const matches = [...abstract.matchAll(SECTION_LABEL)];
	if (matches.length < 2) return [{ text: abstract }];

	const segments: Segment[] = [];
	const lead = abstract.slice(0, matches[0].index).trim();
	if (lead) segments.push({ text: lead });

	matches.forEach((match, index) => {
		const start = (match.index ?? 0) + match[0].length;
		const end = index + 1 < matches.length ? matches[index + 1].index : abstract.length;
		const text = abstract.slice(start, end).trim();
		if (text) segments.push({ label: match[2], text });
	});

	return segments;
}

export function Abstract({
	text,
	language,
	pageLang,
	labels,
}: {
	text: string;
	language: string | null;
	pageLang: string;
	labels: { readMore: string; readLess: string; foreignLanguage: string };
}) {
	const [expanded, setExpanded] = useState(text.length <= LONG_ABSTRACT);
	const segments = segment(text);
	const isForeign = Boolean(language) && language !== pageLang;

	return (
		<div>
			{isForeign && (
				<p className="mb-2.5 inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
					<Languages className="h-3 w-3" aria-hidden="true" />
					{labels.foreignLanguage.replace("{language}", (language ?? "").toUpperCase())}
				</p>
			)}

			<div className={expanded ? undefined : "relative max-h-52 overflow-hidden"}>
				<div className="space-y-3">
					{segments.map((part, index) => (
						<p key={index} className="text-[0.9375rem] leading-relaxed text-foreground/85">
							{part.label && (
								<span className="mr-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
									{part.label.toLowerCase()}
								</span>
							)}
							{part.text}
						</p>
					))}
				</div>
				{!expanded && (
					<div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
				)}
			</div>

			{text.length > LONG_ABSTRACT && (
				<button
					type="button"
					onClick={() => setExpanded((value) => !value)}
					className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
				>
					{expanded ? labels.readLess : labels.readMore}
					{expanded ? (
						<ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
					) : (
						<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
					)}
				</button>
			)}
		</div>
	);
}
