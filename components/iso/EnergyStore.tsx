import { arc, boundsOf, frame, heading, path, plate, project } from "@/lib/iso";
import { Block, Head, IsoFigure, Runner, Tag, toneVars } from "@/components/iso/Figure";

/**
 * Où va l'énergie que la Terre ne renvoie plus.
 *
 * La question que tout le monde se pose devant un réchauffement « de 1,3 °C » :
 * si peu, vraiment ? La réponse tient à ce que l'air ne stocke presque rien.
 * Les hauteurs de cette figure sont les parts réellement mesurées du bilan
 * énergétique terrestre : l'atmosphère, qui est la seule chose que nous
 * ressentions, en reçoit un centième.
 *
 * Parts du GIEC (AR6, chapitre 7, inventaire énergétique 1971-2018).
 */

const STORES = [
	{ key: "ocean", sub: "OCÉAN · 0-2000 m", share: 91, tone: "blue" as const },
	{ key: "land", sub: "TERRES · sols", share: 5, tone: "amber" as const },
	{ key: "ice", sub: "GLACE · fonte", share: 3, tone: "cyan" as const },
	{ key: "air", sub: "AIR · ce qu'on sent", share: 1, tone: "red" as const },
];

/** Échelle : la part la plus haute occupe 108 unités de hauteur. */
const SCALE = 108 / 91;
/** Hauteur plancher, pour qu'une part de 1 % reste un volume et non un trait. */
const FLOOR = 5;

const COL_W = 42;
const COL_D = 42;
const GAP = 52;

const BASE = plate({ width: 230, depth: 70, z: 0, thickness: 6, radius: 10 });

/**
 * Les colonnes sont alignées le long de l'axe x du monde, ce qui les range en
 * diagonale à l'écran — la lecture suit alors l'arête de la dalle.
 */
const COLUMNS = STORES.map((store, i) => {
	const x = -78 + i * GAP;
	const height = Math.max(store.share * SCALE, FLOOR);
	return {
		...store,
		x,
		height,
		// Un prisme : la face supérieure est à `height`, le flanc descend d'autant.
		slab: plate({
			width: COL_W,
			depth: COL_D,
			z: height,
			thickness: height,
			radius: 5,
			offset: [x, 0],
		}),
		feed: arc(
			project([x, 0, height + 74]),
			project([x, 0, height + 3]),
			0
		),
		cap: project([x, 0, height]),
	};
});

const VIEW = frame(
	[BASE.bounds, ...COLUMNS.map((c) => c.slab.bounds), boundsOf(COLUMNS.map((c) => project([c.x, 0, c.height + 92])))],
	16
);

export function EnergyStoreFigure() {
	return (
		<IsoFigure
			title="Diagramme isométrique des parts de l'excédent d'énergie terrestre : l'océan en absorbe 91 %, les terres 5 %, la fonte des glaces 3 %, l'atmosphère 1 %."
			caption="Le réchauffement que nous ressentons est le centième du problème."
			description="Hauteurs et nombre de mobiles proportionnels aux parts mesurées. La colonne de droite, l'air, est la seule dont nous ayons l'expérience directe. Parts du GIEC, inventaire énergétique 1971-2018."
			viewBox={VIEW.viewBox}
			maxWidth={700}
		>
			<Block slab={BASE} tone="slate" />

			{COLUMNS.map((column) => {
				// Le débit se lit aussi dans le nombre de mobiles : neuf contre un.
				const count = Math.max(1, Math.round(column.share / 11));
				return (
					<g key={column.key}>
						<g style={toneVars(column.tone)}>
							<path d={column.feed} className="wire march" />
						</g>
						<Runner
							d={column.feed}
							tone={column.tone}
							count={count}
							duration={3.6}
							radius={1.9}
						/>
						<Head
							at={column.cap}
							angle={heading(project([column.x, 0, column.height + 20]), column.cap)}
							tone={column.tone}
						/>
					</g>
				);
			})}

			{/* Peintes après les flux, de la plus lointaine à la plus proche.
			    Le chiffre tient lieu de libellé : c'est lui le propos. */}
			{COLUMNS.map((column) => (
				<Block
					key={column.key}
					slab={column.slab}
					tone={column.tone}
					label={`${column.share} %`}
					sub={column.sub}
					labelSize={10}
					labelDy={-5}
				/>
			))}

			<Tag
				x={COLUMNS[0].cap[0] + 26}
				y={COLUMNS[0].cap[1] - 60}
				tone="slate"
				width={92}
			>
				excédent d&apos;énergie du système
			</Tag>
		</IsoFigure>
	);
}
