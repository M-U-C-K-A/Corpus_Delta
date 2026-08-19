import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG } from "@/lib/i18n/config";
import { homeRoute, route } from "@/lib/routes";

/**
 * Rendue avec un statut HTTP 404. La version précédente affichait un visuel
 * « introuvable » dans une réponse 200, que les moteurs indexaient comme une
 * page valide.
 *
 * `notFound()` ne transmet pas de paramètres de route : la langue n'est donc pas
 * connue ici et la page s'affiche dans la langue par défaut.
 */
export default function NotFound() {
	const lang = DEFAULT_LANG;
	const dict = getDictionary(lang);

	return (
		<div className="container flex min-h-[60vh] max-w-xl flex-col justify-center py-20">
			<p className="font-mono text-sm text-muted-foreground">404</p>
			<h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
				{dict.errors.notFoundTitle}
			</h1>
			<p className="mt-3 leading-relaxed text-muted-foreground">{dict.errors.notFoundBody}</p>

			<div className="mt-8 flex flex-wrap gap-3 text-sm">
				<Link
					href={homeRoute(lang)}
					className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
				>
					{dict.errors.backHome}
				</Link>
				<Link
					href={route(lang, "studies")}
					className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted"
				>
					{dict.studies.title}
				</Link>
				<Link
					href={route(lang, "glossary")}
					className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted"
				>
					{dict.glossary.title}
				</Link>
			</div>
		</div>
	);
}
