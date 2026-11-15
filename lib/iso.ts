/**
 * Géométrie isométrique pour les figures des dossiers d'indicateurs.
 *
 * Tout est calculé ici, côté serveur, et sort sous forme de chaînes `d` : les
 * figures sont du SVG statique animé par CSS, sans une ligne de JavaScript
 * envoyée au navigateur. Une illustration qui demande un moteur de rendu pour
 * s'afficher n'a pas sa place dans des pages dont l'essentiel est du texte.
 *
 * La projection est la projection isométrique classique : les trois axes du
 * repère se retrouvent à 120° les uns des autres dans le plan de l'écran.
 * L'axe z pointe vers le haut de l'écran, ce qui place le plan (x, y) au sol.
 */

export type Vec3 = readonly [number, number, number];
export type Pt = readonly [number, number];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Projette un point du repère monde dans le plan de l'écran. */
export function project([x, y, z]: Vec3): Pt {
	return [(x - y) * COS30, (x + y) * SIN30 - z];
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/** Chemin SVG passant par une suite de points écran. */
export function path(points: readonly Pt[], close = true): string {
	if (points.length === 0) return "";
	const [first, ...rest] = points;
	const body = rest.map(([x, y]) => `L${fmt(x)} ${fmt(y)}`).join("");
	return `M${fmt(first[0])} ${fmt(first[1])}${body}${close ? "Z" : ""}`;
}

/** Chemin passant par une suite de points du monde. */
export function path3(points: readonly Vec3[], close = true): string {
	return path(points.map(project), close);
}

/**
 * Contour d'un rectangle à coins arrondis, dans le plan (x, y).
 *
 * Les arcs sont échantillonnés plutôt que décrits par des commandes `A` : une
 * fois projeté, un arc de cercle devient un arc d'ellipse incliné, que l'on
 * ne peut pas écrire sans recalculer ses rayons et sa rotation. Des segments
 * courts sont plus simples et visuellement indiscernables.
 */
export function roundedRect(
	width: number,
	depth: number,
	radius: number,
	steps = 7
): Pt[] {
	const hw = width / 2;
	const hd = depth / 2;
	const r = Math.min(radius, hw, hd);

	// Les quatre centres d'arc, parcourus dans un ordre qui garde le contour
	// orienté de façon constante — le silhouettage en dépend.
	const corners: { cx: number; cy: number; from: number }[] = [
		{ cx: hw - r, cy: hd - r, from: 0 },
		{ cx: -(hw - r), cy: hd - r, from: Math.PI / 2 },
		{ cx: -(hw - r), cy: -(hd - r), from: Math.PI },
		{ cx: hw - r, cy: -(hd - r), from: (3 * Math.PI) / 2 },
	];

	const points: Pt[] = [];
	for (const { cx, cy, from } of corners) {
		for (let i = 0; i <= steps; i++) {
			const angle = from + (i / steps) * (Math.PI / 2);
			points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
		}
	}
	return points;
}

/** Contour d'un disque dans le plan (x, y). */
export function disc(radius: number, steps = 48): Pt[] {
	return Array.from({ length: steps }, (_, i) => {
		const angle = (i / steps) * 2 * Math.PI;
		return [radius * Math.cos(angle), radius * Math.sin(angle)] as Pt;
	});
}

export interface Slab {
	/** Face supérieure, celle qui porte le texte. */
	top: string;
	/** Flanc visible, d'un seul tenant : le contour est convexe. */
	side: string;
	/** Centre de la face supérieure, pour y ancrer un libellé. */
	center: Pt;
	/** Boîte englobante du volume entier, pour composer le `viewBox`. */
	bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Volume extrudé vers le bas depuis un contour posé à l'altitude `z`.
 *
 * Le flanc n'est pas découpé en facettes : vu de face, un prisme à contour
 * convexe ne montre qu'une bande continue, bornée par les deux points
 * extrêmes de la silhouette projetée. On prend donc la chaîne « basse » du
 * contour projeté et on la referme sur sa copie décalée de l'épaisseur.
 */
export function slab(
	outline: readonly Pt[],
	z: number,
	thickness: number,
	offset: Pt = [0, 0]
): Slab {
	const world = outline.map(
		([x, y]) => project([x + offset[0], y + offset[1], z]) as Pt
	);

	let left = 0;
	let right = 0;
	for (let i = 1; i < world.length; i++) {
		if (world[i][0] < world[left][0]) left = i;
		if (world[i][0] > world[right][0]) right = i;
	}

	/** Chaîne de `from` à `to` en suivant l'ordre du contour. */
	const chain = (from: number, to: number): Pt[] => {
		const out: Pt[] = [];
		for (let i = from; ; i = (i + 1) % world.length) {
			out.push(world[i]);
			if (i === to) break;
		}
		return out;
	};

	const a = chain(left, right);
	const b = chain(right, left);
	const meanY = (chain_: Pt[]) =>
		chain_.reduce((sum, [, y]) => sum + y, 0) / chain_.length;

	// Celle dont les points sont le plus bas à l'écran : y croît vers le bas.
	const front = meanY(a) > meanY(b) ? a : b;
	const skirt = [
		...front,
		...[...front].reverse().map(([x, y]) => [x, y + thickness] as Pt),
	];

	const all = [...world, ...world.map(([x, y]) => [x, y + thickness] as Pt)];
	const xs = all.map(([x]) => x);
	const ys = all.map(([, y]) => y);

	const cx = offset[0];
	const cy = offset[1];

	return {
		top: path(world),
		side: path(skirt),
		center: project([cx, cy, z]),
		bounds: {
			minX: Math.min(...xs),
			minY: Math.min(...ys),
			maxX: Math.max(...xs),
			maxY: Math.max(...ys),
		},
	};
}

/** Dalle rectangulaire arrondie, le cas courant. */
export function plate(config: {
	width: number;
	depth: number;
	z: number;
	thickness: number;
	radius?: number;
	offset?: Pt;
}): Slab {
	const { width, depth, z, thickness, radius = 6, offset = [0, 0] } = config;
	return slab(roundedRect(width, depth, radius), z, thickness, offset);
}

/**
 * Réunit plusieurs boîtes englobantes en un `viewBox`, avec une marge.
 *
 * Cadrer à la main se paie à chaque retouche d'une figure : un élément déplacé
 * de quelques unités sort du cadre sans prévenir. On laisse donc la géométrie
 * décider.
 */
export function frame(
	boxes: readonly { minX: number; minY: number; maxX: number; maxY: number }[],
	margin = 14
): { viewBox: string; width: number; height: number } {
	const minX = Math.min(...boxes.map((b) => b.minX)) - margin;
	const minY = Math.min(...boxes.map((b) => b.minY)) - margin;
	const maxX = Math.max(...boxes.map((b) => b.maxX)) + margin;
	const maxY = Math.max(...boxes.map((b) => b.maxY)) + margin;

	return {
		viewBox: `${fmt(minX)} ${fmt(minY)} ${fmt(maxX - minX)} ${fmt(maxY - minY)}`,
		width: maxX - minX,
		height: maxY - minY,
	};
}

/** Boîte englobante d'une liste de points écran, pour cadrer autre chose qu'un volume. */
export function boundsOf(points: readonly Pt[], pad = 0) {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	return {
		minX: Math.min(...xs) - pad,
		minY: Math.min(...ys) - pad,
		maxX: Math.max(...xs) + pad,
		maxY: Math.max(...ys) + pad,
	};
}

/**
 * Arc de cercle dans le plan (x, y), à l'altitude `z`.
 * Sert aux orbites et aux boucles de rétroaction, qui sont des cercles couchés.
 */
export function ring(config: {
	radius: number;
	z?: number;
	from?: number;
	to?: number;
	steps?: number;
	offset?: Pt;
}): Pt[] {
	const {
		radius,
		z = 0,
		from = 0,
		to = 2 * Math.PI,
		steps = 64,
		offset = [0, 0],
	} = config;

	return Array.from({ length: steps + 1 }, (_, i) => {
		const angle = from + (i / steps) * (to - from);
		return project([
			offset[0] + radius * Math.cos(angle),
			offset[1] + radius * Math.sin(angle),
			z,
		]);
	});
}

/** Cap, en degrés horaires depuis l'axe des x écran, pour orienter une pointe. */
export function heading(from: Pt, to: Pt): number {
	return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
}

/** Segment droit entre deux points du monde, en coordonnées écran. */
export function edge(a: Vec3, b: Vec3): [Pt, Pt] {
	return [project(a), project(b)];
}

/**
 * Chemin courbé entre deux points écran, bombé perpendiculairement.
 *
 * Les liaisons droites se confondent avec les arêtes des volumes ; une légère
 * courbure suffit à les en distinguer sans évoquer un diagramme de flux.
 */
export function arc(a: Pt, b: Pt, bow = 0.18): string {
	const mx = (a[0] + b[0]) / 2;
	const my = (a[1] + b[1]) / 2;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const cx = mx - dy * bow;
	const cy = my + dx * bow;
	return `M${fmt(a[0])} ${fmt(a[1])}Q${fmt(cx)} ${fmt(cy)} ${fmt(b[0])} ${fmt(b[1])}`;
}

export { fmt };
