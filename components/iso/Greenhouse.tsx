import { arc, boundsOf, frame, heading, path, plate, project } from "@/lib/iso";
import { Block, Head, IsoFigure, Runner, Tag, toneVars } from "@/components/iso/Figure";
import type { Lang } from "@/lib/i18n/config";

/**
 * L'effet de serre, en deux dalles et cinq trajets.
 *
 * Le point que la figure doit faire passer : ce n'est pas la lumière du Soleil
 * que les gaz à effet de serre retiennent, c'est le rayonnement infrarouge
 * réémis par la surface. D'où deux couleurs de mobiles, et une couche
 * translucide au visible mais qui renvoie l'infrarouge vers le bas.
 *
 * L'écart vertical entre les deux dalles est dicté par leur empreinte à
 * l'écran : une dalle de 165 sur 70 occupe 118 unités de haut une fois
 * projetée, et deux dalles plus rapprochées que cela se recouvriraient en
 * plein milieu, là où se trouvent les libellés.
 */

/*
  Les libellés d'une figure sont du contenu, pas de l'habillage : ils sont
  dessinés dans l'image et ne passent donc pas par le dictionnaire, qui sert
  l'interface. Chaque figure porte sa propre table, au plus près du dessin
  qu'elle légende.
*/
const COPY = {
	fr: {
		title:
			"Schéma de l'effet de serre : le rayonnement solaire traverse l'atmosphère et chauffe la surface, qui réémet un rayonnement infrarouge que les gaz à effet de serre renvoient vers le bas.",
		caption: "Ce que la couche laisse passer, et ce qu'elle renvoie.",
		description:
			"Les mobiles orange sont du rayonnement visible, les rouges de l'infrarouge. Toute la dissymétrie tient là : l'atmosphère est transparente aux premiers et opaque aux seconds.",
		surface: "SURFACE",
		surfaceSub: "sol · océan",
		air: "ATMOSPHÈRE",
		visible: "visible",
		infrared: "infrarouge",
		reemitted: "réémis",
		escape: "fuite",
		reflected: "réfléchi",
	},
	en: {
		title:
			"Diagram of the greenhouse effect: sunlight passes through the atmosphere and warms the surface, which re-emits infrared radiation that greenhouse gases send back down.",
		caption: "What the layer lets through, and what it sends back.",
		description:
			"The orange runners are visible light, the red ones infrared. The whole asymmetry sits there: the atmosphere is transparent to the first and opaque to the second.",
		surface: "SURFACE",
		surfaceSub: "land · ocean",
		air: "ATMOSPHERE",
		visible: "visible",
		infrared: "infrared",
		reemitted: "re-emitted",
		escape: "escape",
		reflected: "reflected",
	},
} satisfies Record<Lang, Record<string, string>>;

const W = 165;
const D = 70;
const TOP = 104;

const SURFACE = plate({ width: W, depth: D, z: 0, thickness: 5, radius: 10 });
const AIR = plate({ width: W, depth: D, z: TOP, thickness: 3, radius: 10 });

/** Ancrages en coordonnées monde, projetés une fois pour toutes. */
const hit = project([-40, 18, 0]);
const sun = [-124, -150] as const;

const riseFrom = project([2, 22, 0]);
const riseTo = project([2, 22, TOP]);

const backFrom = project([56, -8, TOP]);
const backTo = project([56, -8, 0]);

const escapeFrom = project([30, -26, TOP]);
const escapeTo = [92, -206] as const;

const albedoTo = [-96, -188] as const;

const SOLAR = arc(sun, hit, 0.04);
const RISE = arc(riseFrom, riseTo, 0);
const BACK = arc(backFrom, backTo, 0);
const ESCAPE = arc(escapeFrom, escapeTo, 0.06);
const ALBEDO = arc(hit, albedoTo, -0.1);

const SUN_RAYS = Array.from({ length: 12 }, (_, i) => {
	const a = (i / 12) * 2 * Math.PI;
	return [
		[sun[0] + Math.cos(a) * 11, sun[1] + Math.sin(a) * 11],
		[sun[0] + Math.cos(a) * 15.5, sun[1] + Math.sin(a) * 15.5],
	] as const;
});

const VIEW = frame(
	[SURFACE.bounds, AIR.bounds, boundsOf([sun, escapeTo, albedoTo], 18)],
	14
);

export function GreenhouseFigure({ lang }: { lang: Lang }) {
	const t = COPY[lang];

	return (
		<IsoFigure
			title={t.title}
			caption={t.caption}
			description={t.description}
			viewBox={VIEW.viewBox}
			maxWidth={620}
		>
			<Block slab={SURFACE} tone="orange" label={t.surface} sub={t.surfaceSub} labelDy={4} />

			{/* Les deux colonnes infrarouges : ce qui monte, ce qui revient. */}
			<g style={toneVars("red")}>
				<path d={RISE} className="wire march" />
				<path d={BACK} className="wire march" />
			</g>
			<Runner d={RISE} tone="red" count={3} duration={3.6} />
			<Runner d={BACK} tone="red" count={3} duration={3.6} delayFrom={1.2} />
			<Head at={backTo} angle={heading(backFrom, backTo)} tone="red" />

			{/* Translucide : on doit voir ce qui la traverse, c'est tout le propos. */}
			<Block slab={AIR} tone="cyan" label={t.air} sub="CO₂ · CH₄ · N₂O" labelDy={4} glass />

			<g style={toneVars("red")}>
				<path d={ESCAPE} className="wire" />
			</g>
			<Runner d={ESCAPE} tone="red" count={1} duration={5.4} radius={1.6} />

			{/* Le trajet solaire passe par-dessus tout : rien ne l'arrête avant le sol. */}
			<g style={toneVars("amber")}>
				<path d={SOLAR} className="wire march" />
				{SUN_RAYS.map(([a, b], i) => (
					<path key={i} d={path([a, b], false)} className="hair" />
				))}
				<circle cx={sun[0]} cy={sun[1]} r={10.5} className="face" />
				<circle
					cx={sun[0]}
					cy={sun[1]}
					r={10.5}
					className="line breathe"
					style={{ "--dur": "4.4s" } as React.CSSProperties}
				/>
			</g>
			<Runner d={SOLAR} tone="amber" count={4} duration={4.4} />
			<Head at={hit} angle={heading(sun, hit)} tone="amber" />

			<g style={toneVars("slate")}>
				<path d={ALBEDO} className="wire" />
			</g>
			<Runner d={ALBEDO} tone="slate" count={1} duration={6} radius={1.5} />

			<Tag x={sun[0] + 34} y={sun[1] + 46} tone="amber">
				{t.visible}
			</Tag>
			<Tag x={riseFrom[0]} y={(riseFrom[1] + riseTo[1]) / 2} tone="red">
				{t.infrared}
			</Tag>
			<Tag x={backFrom[0]} y={(backFrom[1] + backTo[1]) / 2} tone="red">
				{t.reemitted}
			</Tag>
			<Tag x={escapeTo[0] - 10} y={escapeTo[1] + 12} tone="red">
				{t.escape}
			</Tag>
			<Tag x={albedoTo[0] + 12} y={albedoTo[1] + 14} tone="slate">
				{t.reflected}
			</Tag>
		</IsoFigure>
	);
}
