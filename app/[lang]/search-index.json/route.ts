import { getGlobalEntries } from "@/lib/search/global";
import { isLang, LANGS } from "@/lib/i18n/config";

/**
 * Index de la palette de recherche, servi à part.
 *
 * Il était auparavant passé en props au composant client depuis l'en-tête, donc
 * sérialisé dans le HTML de chaque page : 19 Ko gzip, 58 % du poids d'une page
 * sans contenu propre, répétés sur les 296 pages — et croissant avec le corpus.
 * La palette le récupère maintenant à sa première ouverture ; un visiteur qui ne
 * cherche rien ne le télécharge jamais.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function GET(_request: Request, { params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) return new Response("Not found", { status: 404 });

	return Response.json(getGlobalEntries(params.lang), {
		headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
	});
}
