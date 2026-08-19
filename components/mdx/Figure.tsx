import Image from "next/image";

/**
 * Illustration avec provenance obligatoire.
 *
 * `credit` et `sourceUrl` ne sont pas optionnels : une figure sans auteur ni lien
 * vérifiable est indistinguable d'une image inventée, ce qui est exactement le
 * reproche fait à la version précédente du site.
 */
export function Figure({
	src,
	alt,
	caption,
	credit,
	sourceUrl,
	width = 1200,
	height = 675,
	priority = false,
}: {
	src: string;
	alt: string;
	caption?: string;
	credit: string;
	sourceUrl: string;
	width?: number;
	height?: number;
	priority?: boolean;
}) {
	return (
		<figure className="not-prose my-8">
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				sizes="(max-width: 768px) 100vw, 720px"
				className="w-full rounded-md border border-border"
			/>
			<figcaption className="mt-2 text-sm leading-relaxed text-muted-foreground">
				{caption && <span className="block text-foreground/80">{caption}</span>}
				<span className="mt-0.5 block text-xs">
					{credit} ·{" "}
					<a
						href={sourceUrl}
						target="_blank"
						rel="noreferrer"
						className="underline underline-offset-2 hover:text-foreground"
					>
						source
					</a>
				</span>
			</figcaption>
		</figure>
	);
}
