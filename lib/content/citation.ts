import type { Study } from "@/lib/content/schemas";
import { slugify } from "@/lib/content/slug";

/**
 * Les listes d'auteurs sont tronquées à 20 à l'ingestion. Quand c'est le cas, la
 * citation le signale par « et al. » plutôt que de laisser croire à une liste complète.
 */
function isTruncated(study: Study): boolean {
	return study.authorCount > study.authors.length;
}

function apaAuthor(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0];
	const family = parts[parts.length - 1];
	const initials = parts
		.slice(0, -1)
		.map((given) => `${given.charAt(0).toUpperCase()}.`)
		.join(" ");
	return `${family}, ${initials}`;
}

/** Style APA 7, dans la limite des champs dont dispose l'annuaire. */
export function toApa(study: Study): string {
	const authors = study.authors.map((a) => apaAuthor(a.name));

	let authorPart: string;
	if (authors.length === 0) {
		authorPart = study.publisher ?? "Auteur inconnu";
	} else if (isTruncated(study) || authors.length > 20) {
		authorPart = `${authors.slice(0, 19).join(", ")}, … et al.`;
	} else if (authors.length === 1) {
		authorPart = authors[0];
	} else {
		authorPart = `${authors.slice(0, -1).join(", ")}, & ${authors[authors.length - 1]}`;
	}

	const segments = [`${authorPart} (${study.year}).`, `${study.title}.`];
	if (study.venue) segments.push(`${study.venue}.`);
	if (study.doi) segments.push(`https://doi.org/${study.doi}`);
	else segments.push(study.url);

	return segments.join(" ");
}

export function toBibtex(study: Study): string {
	const entryType =
		study.type === "report" ? "techreport" : study.type === "chapter" ? "inbook" : "article";

	const key = slugify(
		`${study.authors[0]?.name.split(/\s+/).at(-1) ?? "anon"}${study.year}${study.title.split(/\s+/)[0] ?? ""}`
	);

	const authors = study.authors.map((a) => a.name).join(" and ");
	const fields: [string, string | null][] = [
		["title", study.title],
		["author", authors + (isTruncated(study) ? " and others" : "")],
		[entryType === "techreport" ? "institution" : "journal", study.venue ?? study.publisher],
		["year", String(study.year)],
		["doi", study.doi],
		["url", study.url],
	];

	const body = fields
		.filter(([, value]) => value)
		.map(([field, value]) => `  ${field} = {${value}}`)
		.join(",\n");

	return `@${entryType}{${key},\n${body}\n}`;
}

/** Ligne courte affichée sous un titre dans les listes. */
export function citationLine(study: Study): string {
	const first = study.authors[0]?.name;
	const authorPart = !first
		? (study.publisher ?? "")
		: study.authorCount > 1
			? `${first} et al.`
			: first;

	return [authorPart, study.venue, String(study.year)].filter(Boolean).join(" · ");
}
