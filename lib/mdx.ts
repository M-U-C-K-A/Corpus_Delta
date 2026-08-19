import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const articlesDirectory = path.join(process.cwd(), 'content/articles');

export interface ArticleData {
	slug: string;
	lang: string;
	content: string;
	title: string;
	description: string;
	image: string;
	date_created: string;
	views?: number;
	author: {
		name: string;
		email: string;
	};
	tags: string[];
	[key: string]: any;
}

export function getSortedArticlesData(lang: string) {
	const langDir = path.join(articlesDirectory, lang);

	if (!fs.existsSync(langDir)) {
		return [];
	}

	const fileNames = fs.readdirSync(langDir);
	const allArticles = fileNames.map((fileName) => {
		const slug = fileName.replace(/\.mdx$/, '');
		const fullPath = path.join(langDir, fileName);
		const fileContents = fs.readFileSync(fullPath, 'utf8');
		const { data, content } = matter(fileContents);

		return {
			slug,
			lang,
			...data,
			content, // We might not need the full content for the list, but useful.
		} as ArticleData;
	});

	return allArticles.sort((a, b) => {
		if (a.date_created < b.date_created) {
			return 1;
		} else {
			return -1;
		}
	});
}

export function getArticleData(lang: string, slug: string): ArticleData | null {
	const fullPath = path.join(articlesDirectory, lang, `${slug}.mdx`);
	if (!fs.existsSync(fullPath)) {
		return null;
	}
	const fileContents = fs.readFileSync(fullPath, 'utf8');
	const { data, content } = matter(fileContents);

	return {
		slug,
		lang,
		content,
		...data,
	} as ArticleData;
}
