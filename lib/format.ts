import { LOCALES, type Lang } from "@/lib/i18n/config";

/**
 * Formatage systématiquement côté serveur, à partir de dates ISO.
 * La version précédente convertissait des horodatages Unix dans le navigateur,
 * ce qui produisait un rendu différent du serveur selon le fuseau du visiteur.
 */
export function formatDate(iso: string, lang: Lang): string {
	const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
	if (Number.isNaN(date.getTime())) return iso;

	return new Intl.DateTimeFormat(LOCALES[lang], {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

export function formatNumber(value: number, lang: Lang): string {
	return new Intl.NumberFormat(LOCALES[lang]).format(value);
}

export function formatCompact(value: number, lang: Lang): string {
	return new Intl.NumberFormat(LOCALES[lang], { notation: "compact" }).format(value);
}

/** Accord du pluriel pour les libellés de comptage. */
export function plural(count: number, singular: string, pluralForm: string): string {
	return count > 1 ? pluralForm : singular;
}
