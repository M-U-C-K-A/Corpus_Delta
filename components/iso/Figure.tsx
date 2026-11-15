import { cn } from "@/lib/utils";

/**
 * Cadre commun des figures isométriques.
 *
 * Les figures sont du SVG rendu côté serveur : aucune n'embarque de JavaScript.
 * Le mouvement vient de quelques animations CSS déclarées une seule fois ici,
 * et toutes se taisent sous `prefers-reduced-motion`. Une figure immobile reste
 * lisible : le mouvement souligne un trajet, il ne le remplace pas.
 */

/** Teintes disponibles. Une figure en combine deux ou trois, pas davantage. */
export const TONES = {
	blue: 205,
	cyan: 190,
	teal: 172,
	green: 145,
	amber: 38,
	orange: 22,
	red: 6,
	violet: 262,
	slate: 215,
} as const;

export type Tone = keyof typeof TONES;

/**
 * Variables de teinte d'un volume. Posées sur le groupe plutôt que sur chaque
 * face : un volume change de couleur en changeant une seule classe.
 */
export function toneVars(tone: Tone): React.CSSProperties {
	return { "--h": TONES[tone] } as React.CSSProperties;
}

const STYLES = `
.iso { --h: 205; }
.iso text { font-family: ui-monospace, "SF Mono", Menlo, monospace; }

/* Faces. Le flanc est plus sombre que le dessus : c'est tout l'ombrage. */
.iso .face  { fill: hsl(var(--h) 72% 95%); }
.iso .flank { fill: hsl(var(--h) 46% 87%); }
.iso .line  { fill: none; stroke: hsl(var(--h) 48% 46%); stroke-width: 1.1;
              stroke-linejoin: round; stroke-linecap: round; }
.iso .hair  { fill: none; stroke: hsl(var(--h) 40% 58%); stroke-width: 0.7;
              stroke-linecap: round; opacity: 0.75; }
.iso .ink   { fill: hsl(var(--h) 55% 24%); }
.iso .dim   { fill: hsl(var(--h) 25% 42%); }
.iso .dot   { fill: hsl(var(--h) 62% 46%); }
.iso .glass { fill: hsl(var(--h) 70% 92%); opacity: 0.36; }
.iso .deep  { fill: hsl(var(--h) 52% 74%); }
.iso .deepflank { fill: hsl(var(--h) 48% 62%); }

.dark .iso .face  { fill: hsl(var(--h) 34% 19%); }
.dark .iso .flank { fill: hsl(var(--h) 32% 13%); }
.dark .iso .line  { stroke: hsl(var(--h) 46% 60%); }
.dark .iso .hair  { stroke: hsl(var(--h) 34% 52%); }
.dark .iso .ink   { fill: hsl(var(--h) 55% 84%); }
.dark .iso .dim   { fill: hsl(var(--h) 22% 62%); }
.dark .iso .dot   { fill: hsl(var(--h) 60% 64%); }
.dark .iso .glass { fill: hsl(var(--h) 45% 34%); opacity: 0.34; }
.dark .iso .deep  { fill: hsl(var(--h) 44% 30%); }
.dark .iso .deepflank { fill: hsl(var(--h) 40% 22%); }

/* Liaison en pointillés : elle relie sans affirmer un tuyau. */
.iso .wire { fill: none; stroke: hsl(var(--h) 45% 52%); stroke-width: 1;
             stroke-dasharray: 2.5 3.5; stroke-linecap: round; opacity: 0.8; }
.dark .iso .wire { stroke: hsl(var(--h) 42% 58%); }

/* Étiquette posée sur une liaison, à la manière d'une cartouche. */
.iso .tagbox { fill: hsl(var(--h) 60% 97%); stroke: hsl(var(--h) 45% 62%);
               stroke-width: 0.8; }
.dark .iso .tagbox { fill: hsl(var(--h) 34% 14%); stroke: hsl(var(--h) 40% 46%); }

/* Mobile sur un trajet. Le trajet est porté par offset-path, posé en style. */
.iso .mover { offset-rotate: 0deg; animation: iso-run var(--dur, 4s) linear infinite;
              animation-delay: var(--delay, 0s); }
@keyframes iso-run {
  0%   { offset-distance: 0%;   opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}

/* Mobile qui fait le tour sans disparaître : orbites, boucles de rétroaction. */
.iso .orbiter { offset-rotate: 0deg; animation: iso-orbit var(--dur, 9s) linear infinite;
                animation-delay: var(--delay, 0s); }
@keyframes iso-orbit { to { offset-distance: 100%; } }

.iso .breathe { animation: iso-breathe var(--dur, 3.2s) ease-in-out infinite;
                animation-delay: var(--delay, 0s); }
@keyframes iso-breathe { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

.iso .march { animation: iso-march var(--dur, 2.4s) linear infinite; }
@keyframes iso-march { to { stroke-dashoffset: -12; } }

/* Respiration d'un volume : quelques dixièmes d'unité, juste de quoi vivre.
   transform-box est indispensable : en SVG, l'origine d'une transformation CSS
   se rapporte par défaut au viewBox entier et non à l'élément, si bien qu'une
   mise à l'échelle « centrée » déplace la pièce à travers toute la figure. */
.iso .float { animation: iso-float var(--dur, 5s) ease-in-out infinite;
              animation-delay: var(--delay, 0s);
              transform-box: fill-box; transform-origin: center; }
@keyframes iso-float { 0%, 100% { transform: translateY(0); }
                       50% { transform: translateY(-2.2px); } }

/* Fonte : la dalle s'affaisse et s'efface. */
.iso .thaw { animation: iso-thaw var(--dur, 7s) ease-in-out infinite;
             animation-delay: var(--delay, 0s);
             transform-box: fill-box; transform-origin: center; }
@keyframes iso-thaw {
  0%, 12%   { transform: translateY(0) scaleY(1); opacity: 1; }
  55%, 70%  { transform: translateY(3.5px) scaleY(0.55); opacity: 0.45; }
  100%      { transform: translateY(0) scaleY(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .iso .mover, .iso .orbiter, .iso .breathe,
  .iso .march, .iso .float, .iso .thaw { animation: none; }
  /* Immobiles, les mobiles se répartissent le long du trajet au lieu de
     s'empiler à son départ. */
  .iso .mover, .iso .orbiter { offset-distance: var(--rest, 50%); opacity: 1; }
}
`;

