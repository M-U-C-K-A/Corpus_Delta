import { getAllStudies, displayTitle } from "@/lib/content/studies";
import type { Study } from "@/lib/content/schemas";

/**
 * Représentation compacte d'une étude, envoyée au navigateur pour la recherche.
 *
 * L'index est construit côté client à partir de ce tableau. À l'échelle actuelle
 * (quelques dizaines d'entrées) c'est immédiat ; au-delà d'un millier d'études il
 * faudra basculer sur un index MiniSearch pré-sérialisé, chargé à la demande.
 * Le résumé est tronqué pour cette raison : c'est la partie qui pèse.
 */
export interface StudyDocument {
	id: string;
	title: string;
	fullTitle: string;
	authors: string;
	venue: string | null;
	year: number;
	type: string;
	themes: string[];
	topics: string;
	openAccess: boolean;
	citedByCount: number;
	excerpt: string | null;
}

const EXCERPT_LENGTH = 260;

function excerpt(study: Study): string | null {
	if (!study.abstract) return null;
	if (study.abstract.length <= EXCERPT_LENGTH) return study.abstract;
	return `${study.abstract.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}

export function toSearchDocument(study: Study): StudyDocument {
	return {
		id: study.id,
		title: displayTitle(study),
		fullTitle: study.title,
		authors: study.authors.map((author) => author.name).join(", "),
		venue: study.venue,
		year: study.year,
		type: study.type,
		themes: [...study.themes],
		// Les concepts d'origine ne sont pas affichés mais élargissent utilement la recherche.
		topics: study.sourceTopics.join(" "),
		openAccess: study.openAccess.isOpen,
		citedByCount: study.citedByCount ?? 0,
		excerpt: excerpt(study),
	};
}

export function getSearchDocuments(): StudyDocument[] {
	return getAllStudies().map(toSearchDocument);
}
