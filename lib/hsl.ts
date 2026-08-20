/**
 * Conversion HSL → hexadécimal.
 *
 * Satori, le moteur de rendu des images générées, n'accepte pas `hsl()` partout
 * — notamment à l'intérieur d'un dégradé, où il échoue. Toute la teinte des
 * thèmes étant définie en HSL dans la taxonomie, la conversion se fait ici.
 */
export function hslToHex(h: number, s: number, l: number): string {
	const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
	const channel = (n: number) => {
		const k = (n + h / 30) % 12;
		const value = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(255 * value)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${channel(0)}${channel(8)}${channel(4)}`;
}
