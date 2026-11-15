import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/dither-kit/sparkline";
import { readSeries, type SeriesSummary } from "@/lib/content/series";
import type { DitherColor } from "@/lib/content/chart-colors";
import type { DomainHeadline } from "@/lib/content/schemas";
import { formatDate } from "@/lib/format";
import { LOCALES, type Lang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * Vignettes d'indicateur : la dernière valeur d'une série, sa dérive et sa
 * forme, en un coup d'œil.
 *
 * Le parti pris : afficher la variation annuelle moyenne récente plutôt que
 * l'écart total. Sur une série longue, l'écart depuis 1880 écrase tout et ne
 * dit rien du rythme actuel, qui est la question que le lecteur se pose.
 *
 * La couleur ne juge pas de son propre chef. Une série peut monter ou
 * descendre sans que cela soit une bonne ou une mauvaise nouvelle : c'est le
 * dossier qui le déclare, par `drift`, et la vignette s'y conforme.
 */

export interface TileSpec extends DomainHeadline {
	color?: DitherColor;
}

function signed(value: number, decimals: number, lang: Lang): string {
	const formatted = new Intl.NumberFormat(LOCALES[lang], {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(Math.abs(value));
	if (value > 0) return `+${formatted}`;
	if (value < 0) return `−${formatted}`;
	return formatted;
}

function driftClass(drift: DomainHeadline["drift"], change: number): string {
	if (drift === "neutre" || change === 0) return "text-muted-foreground";
	const adverse = drift === "hausse-defavorable" ? change > 0 : change < 0;
	return adverse ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--open-access))]";
}

/** Moyenne des `count` derniers points, ou de tous s'il y en a moins. */
function tailMean(points: readonly { value: number }[], count: number): number {
	const slice = points.slice(-count);
	return slice.reduce((sum, point) => sum + point.value, 0) / slice.length;
}

/**
 * Chiffre de dérive affiché sous la valeur, et sa formulation.
 *
 * Trois grandeurs plutôt qu'une, parce qu'une pente annuelle ne veut pas dire
 * la même chose selon la série : elle décrit bien une dérive régulière, mal un
 * décompte bruité, et pas du tout un cycle.
 */
function drift(spec: TileSpec, summary: SeriesSummary, lang: Lang) {
	const { points, recentPerYear, perYear, min, max, dataset } = summary;
	const unit = dataset.unit ?? "";
	const labels = getDictionary(lang).charts;
	// Une série sans unité ne doit pas laisser d'espace double avant le libellé.
	const join = (...parts: string[]) => parts.filter(Boolean).join(" ");

	if (spec.metric === "amplitude") {
		const value = max.value - min.value;
		return {
			value: 0,
			text: join(number(value, spec.decimals, lang), unit, labels.driftAmplitude),
		};
	}

	// Comparer deux décennies demande d'en avoir deux : sous ce seuil, la
	// seconde moyenne porterait sur les mêmes points que la première.
	if (spec.metric === "decennie" && points.length >= 20) {
		// Deux décennies consécutives : assez de points pour que le bruit
		// s'efface, assez proches pour que la comparaison reste actuelle.
		const recent = tailMean(points, 10);
		const previous = tailMean(points.slice(0, -10), 10);
		const value = recent - previous;
		return {
			value,
			text: join(signed(value, decimalsFor(value, spec.decimals), lang), unit, labels.driftDecade),
		};
	}

	const rate = recentPerYear ?? perYear;
	return {
		value: rate,
		text: join(signed(rate, decimalsFor(rate, spec.decimals), lang), unit, labels.driftPerYear),
	};
}

/**
 * Une variation peut être minuscule devant la valeur affichée : on lui accorde
 * les décimales dont elle a besoin pour ne pas s'afficher « +0,00 ».
 */
function decimalsFor(value: number, base: number): number {
	const size = Math.abs(value);
	if (size >= 1) return base;
	if (size >= 0.01) return 2;
	return 3;
}

