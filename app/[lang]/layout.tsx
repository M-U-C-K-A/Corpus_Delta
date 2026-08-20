import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteConfig } from "@/lib/site-config";
import { LANGS, isLang, type Lang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homeRoute } from "@/lib/routes";
import "../globals.css";

const sans = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const serif = Source_Serif_4({
	subsets: ["latin"],
	variable: "--font-serif",
	display: "swap",
});

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
	params,
}: {
	params: { lang: string };
}): Promise<Metadata> {
	if (!isLang(params.lang)) return {};
	const lang = params.lang;

	return {
		metadataBase: new URL(siteConfig.url),
		title: {
			default: `${siteConfig.name} — ${siteConfig.tagline[lang]}`,
			template: `%s · ${siteConfig.name}`,
		},
		description: siteConfig.description[lang],
		applicationName: siteConfig.name,
		alternates: {
			canonical: homeRoute(lang),
			languages: Object.fromEntries(LANGS.map((l) => [l, homeRoute(l)])),
			types: { "application/rss+xml": `/${lang}/rss.xml` },
		},
		openGraph: {
			type: "website",
			locale: lang === "fr" ? "fr_FR" : "en_GB",
			siteName: siteConfig.name,
			title: `${siteConfig.name} — ${siteConfig.tagline[lang]}`,
			description: siteConfig.description[lang],
			url: homeRoute(lang),
		},
		twitter: { card: "summary_large_image" },
	};
}

export default function LangLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { lang: string };
}) {
	if (!isLang(params.lang)) notFound();
	const lang: Lang = params.lang;
	const dict = getDictionary(lang);

	return (
		<html lang={lang} suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
			<body className="min-h-screen font-sans antialiased">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<a
						href="#contenu"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
					>
						{dict.nav.skipToContent}
					</a>
					<div className="flex min-h-screen flex-col">
						<SiteHeader lang={lang} />
						<main id="contenu" className="flex-1">
							{children}
						</main>
						<SiteFooter lang={lang} />
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