export function IsoFigure({
	title,
	caption,
	description,
	viewBox,
	children,
	className,
	maxWidth = 760,
}: {
	/** Lu par les lecteurs d'écran à la place du dessin. */
	title: string;
	/** Phrase affichée sous la figure. */
	caption?: string;
	/** Description longue, pour ce que le titre ne peut pas porter. */
	description?: string;
	viewBox: string;
	children: React.ReactNode;
	className?: string;
	maxWidth?: number;
}) {
	return (
		<figure className={cn("not-prose my-10", className)}>
			<div
				className="relative overflow-hidden rounded-xl border border-border bg-card"
				style={{ maxWidth }}
			>
				{/* Trame de points : la grille du papier millimétré, pas un décor. */}
				<div
					aria-hidden="true"
					className="absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
					style={{
						backgroundImage:
							"radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.35) 0.9px, transparent 0)",
						backgroundSize: "16px 16px",
					}}
				/>
				<svg
					viewBox={viewBox}
					role="img"
					aria-label={title}
					className="iso relative block w-full"
					style={{ overflow: "visible" }}
				>
					<style dangerouslySetInnerHTML={{ __html: STYLES }} />
					{children}
				</svg>
			</div>

			{(caption || description) && (
				<figcaption className="mt-3 max-w-[48rem] text-sm leading-relaxed text-muted-foreground">
					{caption && <span className="text-foreground">{caption}</span>}
					{caption && description && " "}
					{description}
				</figcaption>
			)}
		</figure>
	);
}

/**
 * Volume isométrique avec son libellé.
 *
 * Le libellé est posé au centre de la face supérieure ; le sous-titre, en plus
 * petit, donne l'unité ou les termes techniques — comme dans un schéma
 * d'architecture, où la boîte nomme et la ligne sous elle précise.
 */
