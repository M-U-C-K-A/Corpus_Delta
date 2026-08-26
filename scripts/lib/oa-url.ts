/**
 * Vérifie l'URL d'accès ouvert renvoyée par la source.
 *
 * OpenAlex sert parfois une URL malformée — celle du budget méthane 2025 se
 * terminait par « >, », vestige d'un parsage de bibliographie, et renvoyait 404.
 * Reproduire fidèlement une métadonnée n'oblige pas à publier un lien cassé :
 * on écarte l'URL, le DOI restant de toute façon le chemin d'accès principal.
 */
export function cleanOaUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	// Les chevrons et espaces ne peuvent pas appartenir à une URL : leur présence
	// signale un fragment de texte capté par erreur, pas un lien tronqué.
	if (/[<>\s]/.test(trimmed)) return null;

	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
	} catch {
		return null;
	}
}
