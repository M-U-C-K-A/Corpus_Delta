"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LANG, isLang } from "@/lib/i18n/config";
import { useParams } from "next/navigation";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const params = useParams();
	const raw = typeof params?.lang === "string" ? params.lang : DEFAULT_LANG;
	const dict = getDictionary(isLang(raw) ? raw : DEFAULT_LANG);

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="container flex min-h-[60vh] max-w-xl flex-col justify-center py-20">
			<h1 className="font-serif text-3xl font-semibold tracking-tight">{dict.errors.errorTitle}</h1>
			{/*
			  Le message brut peut exposer des détails d'implémentation : on n'affiche
			  que l'identifiant technique, suffisant pour retrouver la trace côté serveur.
			*/}
			{error.digest && (
				<p className="mt-3 font-mono text-xs text-muted-foreground">réf. {error.digest}</p>
			)}
			<div className="mt-8">
				<Button onClick={reset}>{dict.errors.retry}</Button>
			</div>
		</div>
	);
}