export function Block({
	slab,
	tone,
	label,
	sub,
	className,
	style,
	labelDy = 0,
	labelDx = 0,
	labelSize = 7.2,
	glass = false,
	deep = false,
}: {
	slab: { top: string; side: string; center: readonly [number, number] };
	tone: Tone;
	label?: string;
	sub?: string;
	className?: string;
	style?: React.CSSProperties;
	/** Décalages du libellé, quand le centre géométrique tombe sur autre chose. */
	labelDy?: number;
	labelDx?: number;
	/** Corps du libellé, quand c'est lui qui porte le chiffre. */
	labelSize?: number;
	/**
	 * Volume translucide, pour une couche que les flux traversent. Sans cela, la
	 * dalle masquerait ce qui passe au travers — ce qui est précisément le sujet.
	 */
	glass?: boolean;
	/** Volume saturé, pour une surface qui absorbe plutôt qu'elle ne renvoie. */
	deep?: boolean;
}) {
	const [cx, cy] = slab.center;

	return (
		<g className={className} style={{ ...toneVars(tone), ...style }}>
			<path d={slab.side} className={glass ? "glass" : deep ? "deepflank" : "flank"} />
			<path d={slab.side} className="line" />
			<path d={slab.top} className={glass ? "glass" : deep ? "deep" : "face"} />
			<path d={slab.top} className="line" />

			{label && (
				<text
					x={cx + labelDx}
					y={cy + labelDy}
					textAnchor="middle"
					className="ink"
					fontSize={labelSize}
					fontWeight="600"
				>
					{label}
				</text>
			)}
			{sub && (
				<text
					x={cx + labelDx}
					y={cy + labelDy + labelSize + 1.3}
					textAnchor="middle"
					className="dim"
					fontSize="5.4"
					letterSpacing="0.4"
				>
					{sub}
				</text>
			)}
		</g>
	);
}

/** Cartouche posée sur une liaison, pour la nommer. */
export function Tag({
	x,
	y,
	children,
	tone = "slate",
	width,
}: {
	x: number;
	y: number;
	children: string;
	tone?: Tone;
	/** Largeur imposée, quand la mesure au jugé tombe à côté. */
	width?: number;
}) {
	// Approximation suffisante en chasse fixe : 0,52 em par caractère.
	const w = width ?? children.length * 2.95 + 7;

	return (
		<g style={toneVars(tone)}>
			<rect
				x={x - w / 2}
				y={y - 5.2}
				width={w}
				height={10.4}
				rx={5.2}
				className="tagbox"
			/>
			<text x={x} y={y + 2} textAnchor="middle" className="ink" fontSize="5.2">
				{children}
			</text>
		</g>
	);
}

/**
 * Mobile circulant sur un trajet.
 *
 * `offset-path` reprend la même chaîne `d` que la liaison tracée : le mobile ne
 * peut pas dériver du trait, puisque les deux décrivent la même courbe.
 */
export function Runner({
	d,
	tone = "blue",
	count = 3,
	duration = 4,
	radius = 1.9,
	loop = false,
	delayFrom = 0,
}: {
	d: string;
	tone?: Tone;
	count?: number;
	duration?: number;
	radius?: number;
	/** Trajet fermé : le mobile ne s'efface pas aux extrémités. */
	loop?: boolean;
	delayFrom?: number;
}) {
	return (
		<g style={toneVars(tone)}>
			{Array.from({ length: count }, (_, i) => (
				<circle
					key={i}
					r={radius}
					className={cn("dot", loop ? "orbiter" : "mover")}
					style={
						{
							offsetPath: `path("${d}")`,
							"--dur": `${duration}s`,
							"--delay": `${delayFrom + (i * duration) / count}s`,
							"--rest": `${Math.round((i / count) * 100)}%`,
						} as React.CSSProperties
					}
				/>
			))}
		</g>
	);
}

/** Pointe de flèche posée à l'extrémité d'une liaison. */
export function Head({
	at,
	angle,
	tone = "slate",
	size = 4,
}: {
	at: readonly [number, number];
	/** Degrés, sens horaire depuis l'axe des x écran. */
	angle: number;
	tone?: Tone;
	size?: number;
}) {
	return (
		<g style={toneVars(tone)} transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
			<path
				d={`M${-size} ${-size * 0.6}L0 0L${-size} ${size * 0.6}`}
				className="line"
				strokeWidth={1.2}
			/>
		</g>
	);
}
