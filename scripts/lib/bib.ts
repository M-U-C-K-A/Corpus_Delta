/**
 * Lecture des métadonnées bibliographiques chez leur producteur.
 *
 * Partagé par l'ingestion (`add-study.ts`) et le rafraîchissement
 * (`refresh-studies.ts`) : les deux doivent lire les mêmes champs de la même
 * façon, sinon une fiche rafraîchie cesserait d'être comparable à une fiche
 * fraîchement ingérée.
 *
 * Ce module ne décide rien. Il rapporte ce que la source dit — rétractation
 * comprise — et laisse l'appelant choisir quoi en faire : l'ingestion refuse,
 * le rafraîchissement signale.
 */
import { cleanOaUrl } from "./oa-url";
import { siteConfig } from "../../lib/site-config";
import type { Study } from "../../lib/content/schemas";

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** OpenAlex livre les résumés sous forme d'index inversé mot → positions. */
export function reconstructAbstract(
	index: Record<string, number[]> | null | undefined
): string | null {
	if (!index) return null;
	const words: string[] = [];
	for (const [word, positions] of Object.entries(index)) {
		for (const position of positions) words[position] = word;
	}
	const text = words.join(" ").replace(/\s+/g, " ").trim();
	return text.length > 0 ? text : null;
}

/** Crossref renvoie des résumés en JATS : on retire le balisage sans réécrire le texte. */
export function stripJats(abstract: string | null | undefined): string | null {
	if (!abstract) return null;
	const text = abstract
		.replace(/<[^>]+>/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > 0 ? text : null;
}

const TYPE_MAP: Record<string, Study["type"]> = {
	article: "article",
	"journal-article": "article",
	review: "review",
	report: "report",
	preprint: "preprint",
	dataset: "dataset",
	"book-chapter": "chapter",
	"posted-content": "preprint",
	monograph: "chapter",
};

export function mapType(raw: string | null | undefined): Study["type"] {
	if (!raw) return "article";
	return TYPE_MAP[raw] ?? "article";
}

/** Métadonnées normalisées, quelle que soit la base d'origine. */
export interface BibRecord {
	title: string | null;
	authors: { name: string; orcid?: string; affiliation?: string }[];
	authorCount: number;
	venue: string | null;
	publisher: string | null;
	year: number | null;
	type: Study["type"];
	abstract: string | null;
	language: string | null;
	openAccess: { isOpen: boolean; status: string | null; url: string | null };
	citedByCount: number | null;
	sourceTopics: string[];
	/**
	 * Identifiant du travail chez OpenAlex, et identifiants des travaux qu'il cite.
	 * Conservés bruts : c'est l'intersection de ces listes qui donne le graphe
	 * interne de l'annuaire, sans qu'aucun lien n'ait à être saisi.
	 */
	openAlexId: string | null;
	referencedWorks: string[];
	/** Ce que la source déclare. L'appelant décide des conséquences. */
	isRetracted: boolean;
	provider: "openalex" | "crossref";
}

export async function fetchJson(url: string): Promise<any | null> {
	const response = await fetch(url, {
		headers: {
			"User-Agent": `${siteConfig.name} (${siteConfig.url}; mailto:${siteConfig.contactEmail})`,
			Accept: "application/json",
		},
	});
	if (!response.ok) return null;
	return response.json();
}

/** Ne garde que le suffixe `W…` : l'URL complète alourdirait 150 fiches pour rien. */
function shortWorkId(raw: unknown): string | null {
	if (typeof raw !== "string") return null;
	const match = raw.match(/W\d+$/);
	return match ? match[0] : null;
}

export async function fromOpenAlex(doi: string): Promise<BibRecord | null> {
	const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?mailto=${encodeURIComponent(siteConfig.contactEmail)}`;
	const work = await fetchJson(url);
	if (!work || work.error) return null;

	const source = work.primary_location?.source ?? null;
	const authorships: any[] = work.authorships ?? [];

	return {
		title: work.title as string | null,
		// Au-delà de 20 auteurs, la liste complète n'apporte plus rien à l'affichage :
		// on conserve le décompte réel séparément pour ne pas laisser croire à une troncature.
		authors: authorships.slice(0, 20).map((a) => ({
			name: a.author?.display_name as string,
			...(a.author?.orcid ? { orcid: a.author.orcid as string } : {}),
			...(a.institutions?.[0]?.display_name
				? { affiliation: a.institutions[0].display_name as string }
				: {}),
		})),
		authorCount: authorships.length,
		venue: (source?.display_name as string) ?? null,
		publisher: (source?.host_organization_name as string) ?? null,
		year: work.publication_year as number | null,
		type: mapType(work.type),
		abstract: reconstructAbstract(work.abstract_inverted_index),
		language: (work.language as string) ?? null,
		openAccess: {
			isOpen: Boolean(work.open_access?.is_oa),
			status: (work.open_access?.oa_status as string) ?? null,
			url: cleanOaUrl(work.open_access?.oa_url),
		},
		citedByCount: (work.cited_by_count as number) ?? null,
		sourceTopics: ((work.topics ?? []) as any[]).map((t) => t.display_name as string),
		openAlexId: shortWorkId(work.id),
		referencedWorks: ((work.referenced_works ?? []) as unknown[])
			.map(shortWorkId)
			.filter((id): id is string => id !== null),
		isRetracted: Boolean(work.is_retracted),
		provider: "openalex" as const,
	};
}

export async function fromCrossref(doi: string): Promise<BibRecord | null> {
	const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(siteConfig.contactEmail)}`;
	const payload = await fetchJson(url);
	const work = payload?.message;
	if (!work) return null;

	const authors: any[] = work.author ?? [];

	return {
		title: (work.title?.[0] as string) ?? null,
		authors: authors.slice(0, 20).map((a) => ({
			name: [a.given, a.family].filter(Boolean).join(" ") || (a.name as string) || "—",
			...(a.ORCID ? { orcid: a.ORCID as string } : {}),
		})),
		authorCount: authors.length,
		venue: (work["container-title"]?.[0] as string) ?? null,
		publisher: (work.publisher as string) ?? null,
		year: (work.issued?.["date-parts"]?.[0]?.[0] as number) ?? null,
		type: mapType(work.type),
		abstract: stripJats(work.abstract),
		language: (work.language as string) ?? null,
		openAccess: { isOpen: false, status: null, url: null },
		citedByCount: (work["is-referenced-by-count"] as number) ?? null,
		sourceTopics: ((work.subject ?? []) as string[]) ?? [],
		// Crossref n'expose ni identifiant OpenAlex ni liste de références exploitable
		// ici, et ne porte pas le signalement de rétractation : d'où le repli prudent.
		openAlexId: null,
		referencedWorks: [],
		isRetracted: false,
		provider: "crossref" as const,
	};
}
