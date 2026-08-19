import { ChartCanvas, type ChartKind } from "@/components/mdx/ChartCanvas";
import { getDataset } from "@/lib/content/datasets";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n/config";

/**
 * Graphique adossé à un jeu de données versionné.
 *
 * Les valeurs ne sont jamais écrites dans le MDX : elles vivent dans
 * `data/datasets/`, avec leur source et leur date de relevé, affichées sous le
 * graphique. Un graphique dont on ne peut pas montrer la provenance n'a rien à
 * faire sur ce site.
 */
export function Chart({
	dataset: datasetId,
	kind = "line",
	xKey = "year",
	height,
	lang,
}: {
	dataset: string;
	kind?: ChartKind;
	xKey?: string;
	height?: number;
	lang: Lang;
}) {
	const dataset = getDataset(datasetId);
	if (!dataset) {
		throw new Error(`<Chart dataset="${datasetId}"> : jeu de données introuvable.`);
	}

	const series = dataset.series.map((item) => ({
		key: item.key,
		label: item.label[lang] ?? item.label.fr ?? item.key,
	}));

	return (
		<figure className="not-prose my-8">
			<figcaption className="mb-3">
				<span className="block font-serif text-base font-semibold">
					{dataset.title[lang] ?? dataset.title.fr}
				</span>
				{dataset.note?.[lang] && (
					<span className="mt-0.5 block text-sm text-muted-foreground">{dataset.note[lang]}</span>
				)}
			</figcaption>

			<ChartCanvas
				kind={kind}
				rows={dataset.rows}
				series={series}
				xKey={xKey}
				unit={dataset.unit}
				height={height}
			/>

			<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
				{dataset.source.publisher ? `${dataset.source.publisher} — ` : ""}
				<a
					href={dataset.source.url}
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-2 hover:text-foreground"
				>
					{dataset.source.label}
				</a>
				{dataset.source.year ? ` (${dataset.source.year})` : ""}
				{dataset.source.accessedAt ? ` · relevé le ${formatDate(dataset.source.accessedAt, lang)}` : ""}
			</p>
		</figure>
	);
}
