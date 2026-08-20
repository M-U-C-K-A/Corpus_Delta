import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudiesExplorer } from "@/components/site/StudiesExplorer";
import { getSearchDocuments } from "@/lib/search/documents";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLang, LANGS } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
	return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
	if (!isLang(params.lang)) return {};
	const dict = getDictionary(params.lang);

	return pageMetadata({
		lang: params.lang,
		title: dict.studies.title,
		description: dict.studies.lead,
		section: "studies",
	});
}

export default function StudiesPage({ params }: { params: { lang: string } }) {
	if (!isLang(params.lang)) notFound();
	const lang = params.lang;
	const dict = getDictionary(lang);
	const documents = getSearchDocuments();

	return (
		<div className="container py-12">
			<header className="max-w-2xl">
				<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.studies.title}</h1>
				<p className="mt-2 text-muted-foreground">{dict.studies.lead}</p>
			</header>

			<div className="mt-10">
				{/* useSearchParams impose une frontière de suspense lors du prérendu. */}
				<Suspense fallback={<div className="py-16 text-sm text-muted-foreground">…</div>}>
					<StudiesExplorer lang={lang} documents={documents} />
				</Suspense>
			</div>
		</div>
	);
}
