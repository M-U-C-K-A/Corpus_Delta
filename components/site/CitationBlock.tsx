"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function CitationBlock({
	apa,
	bibtex,
	labels,
}: {
	apa: string;
	bibtex: string;
	labels: { citation: string; copy: string; copied: string };
}) {
	const [copied, setCopied] = useState<string | null>(null);

	const copy = async (format: string, value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(format);
			setTimeout(() => setCopied((current) => (current === format ? null : current)), 2000);
		} catch {
			// Le presse-papiers peut être refusé (contexte non sécurisé, permission) :
			// le texte reste sélectionnable à la main, inutile d'alerter.
		}
	};

	return (
		<section aria-labelledby="citation-heading">
			<h2 id="citation-heading" className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
				{labels.citation}
			</h2>

			<Tabs defaultValue="apa" className="mt-3">
				<TabsList className="h-8">
					<TabsTrigger value="apa" className="text-xs">
						APA
					</TabsTrigger>
					<TabsTrigger value="bibtex" className="text-xs">
						BibTeX
					</TabsTrigger>
				</TabsList>

				{[
					{ id: "apa", value: apa, mono: false },
					{ id: "bibtex", value: bibtex, mono: true },
				].map((format) => (
					<TabsContent key={format.id} value={format.id} className="mt-2">
						<div className="relative rounded-md border border-border bg-muted/40 p-3">
							<pre
								className={`overflow-x-auto whitespace-pre-wrap break-words pr-9 text-xs leading-relaxed ${
									format.mono ? "font-mono" : "font-sans"
								}`}
							>
								{format.value}
							</pre>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => copy(format.id, format.value)}
								aria-label={copied === format.id ? labels.copied : labels.copy}
								className="absolute right-1.5 top-1.5 h-7 w-7 p-0"
							>
								{copied === format.id ? (
									<Check className="h-3.5 w-3.5 text-openAccess" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
							</Button>
						</div>
					</TabsContent>
				))}
			</Tabs>
		</section>
	);
}
