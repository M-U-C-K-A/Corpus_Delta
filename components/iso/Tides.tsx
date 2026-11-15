import { arc, boundsOf, frame, heading, path, plate, project, ring } from "@/lib/iso";
import { Block, Head, IsoFigure, Runner, Tag, toneVars } from "@/components/iso/Figure";

/**
 * Deux figures pour la marée, parce qu'il y a deux histoires distinctes et
 * qu'on les confond en permanence.
 *
 * La première est de l'astronomie : la Lune déforme l'océan en deux
 * renflements opposés, immobiles par rapport à elle, et c'est la Terre qui
 * tourne au travers. La seconde est de la géographie côtière : le seuil de
 * submersion d'un quai ne bouge pas, la marée non plus, mais le niveau moyen
 * monte sous les deux.
 */

/* ------------------------------------------------------------------ */
/* Terre, Lune et renflements                                          */
/* ------------------------------------------------------------------ */

const R_EARTH = 36;
const R_ORBIT = 132;

/** Équateur et méridiens : ce qui donne du volume à un simple disque. */
const EQUATOR = path(ring({ radius: R_EARTH, z: 0 }), false);
const MERIDIANS = [0.25, 0.55, 0.85].map((k) =>
	path(
		Array.from({ length: 49 }, (_, i) => {
			const a = (i / 48) * 2 * Math.PI;
			return project([R_EARTH * Math.cos(a) * k, 0, R_EARTH * Math.sin(a)]);
		}),
		false
	)
);

/** L'enveloppe de marée : deux renflements alignés sur la Lune. */
const ENVELOPE = path(
	Array.from({ length: 97 }, (_, i) => {
		const a = (i / 96) * 2 * Math.PI;
		// Un cosinus double : un renflement côté Lune, un à l'opposé.
		const r = R_EARTH + 13 + 9 * Math.cos(2 * a);
		return project([r * Math.cos(a), r * Math.sin(a), 0]);
	})
);

const ORBIT_PTS = ring({ radius: R_ORBIT, z: 0 });
const ORBIT = path(ORBIT_PTS);

/** Le plan de l'orbite lunaire, basculé : c'est lui qui précesse en 18,6 ans. */
const NODAL = path(
	Array.from({ length: 97 }, (_, i) => {
		const a = (i / 96) * 2 * Math.PI;
		const tilt = 0.33;
		return project([
			R_ORBIT * Math.cos(a),
			R_ORBIT * Math.sin(a) * Math.cos(tilt),
			R_ORBIT * Math.sin(a) * Math.sin(tilt),
		]);
	})
);

const moon = project([R_ORBIT, 0, 0]);
const nearBulge = project([R_EARTH + 24, 0, 0]);
const farBulge = project([-(R_EARTH + 24), 0, 0]);

const PULL = arc(project([R_EARTH + 30, 0, 0]), project([R_ORBIT - 16, 0, 0]), 0);

const TIDE_VIEW = frame(
	[boundsOf(ORBIT_PTS, 30), boundsOf([moon], 26)],
	12
);

export function TideFigure() {
	return (
		<IsoFigure
			title="Schéma des marées : la Lune déforme l'océan en deux renflements opposés, immobiles par rapport à elle, que la rotation de la Terre fait défiler deux fois par jour sous chaque côte."
			caption="Ce n'est pas la marée qui se déplace, c'est la Terre qui tourne dessous."
			description="L'enveloppe bleue ne tourne pas : elle reste alignée sur la Lune, et la Terre défile dessous. L'ellipse violette est le plan de l'orbite lunaire, dont le basculement met 18,6 ans à revenir à son point de départ."
			viewBox={TIDE_VIEW.viewBox}
			maxWidth={680}
		>
			{/* Le plan nodal, en arrière-plan : il n'est pas l'orbite du mois. */}
			<g style={toneVars("violet")}>
				<path d={NODAL} className="hair" strokeDasharray="3 5" />
			</g>
			<Runner d={NODAL} tone="violet" count={1} duration={14} radius={1.8} loop />

			<g style={toneVars("slate")}>
				<path d={ORBIT} className="wire" />
			</g>

			{/* L'enveloppe de marée, tracée avant la Terre : elle l'entoure. */}
			<g style={toneVars("blue")}>
				<path d={ENVELOPE} className="glass" />
				<path d={ENVELOPE} className="wire march" />
			</g>

			{/* La Terre. Les méridiens tournent, les renflements non. */}
			<g style={toneVars("teal")}>
				<circle cx={0} cy={0} r={R_EARTH} className="face" />
				<circle cx={0} cy={0} r={R_EARTH} className="line" />
				<path d={EQUATOR} className="hair" />
				{MERIDIANS.map((d, i) => (
					<path key={i} d={d} className="hair" />
				))}
				<text x={0} y={2} textAnchor="middle" className="ink" fontSize="7.2" fontWeight="600">
					TERRE
				</text>
				<text x={0} y={10.4} textAnchor="middle" className="dim" fontSize="5.4">
					rotation · 24 h
				</text>
			</g>

			{/* La Lune, et le sens dans lequel elle tire. */}
			<g style={toneVars("slate")}>
				<path d={PULL} className="wire march" />
				<circle cx={moon[0]} cy={moon[1]} r={13} className="face" />
				<circle cx={moon[0]} cy={moon[1]} r={13} className="line" />
				<circle cx={moon[0] - 4} cy={moon[1] - 3} r={2.6} className="hair" />
				<circle cx={moon[0] + 3} cy={moon[1] + 4} r={1.8} className="hair" />
				<text x={moon[0]} y={moon[1] + 25} textAnchor="middle" className="ink" fontSize="6.4" fontWeight="600">
					LUNE
				</text>
			</g>
			<Runner d={EQUATOR} tone="teal" count={2} duration={7} radius={1.6} loop />
			<Runner d={PULL} tone="slate" count={2} duration={3.4} radius={1.7} />
			<Head at={project([R_EARTH + 30, 0, 0])} angle={heading(moon, nearBulge)} tone="slate" />

			<Tag x={nearBulge[0] + 36} y={nearBulge[1] - 32} tone="blue" width={66}>
				renflement direct
			</Tag>
			<Tag x={farBulge[0] - 34} y={farBulge[1] + 34} tone="blue" width={68}>
				renflement opposé
			</Tag>
			<Tag x={-R_ORBIT * 0.72} y={-R_ORBIT * 0.5} tone="violet" width={86}>
				cycle nodal · 18,6 ans
			</Tag>
			<Tag x={R_ORBIT * 0.3} y={R_ORBIT * 0.56} tone="slate" width={74}>
				orbite · 27,3 jours
			</Tag>
		</IsoFigure>
	);
}

