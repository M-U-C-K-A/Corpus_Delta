import { getAllStudies } from "@/lib/content/studies";
import type { Study } from "@/lib/content/schemas";

/**
 * Le graphe de citations interne à l'annuaire.
 *
 * Chaque fiche porte son identifiant OpenAlex et la liste des travaux qu'elle
 * cite, tels que la source les donne. Croiser les deux suffit : si une étude
 * de l'annuaire cite un travail dont l'identifiant est celui d'une autre fiche,
 * le lien existe. Rien n'est saisi, rien n'est pondéré, rien n'est choisi — ce
 * qui place ce graphe du même côté que les métadonnées bibliographiques, et non
 * du côté des rattachements thématiques, qui eux relèvent du jugement.
 *
 * Ce que le graphe ne dit pas : l'absence de lien ne signifie pas l'absence de
 * rapport. Elle peut tenir à une bibliographie qu'OpenAlex n'a pas dépouillée,
 * ou simplement à deux travaux contemporains qui s'ignorent. D'où le parti pris
 * d'afficher les liens trouvés sans jamais afficher un décompte de zéro comme
 * un résultat.
 */

export interface CitationNeighbours {
	/** Études de l'annuaire que celle-ci cite. */
	cites: Study[];
	/** Études de l'annuaire qui citent celle-ci. */
	citedBy: Study[];
}

interface Graph {
	cites: Map<string, string[]>;
	citedBy: Map<string, string[]>;
}

let cache: Graph | null = null;

function build(): Graph {
	const studies = getAllStudies();

	/* Un travail peut apparaître dans la bibliographie de plusieurs fiches : on
	   indexe une fois les identifiants OpenAlex de l'annuaire, puis on ne fait
	   plus que des recherches. */
	const byOpenAlexId = new Map<string, string>();
	for (const study of studies) {
		if (study.openAlexId) byOpenAlexId.set(study.openAlexId, study.id);
	}

	const cites = new Map<string, string[]>();
	const citedBy = new Map<string, string[]>();

	for (const study of studies) {
		for (const work of study.referencedWorks) {
			const target = byOpenAlexId.get(work);
			// L'auto-citation existe dans les corrigenda : elle n'apprend rien ici.
			if (!target || target === study.id) continue;

			if (!cites.has(study.id)) cites.set(study.id, []);
			cites.get(study.id)!.push(target);

			if (!citedBy.has(target)) citedBy.set(target, []);
			citedBy.get(target)!.push(study.id);
		}
	}

	return { cites, citedBy };
}

function graph(): Graph {
	if (!cache) cache = build();
	return cache;
}

/** Les deux sens à la fois, l'un et l'autre triés du plus récent au plus ancien. */
export function getCitationNeighbours(id: string): CitationNeighbours {
	const { cites, citedBy } = graph();
	const byId = new Map(getAllStudies().map((study) => [study.id, study]));

	const resolve = (ids: string[] | undefined): Study[] =>
		(ids ?? [])
			.map((target) => byId.get(target))
			.filter((study): study is Study => Boolean(study))
			.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "fr"));

	return { cites: resolve(cites.get(id)), citedBy: resolve(citedBy.get(id)) };
}

/**
 * Les études sur lesquelles l'annuaire s'appuie le plus.
 *
 * Le classement sort du corpus lui-même, pas d'un choix de rédaction : une
 * étude remonte parce que d'autres études retenues la citent.
 */
export function getMostCitedWithin(limit = 10): { study: Study; count: number }[] {
	const { citedBy } = graph();
	const byId = new Map(getAllStudies().map((study) => [study.id, study]));

	return [...citedBy.entries()]
		.map(([id, sources]) => ({ study: byId.get(id), count: sources.length }))
		.filter((row): row is { study: Study; count: number } => Boolean(row.study))
		.sort((a, b) => b.count - a.count || a.study.year - b.study.year)
		.slice(0, limit);
}

/** Pour la page Méthode : de quoi dire ce que le graphe couvre, sans l'embellir. */
export function getGraphCoverage(): { studies: number; links: number; connected: number } {
	const { cites, citedBy } = graph();
	const connected = new Set([...cites.keys(), ...citedBy.keys()]);
	let links = 0;
	for (const targets of cites.values()) links += targets.length;
	return { studies: getAllStudies().length, links, connected: connected.size };
}
