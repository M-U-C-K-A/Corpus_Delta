import { boundsOf, frame, plate, project } from "@/lib/iso";
import { Block, IsoFigure, type Tone } from "@/components/iso/Figure";
import { byDecade, readSeries } from "@/lib/content/series";
import { colorForTheme, type DitherColor } from "@/lib/content/chart-colors";
import type { ThemeId } from "@/lib/content/taxonomy";
import { formatDate } from "@/lib/format";
import { LOCALES, type Lang } from "@/lib/i18n/config";

/**
 * Moyennes par décennie, en volumes.
 *
 * Une courbe montre une trajectoire ; des volumes rangés en escalier montrent
 * des paliers, et c'est ce que l'on veut quand la question est « de combien
 * cette décennie dépasse-t-elle la précédente ». Les hauteurs sont
 * proportionnelles à l'écart au minimum de la série, qui est indiqué : sans
 * cela, un axe tronqué sans le dire exagérerait les différences.
 */

const TONE_FOR: Record<DitherColor, Tone> = {
	green: "green",
	blue: "blue",
	purple: "violet",
	pink: "red",
	orange: "amber",
	red: "red",
	grey: "slate",
};

const BAR_W = 28;
const BAR_D = 34;
const PITCH = 38;
const TALLEST = 104;

export function DecadeBars({
	dataset: datasetId,
	series,
	from,
	theme,
	decimals = 2,
	lang,
}: {
	dataset: string;
	series?: string;
	/** Première décennie retenue, quand le début de série n'apporte rien. */
	from?: number;
	theme?: ThemeId;
	decimals?: number;
	lang: Lang;
}) {
	const summary = readSeries(datasetId, series);
	if (!summary) {
		throw new Error(`<DecadeBars dataset="${datasetId}"> : jeu de données ou série introuvable.`);
	}

	const buckets = byDecade(summary.points).filter(
		(bucket) => from === undefined || bucket.decade >= from
	);
	if (buckets.length < 2) {
		throw new Error(`<DecadeBars dataset="${datasetId}"> : moins de deux décennies à comparer.`);
	}

	const { dataset } = summary;
	const tone = TONE_FOR[colorForTheme(theme)];

	const values = buckets.map((bucket) => bucket.mean);
	const floor = Math.min(...values);
	const ceiling = Math.max(...values);
	// Série à variation nulle : on évite la division par zéro plutôt que de
	// laisser passer un NaN jusque dans l'attribut `d`.
	const amplitude = ceiling - floor || 1;

	const span = (buckets.length - 1) * PITCH;
	const base = plate({
		width: span + BAR_W + 26,
		depth: BAR_D + 22,
		z: 0,
		thickness: 5,
		radius: 9,
	});

	const bars = buckets.map((bucket, index) => {
		const x = -span / 2 + index * PITCH;
		// Plancher de 7 unités : la décennie la plus basse doit rester un volume.
		const height = 7 + ((bucket.mean - floor) / amplitude) * TALLEST;
		return {
			...bucket,
			x,
			height,
			slab: plate({
				width: BAR_W,
				depth: BAR_D,
				z: height,
				thickness: height,
				radius: 4,
				offset: [x, 0],
			}),
			// Le libellé de décennie se pose devant la dalle, hors de son emprise.
			foot: project([x, BAR_D / 2 + 28, 0]),
		};
	});

	const view = frame(
		[base.bounds, ...bars.map((bar) => bar.slab.bounds), boundsOf(bars.map((bar) => bar.foot), 10)],
		14
	);

	const number = (value: number) =>
		new Intl.NumberFormat(LOCALES[lang], {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value);

	const title = dataset.title[lang] ?? dataset.title.fr;
	const partial = bars.filter((bar) => bar.partial).map((bar) => bar.decade);

	return (
		<div className="not-prose my-10">
			<p className="mb-3 font-serif text-base font-semibold">{title}, par décennie</p>

			<IsoFigure
				title={`Moyennes par décennie de « ${title} », de ${bars[0].decade} à ${
					bars[bars.length - 1].decade
				}, représentées en volumes isométriques.`}
				viewBox={view.viewBox}
				maxWidth={760}
				className="my-0"
			>
				<Block slab={base} tone="slate" />

				{bars.map((bar) => (
					<g key={bar.decade}>
						<Block
							slab={bar.slab}
							tone={tone}
							label={number(bar.mean)}
							labelSize={6}
							labelDy={1}
						/>
						<text
							x={bar.foot[0]}
							y={bar.foot[1]}
							textAnchor="middle"
							className="dim"
							fontSize="6"
							style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
						>
							{bar.decade}
						</text>
					</g>
				))}
			</IsoFigure>

			<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
				Hauteurs proportionnelles à l&apos;écart au minimum de la période, soit{" "}
				<span className="tabular">{number(floor)}</span> {dataset.unit} pour les années{" "}
				<span className="tabular">{bars.find((bar) => bar.mean === floor)?.decade}</span>.
				{partial.length > 0 && (
					<>
						{" "}
						{partial.length > 1 ? "Les décennies" : "La décennie"}{" "}
						<span className="tabular">{partial.join(", ")}</span>{" "}
						{partial.length > 1 ? "comptent" : "compte"} moins de dix années de relevé.
					</>
				)}{" "}
				{dataset.source.publisher ? `${dataset.source.publisher} — ` : ""}
				<a
					href={dataset.source.url}
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-2 hover:text-foreground"
				>
					{dataset.source.label}
				</a>
				{dataset.source.accessedAt
					? ` · relevé le ${formatDate(dataset.source.accessedAt, lang)}`
					: ""}
			</p>
		</div>
	);
}