function number(value: number, decimals: number, lang: Lang): string {
	return new Intl.NumberFormat(LOCALES[lang], {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
}

function Tile({
	spec,
	summary,
	lang,
}: {
	spec: TileSpec;
	summary: SeriesSummary;
	lang: Lang;
}) {
	const { dataset, last, first, points } = summary;
	const decimals = spec.decimals;

	const change = drift(spec, summary, lang);
	const label = dataset.title[lang] ?? dataset.title.fr;
	const Arrow =
		change.value > 0 ? ArrowUpRight : change.value < 0 ? ArrowDownRight : ArrowRight;

	return (
		<div className="flex flex-col justify-between bg-card p-5">
			<div>
				<p className="text-xs leading-snug text-muted-foreground">{label}</p>
				<p className="mt-2.5">
					<span className="font-serif text-[1.75rem] font-semibold leading-none tabular">
						{last.value.toFixed(decimals)}
					</span>
					{dataset.unit && (
						<span className="ml-1.5 text-sm text-muted-foreground">{dataset.unit}</span>
					)}
				</p>
				<p
					className={cn(
						"mt-2 inline-flex items-center gap-1 text-xs tabular",
						driftClass(spec.drift, change.value)
					)}
				>
					<Arrow className="h-3 w-3 shrink-0" aria-hidden="true" />
					{change.text}
				</p>
			</div>

			<div className="mt-4">
				{/* Décorative : la vignette porte déjà les chiffres qui comptent. */}
				<div className="h-10 w-full" aria-hidden="true">
					<Sparkline data={points.map((point) => point.value)} color={spec.color ?? "blue"} />
				</div>
				<p className="mt-2 text-[0.6875rem] text-muted-foreground tabular">
					{first.year}–{last.year} · {points.length} points
				</p>
			</div>
		</div>
	);
}

export function IndicatorTiles({
	specs,
	lang,
	columns = 4,
	footnote = true,
}: {
	specs: TileSpec[];
	lang: Lang;
	columns?: 2 | 3 | 4;
	/** Mention de provenance sous la grille. */
	footnote?: boolean;
}) {
	const tiles = specs
		.map((spec) => ({ spec, summary: readSeries(spec.dataset, spec.series) }))
		.filter((item): item is { spec: TileSpec; summary: SeriesSummary } => item.summary !== null);

	if (tiles.length === 0) return null;

	// Dédupliquées par organisme, et non par URL : quatre séries de la même
	// agence, publiées sur quatre pages différentes, ne justifient pas quatre
	// mentions identiques sous la grille.
	const sources = new Map(
		tiles.map(({ summary }) => [
			summary.dataset.source.publisher ?? summary.dataset.source.label,
			summary.dataset.source,
		])
	);

	return (
		<div className="not-prose my-8">
			<dl
				className={cn(
					"grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2",
					columns === 4 && "lg:grid-cols-4",
					columns === 3 && "lg:grid-cols-3"
				)}
			>
				{tiles.map(({ spec, summary }) => (
					<Tile key={`${spec.dataset}:${summary.key}`} spec={spec} summary={summary} lang={lang} />
				))}
			</dl>

			{footnote && (
				<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
					{[...sources.values()].map((source, index) => (
						<span key={source.url}>
							{index > 0 && " · "}
							<a
								href={source.url}
								target="_blank"
								rel="noreferrer"
								className="underline underline-offset-2 hover:text-foreground"
							>
								{source.publisher ?? source.label}
							</a>
							{source.accessedAt && ` (${formatDate(source.accessedAt, lang)})`}
						</span>
					))}
				</p>
			)}
		</div>
	);
}

/**
 * Version appelable depuis le MDX : les identifiants arrivent en une chaîne,
 * parce qu'un auteur ne doit pas avoir à écrire du JSX dans une prop.
 */
export function Indicators({
	ids,
	decimals = 2,
	drift = "neutre",
	metric = "pente",
	color,
	columns = 4,
	lang,
}: {
	ids: string;
	decimals?: number;
	drift?: DomainHeadline["drift"];
	metric?: DomainHeadline["metric"];
	color?: DitherColor;
	columns?: 2 | 3 | 4;
	lang: Lang;
}) {
	const specs: TileSpec[] = ids
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean)
		.map((dataset) => ({ dataset, decimals, drift, metric, color }));

	return <IndicatorTiles specs={specs} lang={lang} columns={columns} footnote={false} />;
}
