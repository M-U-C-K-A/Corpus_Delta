import { getSortedArticlesData } from '@/lib/mdx';
import ArticlesClient from '@/components/ArticlesClient';

export default function ArticlesPage() {
  const articlesEn = getSortedArticlesData('en');
  const articlesFr = getSortedArticlesData('fr');

  const allArticles = [...articlesEn, ...articlesFr];

  return <ArticlesClient initialArticles={allArticles} />;
}
