/** Marques diacritiques combinantes, retirées après normalisation NFD. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Mots vides ignorés dans les identifiants d'étude, pour garder des URLs lisibles. */
const STOP_WORDS = new Set([
	"a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with",
	"le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "sur", "dans", "pour", "au", "aux",
]);

export function slugify(input: string): string {
	return input
		.normalize("NFD")
		.replace(COMBINING_MARKS, "")
		.replace(/['’]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Identifiant d'une étude : `auteur-année-mots-du-titre`.
 *
 * Un identifiant dérivé du DOI serait plus court mais illisible dans une URL et
 * dans les renvois `<Cite>` des dossiers. La forme retenue reste déterministe,
 * donc réexécuter l'ingestion sur le même DOI produit le même fichier.
 */
export function studyIdFrom(author: string | undefined, year: number, title: string): string {
	const lastName = author ? slugify(author.split(/\s+/).slice(-1)[0] ?? author) : "anonyme";

	const titleWords = slugify(title)
		.split("-")
		.filter((word) => word.length > 2 && !STOP_WORDS.has(word))
		.slice(0, 5)
		.join("-");

	return [lastName || "anonyme", year, titleWords]
		.filter(Boolean)
		.join("-")
		.slice(0, 80)
		.replace(/-+$/, "");
}
