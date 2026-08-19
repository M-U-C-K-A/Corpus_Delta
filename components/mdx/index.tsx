import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Callout } from "@/components/mdx/Callout";
import { Chart } from "@/components/mdx/Chart";
import { Cite } from "@/components/mdx/Cite";
import { DataTable } from "@/components/mdx/DataTable";
import { Figure } from "@/components/mdx/Figure";
import { Term } from "@/components/mdx/Term";
import type { Lang } from "@/lib/i18n/config";

/**
 * Composants disponibles dans les fichiers MDX.
 *
 * La langue est injectée ici plutôt que répétée dans chaque appel : un auteur
 * écrit `<Chart dataset="…" />` sans avoir à se soucier de l'internationalisation.
 */
function componentsFor(lang: Lang) {
	return {
		Callout,
		Figure,
		Chart: (props: Omit<React.ComponentProps<typeof Chart>, "lang">) => <Chart {...props} lang={lang} />,
		DataTable: (props: Omit<React.ComponentProps<typeof DataTable>, "lang">) => (
			<DataTable {...props} lang={lang} />
		),
		Cite: (props: Omit<React.ComponentProps<typeof Cite>, "lang">) => <Cite {...props} lang={lang} />,
		Term: (props: Omit<React.ComponentProps<typeof Term>, "lang">) => <Term {...props} lang={lang} />,
		// Les liens sortants s'ouvrent dans un nouvel onglet et sont signalés comme tels.
		a: ({ href, children, ...rest }: React.ComponentProps<"a">) => {
			const external = href?.startsWith("http");
			return (
				<a
					href={href}
					{...(external ? { target: "_blank", rel: "noreferrer" } : {})}
					{...rest}
				>
					{children}
				</a>
			);
		},
	};
}

export function MdxContent({ source, lang }: { source: string; lang: Lang }) {
	return (
		<MDXRemote
			source={source}
			components={componentsFor(lang)}
			options={{
				mdxOptions: {
					// GFM était actif dans l'ancien éditeur mais absent du rendu final :
					// les tableaux ne s'affichaient donc pas comme dans la prévisualisation.
					remarkPlugins: [remarkGfm, remarkMath],
					rehypePlugins: [
						rehypeSlug,
						rehypeKatex,
						[rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: "no-underline" } }],
					],
				},
			}}
		/>
	);
}