/* ------------------------------------------------------------------ */
/* Le quai, le seuil et le niveau moyen                                */
/* ------------------------------------------------------------------ */

const SEABED = plate({ width: 186, depth: 88, z: 0, thickness: 6, radius: 11 });

/**
 * La tranche d'eau, dont la hauteur oscille : c'est la marée. Elle s'arrête au
 * pied du quai plutôt que de passer dessous, sans quoi les deux volumes se
 * chevauchent et le seuil cesse de se lire.
 */
const WATER = plate({ width: 136, depth: 88, z: 30, thickness: 24, radius: 11, offset: [25, 0] });

/** Le quai, posé au bord : son arête est le seuil de submersion. */
const QUAY = plate({ width: 54, depth: 80, z: 44, thickness: 38, radius: 5, offset: [-66, 0] });

const thresholdA = project([-39, 44, 44]);
const thresholdB = project([-39, -44, 44]);
const THRESHOLD = path([thresholdA, thresholdB], false);

/** La montée du niveau moyen : lente, régulière, et sous tout le reste. */
const riseFrom = project([66, -10, 22]);
const riseTo = project([66, -10, 48]);
const RISE = arc(riseFrom, riseTo, 0);

const GAUGE_VIEW = frame([SEABED.bounds, WATER.bounds, QUAY.bounds], 16);

export function TideGaugeFigure() {
	return (
		<IsoFigure
			title="Schéma de la submersion à marée haute : le seuil du quai et l'amplitude de la marée sont inchangés, mais le niveau moyen de la mer monte sous eux."
			caption="Le seuil n'a pas bougé, la marée non plus."
			description="Le trait rouge sur l'arête du quai est le seuil, posé une fois pour toutes. La tranche d'eau monte et redescend avec la marée ; la flèche, elle, est la dérive du niveau moyen, qui ne redescend pas."
			viewBox={GAUGE_VIEW.viewBox}
			maxWidth={680}
		>
			<Block slab={SEABED} tone="slate" label="FOND" sub="estran" labelDy={26} labelDx={46} />

			{/* La tranche d'eau respire : la marée monte et redescend. */}
			<Block
				slab={WATER}
				tone="blue"
				label="MER"
				sub="marnage ≈ 1,4 m"
				labelDy={16}
				labelDx={-12}
				className="float"
				style={{ "--dur": "6s" } as React.CSSProperties}
				glass
			/>

			<Block slab={QUAY} tone="amber" label="QUAI" sub="seuil fixe" labelDy={-2} />

			{/* Le seuil : un trait net, qui ne bouge pas d'une figure à l'autre. */}
			<g style={toneVars("red")}>
				<path d={THRESHOLD} className="line" strokeDasharray="4 3" />
			</g>

			{/* La montée du niveau moyen, lente et unidirectionnelle. */}
			<g style={toneVars("red")}>
				<path d={RISE} className="wire march" style={{ "--dur": "5s" } as React.CSSProperties} />
			</g>
			<Runner d={RISE} tone="red" count={2} duration={6.5} radius={1.8} />
			<Head at={riseTo} angle={heading(riseFrom, riseTo)} tone="red" />

			<Tag x={thresholdA[0] + 30} y={thresholdA[1] + 10} tone="red" width={78}>
				seuil de submersion
			</Tag>
			<Tag x={riseFrom[0] + 6} y={riseFrom[1] - 42} tone="red" width={78}>
				niveau moyen · +3 mm/an
			</Tag>
		</IsoFigure>
	);
}
