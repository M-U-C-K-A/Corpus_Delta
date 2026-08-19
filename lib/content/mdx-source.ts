import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import type { Lang } from "@/lib/i18n/config";

export interface MdxEntry<T> {
	slug: string;
	lang: Lang;
	frontmatter: T;
	content: string;
}

function collectionDir(collection: string, lang: Lang): string {
	return path.join(process.cwd(), "content", collection, lang);
}

/**
 * Lit une collection MDX et valide chaque frontmatter.
 *
 * Une entrée invalide lève : mieux vaut un build rouge qu'une définition publiée
 * sans source ou un dossier sans date de mise à jour.
 */
export function readCollection<S extends z.ZodTypeAny>(
	collection: string,
	lang: Lang,
	schema: S
): MdxEntry<z.infer<S>>[] {
	const dir = collectionDir(collection, lang);
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".mdx"))
		.map((file) => {
			const slug = file.replace(/\.mdx$/, "");
			const raw = fs.readFileSync(path.join(dir, file), "utf8");
			const { data, content } = matter(raw);

			const parsed = schema.safeParse(data);
			if (!parsed.success) {
				throw new Error(
					`Frontmatter invalide : content/${collection}/${lang}/${file}\n${parsed.error.issues
						.map((i) => `  · ${i.path.join(".")} — ${i.message}`)
						.join("\n")}`
				);
			}

			return { slug, lang, frontmatter: parsed.data, content };
		});
}

export function readEntry<S extends z.ZodTypeAny>(
	collection: string,
	lang: Lang,
	slug: string,
	schema: S
): MdxEntry<z.infer<S>> | null {
	const file = path.join(collectionDir(collection, lang), `${slug}.mdx`);
	if (!fs.existsSync(file)) return null;

	const { data, content } = matter(fs.readFileSync(file, "utf8"));
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Frontmatter invalide : content/${collection}/${lang}/${slug}.mdx\n${parsed.error.issues
				.map((i) => `  · ${i.path.join(".")} — ${i.message}`)
				.join("\n")}`
		);
	}

	return { slug, lang, frontmatter: parsed.data, content };
}

/** Titres de niveau 2 et 3, pour le sommaire des dossiers. */
export function extractHeadings(content: string): { id: string; text: string; level: 2 | 3 }[] {
	const headings: { id: string; text: string; level: 2 | 3 }[] = [];
	// Les blocs de code peuvent contenir des lignes commençant par #, qu'il ne faut pas prendre pour des titres.
	const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "");

	for (const line of withoutCodeBlocks.split("\n")) {
		const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
		if (!match) continue;

		const level = match[1].length as 2 | 3;
		const text = match[2].replace(/[*_`]/g, "").trim();
		headings.push({ id: slugifyHeading(text), text, level });
	}

	return headings;
}

/** Reproduit l'identifiant produit par `rehype-slug`, pour que les ancres correspondent. */
function slugifyHeading(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
