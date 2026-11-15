import { arc, boundsOf, frame, heading, path, plate, project, ring } from "@/lib/iso";
import { Block, Head, IsoFigure, Runner, Tag, toneVars } from "@/components/iso/Figure";
import type { Lang } from "@/lib/i18n/config";

/* Voir `Greenhouse`. Noter le séparateur décimal des albédos, qui change aussi. */
const COPY = {
	fr: {
		title:
			"Schéma de la rétroaction de l'albédo : la banquise renvoie la majeure partie du rayonnement solaire, tandis que l'océan libéré par sa fonte l'absorbe, ce qui accélère la fonte.",
		caption: "Fondre, c'est remplacer un miroir par un capteur.",
		description:
			"Les mêmes rayons tombent sur les deux surfaces et y connaissent deux sorts. La boucle rouge est posée sur l'eau libre : c'est là que la chaleur s'accumule, et c'est elle qui ronge la glace voisine.",
		sea: "OCÉAN",
		seaSub: "albédo 0,06",
		ice: "BANQUISE",
		iceSub: "albédo 0,6 – 0,9",
		reflected: "réfléchi · 85 %",
		absorbed: "absorbé · 94 %",
		loop: "moins de glace, plus de chaleur",
	},
	en: {
		title:
			"Diagram of the albedo feedback: sea ice reflects most of the incoming sunlight, while the open ocean exposed by its melting absorbs it, which speeds the melting up.",
		caption: "Melting means swapping a mirror for a collector.",
		description:
			"The same rays land on both surfaces and meet two different fates. The red loop sits on open water: that is where the heat builds up, and it is what eats away at the ice beside it.",
		sea: "OCEAN",
		seaSub: "albedo 0.06",
		ice: "SEA ICE",
		iceSub: "albedo 0.6 – 0.9",
		reflected: "reflected · 85%",
		absorbed: "absorbed · 94%",
		loop: "less ice, more heat",
	},
} satisfies Record<Lang, Record<string, string>>;

/**
 * La rétroaction de l'albédo, la boucle qui fait que l'Arctique se réchauffe
 * trois à quatre fois plus vite que le reste du globe.
 *
 * Deux surfaces côte à côte sous le même soleil, et tout tient dans ce qu'elles
 * en font : la banquise renvoie l'essentiel du rayonnement, l'eau libre
 * l'absorbe presque entièrement. Fondre, pour la glace, c'est donc remplacer un
 * miroir par un capteur — et la boucle se referme.
 */

const SEA = plate({ width: 192, depth: 96, z: 0, thickness: 7, radius: 12 });

/** La banquise, posée sur la moitié arrière du bassin, et qui fond. */
const ICE = plate({
	width: 84,
	depth: 74,
	z: 7,
	thickness: 8,
	radius: 10,
	offset: [-48, -6],
});

const sun = [-8, -164] as const;

const iceHit = project([-48, -6, 15]);
const seaHit = project([52, 14, 0]);
const bounceTo = [-134, -128] as const;

const ICE_IN = arc(sun, iceHit, 0.04);
const ICE_OUT = arc(iceHit, bounceTo, -0.07);
const SEA_IN = arc(sun, seaHit, -0.04);

/** La boucle, couchée sur l'eau libre : c'est là que la chaleur s'accumule. */
const LOOP_PTS = ring({ radius: 25, z: 1, offset: [52, 14] });
const LOOP = path(LOOP_PTS);

const SUN_RAYS = Array.from({ length: 12 }, (_, i) => {
	const a = (i / 12) * 2 * Math.PI;
	return [
		[sun[0] + Math.cos(a) * 11, sun[1] + Math.sin(a) * 11],
		[sun[0] + Math.cos(a) * 15.5, sun[1] + Math.sin(a) * 15.5],
	] as const;
});

const VIEW = frame([SEA.bounds, ICE.bounds, boundsOf([sun, bounceTo], 18)], 14);

export function IceAlbedoFigure({ lang }: { lang: Lang }) {
	const t = COPY[lang];

	return (
		<IsoFigure
			title={t.title}
			caption={t.caption}
			description={t.description}
			viewBox={VIEW.viewBox}
			maxWidth={680}
		>
			<Block slab={SEA} tone="blue" label={t.sea} sub={t.seaSub} labelDy={40} labelDx={-44} deep />

			{/* La chaleur tourne dans l'eau libre, et c'est elle qui ronge la glace. */}
			<g style={toneVars("red")}>
				<path d={LOOP} className="wire march" />
			</g>
			<Runner d={LOOP} tone="red" count={3} duration={4.4} radius={2} loop />

			{/* La dalle de glace s'affaisse et s'efface : c'est la fonte. */}
			<Block
				slab={ICE}
				tone="cyan"
				label={t.ice}
				sub={t.iceSub}
				labelDy={-2}
				className="thaw"
				style={{ "--dur": "9s" } as React.CSSProperties}
			/>

			<g style={toneVars("amber")}>
				<path d={ICE_IN} className="wire march" />
				<path d={ICE_OUT} className="wire march" />
				<path d={SEA_IN} className="wire march" />
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
			<Runner d={ICE_IN} tone="amber" count={3} duration={3.8} />
			<Runner d={ICE_OUT} tone="amber" count={3} duration={3.8} delayFrom={1.3} />
			<Runner d={SEA_IN} tone="amber" count={3} duration={3.8} delayFrom={0.6} />
			<Head at={seaHit} angle={heading(sun, seaHit)} tone="amber" />
			<Head at={bounceTo} angle={heading(iceHit, bounceTo)} tone="amber" />

			<Tag x={bounceTo[0] + 30} y={bounceTo[1] + 16} tone="amber" width={62}>
				{t.reflected}
			</Tag>
			<Tag x={seaHit[0] + 4} y={seaHit[1] - 46} tone="amber" width={62}>
				{t.absorbed}
			</Tag>
			<Tag x={seaHit[0]} y={seaHit[1] + 32} tone="red" width={84}>
				{t.loop}
			</Tag>
		</IsoFigure>
	);
}
