import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { getArticleData } from "@/lib/mdx";
import { notFound } from "next/navigation";
import { HistoricalEmissionsChart, HistoricalEmissionsTable } from "@/components/articles/visualizations/HistoricalEmissions";
import { SectoralEmissionsChart, SectoralEmissionsTable } from "@/components/articles/visualizations/SectoralEmissions";
import { ArticleHeader } from "@/components/ArticleHeader";

// Map of components available in MDX files
const components = {
  HistoricalEmissionsChart,
  HistoricalEmissionsTable,
  SectoralEmissionsChart,
  SectoralEmissionsTable,
};

interface DocPageProps {
  params: {
    lang: string;
    slug: string[];
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const slug = params.slug.join("-");

  // Fetch article data using our new lib/mdx utility
  const article = getArticleData(params.lang, slug);

  if (!article) {
    return (
      <div className="flex items-center justify-center gap-4 m-auto w-full">
        <div className="mt-20">
          <h1 className="text-balance max-w-md text-6xl">Sorry! This article isn&apos;t available</h1>
          <p>The page you were looking for couldn&apos;t be found</p>
          <p className="text-muted-foreground mt-10">
            Go back to the <a href="/" className="text-destructive">home page</a> or visit our
            <a href="/" className="text-destructive"> Help Center</a>.
          </p>
        </div>
        <div className="max-w-xl">
          <img src="/not-found.gif" alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative prose dark:prose-invert w-full min-w-full py-6 lg:gap-10 lg:py-8 flex">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-4 flex items-center space-x-1 text-sm leading-none text-muted-foreground">
          <div className="truncate"><Link href="/articles">Articles</Link></div>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <div className="text-foreground">{article.title}</div>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className={cn("scroll-m-20 text-3xl font-bold tracking-tight")}>
            {article.title}
          </h1>
          {article.description && (
            <p className="text-base text-muted-foreground">{article.description}</p>
          )}
        </div>

        <ArticleHeader
          slug={slug}
          lang={params.lang}
          authorName={article.author?.name || "Anonymous"}
          dateCreated={article.date_created}
          tags={article.tags}
        />

        <div className="pb-12">
          <MDXRemote source={article.content} components={components} />
        </div>
      </div>
    </div>
  );
}
