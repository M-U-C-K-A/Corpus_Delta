import { arc, boundsOf, frame, heading, path, plate, project, ring } from "@/lib/iso";
import { Block, Head, IsoFigure, Runner, Tag, toneVars } from "@/components/iso/Figure";

/**
 * La couche d'ozone et sa destruction catalytique.
 *
 * Deux choses à montrer, et elles sont souvent confondues avec l'effet de
 * serre : l'ozone stratosphérique arrête un rayonnement qui n'est pas
 * l'infrarouge mais l'ultraviolet, et un atome de chlore n'est pas consommé
 * quand il détruit une molécule d'ozone — il recommence. D'où la boucle, qui
 * est le vrai sujet de la figure : c'est elle qui explique qu'une poignée de
 * CFC ait suffi à ouvrir un trou au-dessus d'un continent.
 */

const W = 165;
const D = 70;
const STRATO = 104;

const GROUND = plate({ width: W, depth: D, z: 0, thickness: 5, radius: 10 });
const LAYER = plate({ width: W, depth: D, z: STRATO, thickness: 3, radius: 10 });

const uvFrom = [-122, -206] as const;
const uvHit = project([-44, 10, STRATO]);
const leakTo = project([-44, 10, 0]);

const cfcFrom = project([54, 6, 0]);
const cfcTo = project([54, 6, STRATO]);

const UV = arc(uvFrom, uvHit, 0.04);
const LEAK = arc(uvHit, leakTo, 0);
const CFC = arc(cfcFrom, cfcTo, 0);

/** La boucle catalytique, posée à plat sur la couche : un cercle couché. */
const LOOP_PTS = ring({ radius: 19, z: STRATO + 1, offset: [54, 6] });
const LOOP = path(LOOP_PTS);

/** Les molécules d'ozone, semées sur la couche sans régularité apparente. */
const O3 = [
	[-62, -22],
	[-30, 22],
	[-10, -26],
	[24, 26],
	[48, -22],
	[-72, 14],
	[14, -4],
	[-46, 2],
].map(([x, y], i) => ({ at: project([x, y, STRATO + 2]), delay: (i * 0.41) % 3.2 }));

const VIEW = frame(
	[GROUND.bounds, LAYER.bounds, boundsOf([uvFrom], 16), boundsOf(LOOP_PTS, 26)],
	14
);

export function OzoneFigure() {
	return (
		<IsoFigure
			title="Schéma de la couche d'ozone : l'ultraviolet solaire est absorbé par l'ozone stratosphérique, tandis qu'un atome de chlore issu des CFC détruit l'ozone en boucle sans être consommé."
			caption="Pourquoi quelques CFC ont suffi."
			description="La boucle violette est le point de la figure : l'atome de chlore en ressort tel qu'il y est entré, et recommence. Les pastilles bleues sont les molécules d'ozone, détruites et reformées en permanence."
			viewBox={VIEW.viewBox}
			maxWidth={620}
		>
			<Block slab={GROUND} tone="green" label="TROPOSPHÈRE" sub="sol · émissions" labelDy={4} />

			{/* Le CFC monte : lent, parce que la montée prend des années. */}
			<g style={toneVars("violet")}>
				<path d={CFC} className="wire march" style={{ "--dur": "4s" } as React.CSSProperties} />
			</g>
			<Runner d={CFC} tone="violet" count={2} duration={7} radius={1.8} />
			<Head at={cfcTo} angle={heading(cfcFrom, cfcTo)} tone="violet" />

			{/* L'UV qui passe quand la couche est amincie : un seul mobile, et lent. */}
			<g style={toneVars("amber")}>
				<path d={LEAK} className="hair" strokeDasharray="2 4" />
			</g>
			<Runner d={LEAK} tone="amber" count={1} duration={6.4} radius={1.4} />

			<Block slab={LAYER} tone="cyan" label="STRATOSPHÈRE" sub="couche d'ozone" labelDy={4} glass />

			{/* Les molécules d'ozone clignotent : détruites, reformées, à l'équilibre. */}
			<g style={toneVars("cyan")}>
				{O3.map(({ at, delay }, i) => (
					<circle
						key={i}
						cx={at[0]}
						cy={at[1]}
						r={2.4}
						className="dot breathe"
						style={{ "--delay": `${delay}s`, "--dur": "3.2s" } as React.CSSProperties}
					/>
				))}
			</g>

			{/* La boucle catalytique : le chlore en ressort tel qu'il y est entré. */}
			<g style={toneVars("violet")}>
				<path d={LOOP} className="wire march" />
			</g>
			<Runner d={LOOP} tone="violet" count={2} duration={2.6} radius={2.2} loop />
			<Tag x={cfcTo[0] + 24} y={cfcTo[1] + 27} tone="violet" width={78}>
				Cl + O₃ → ClO + O₂
			</Tag>

			{/* L'ultraviolet, par-dessus : il est arrêté par la couche, pas avant. */}
			<g style={toneVars("amber")}>
				<path d={UV} className="wire march" />
			</g>
			<Runner d={UV} tone="amber" count={4} duration={4} />
			<Head at={uvHit} angle={heading(uvFrom, uvHit)} tone="amber" />

			<Tag x={uvFrom[0] + 26} y={uvFrom[1] + 44} tone="amber">
				UV-B
			</Tag>
			<Tag x={leakTo[0] - 2} y={(uvHit[1] + leakTo[1]) / 2} tone="amber">
				ce qui passe
			</Tag>
			<Tag x={cfcFrom[0]} y={cfcFrom[1] - 54} tone="violet">
				CFC · 50 ans
			</Tag>
		</IsoFigure>
	);
}
