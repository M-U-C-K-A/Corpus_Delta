import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANGS } from "@/lib/i18n/config";

/**
 * Toute URL publique porte son préfixe de langue. Les adresses sans préfixe sont
 * redirigées vers la langue par défaut plutôt que servies en double, ce qui
 * évite d'indexer deux fois la même page.
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const hasLangPrefix = LANGS.some(
		(lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)
	);
	if (hasLangPrefix) return NextResponse.next();

	const url = request.nextUrl.clone();
	url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
	return NextResponse.redirect(url);
}

export const config = {
	// Les fichiers servis tels quels et les routes de métadonnées ne passent pas par la redirection.
	matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.[\\w]+$).*)"],
};
