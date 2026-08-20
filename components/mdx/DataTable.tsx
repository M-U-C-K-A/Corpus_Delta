import { getDataset } from "@/lib/content/datasets";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n/config";

/**
 * Tableau tiré du même jeu de données qu'un graphique, pour les lecteurs qui
 * veulent les valeurs exactes — et pour l'accessibilité, un graphique seul
 * n'étant pas lisible au lecteur d'écran.
 */
export function DataTable({
	dataset: datasetId,
	xKey = "year",
	xLabel,
	lang,
}: {
	dataset: string;
	xKey?: string;
	xLabel?: string;
	lang: Lang;
}) {
	const dataset = getDataset(datasetId);
	if (!dataset) throw new Error(`<DataTable dataset="${datasetId}"> : jeu de données introuvable.`);

	return (
		<figure className="not-prose my-8">
			<figcaption className="mb-3 font-serif text-base font-semibold">
				{dataset.title[lang] ?? dataset.title.fr}
			</figcaption>

			<div className="overflow-x-auto rounded-md border border-border">
				<table className="w-full border-collapse text-sm">
					<caption className="sr-only">{dataset.title[lang] ?? dataset.title.fr}</caption>
					<thead>
						<tr className="border-b border-border bg-muted/50 text-left">
							<th scope="col" className="px-3 py-2 font-medium">
								{xLabel ?? xKey}
							</th>
							{dataset.series.map((series) => (
								<th key={series.key} scope="col" className="px-3 py-2 text-right font-medium">
									{series.label[lang] ?? series.label.fr}
									{dataset.unit && (
										<span className="ml-1 font-normal text-muted-foreground">({dataset.unit})</span>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{dataset.rows.map((row, index) => (
							<tr key={String(row[xKey] ?? index)} className="border-b border-border/60 last:border-0">
								<th scope="row" className="px-3 py-1.5 text-left font-normal tabular">
									{String(row[xKey] ?? "—")}
								</th>
								{dataset.series.map((series) => (
									<td key={series.key} className="px-3 py-1.5 text-right tabular">
										{row[series.key] ?? "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p className="mt-2 text-xs text-muted-foreground">
				{dataset.source.publisher ? `${dataset.source.publisher} — ` : ""}
				<a
					href={dataset.source.url}
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-2 hover:text-foreground"
				>
					{dataset.source.label}
				</a>
				{dataset.source.accessedAt ? ` · relevé le ${formatDate(dataset.source.accessedAt, lang)}` : ""}
			</p>
		</figure>
	);
}
