"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Header } from '@/components/Header';
import NextLink from 'next/link';
import { ArticleData } from '@/lib/mdx';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { VoteScore } from '@/components/VoteButtons';
import { Award } from 'lucide-react';

interface ArticlesClientProps {
	initialArticles: ArticleData[];
}

interface VotesData {
	articles: {
		[key: string]: {
			upvotes: number;
			downvotes: number;
			certified: boolean;
		};
	};
}

const formatDate = (timestamp: string): string => {
	const date = new Date(parseInt(timestamp) * 1000);
	return format(date, 'dd MMMM yyyy');
};

const ArticlesClient = ({ initialArticles }: ArticlesClientProps) => {
	const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [votes, setVotes] = useState<VotesData>({ articles: {} });

	// Fetch votes data
	useEffect(() => {
		const fetchVotes = async () => {
			try {
				const res = await fetch('/api/votes');
				const data = await res.json();
				setVotes(data);
			} catch (error) {
				console.error('Failed to fetch votes:', error);
			}
		};
		fetchVotes();
	}, []);

	const allArticles = selectedLanguage === 'all'
		? initialArticles
		: initialArticles.filter(article => article.lang === selectedLanguage);

	const tags = Array.from(new Set(initialArticles.flatMap(article => article.tags || [])));

	const handleTagClick = (tag: string) => {
		setSelectedTags(prevTags =>
			prevTags.includes(tag)
				? prevTags.filter(t => t !== tag)
				: [...prevTags, tag]
		);
	};

	const handleReset = () => {
		setSelectedLanguage('all');
		setSelectedTags([]);
		setSearchTerm('');
	};

	const filteredArticles = allArticles.filter(article => {
		const matchesTags = selectedTags.length === 0 || (article.tags && selectedTags.every(tag => article.tags.includes(tag)));
		const matchesSearchTerm = article.title.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesTags && matchesSearchTerm;
	});

	const filteredArticlesCount = filteredArticles.length;

	const getArticleVotes = (lang: string, slug: string) => {
		const key = `${lang}/${slug}`;
		return votes.articles[key] || { upvotes: 0, downvotes: 0, certified: false };
	};

	return (
		<>
			<Header />
			<ResizablePanelGroup direction="horizontal" className="min-h-screen gap-4">
				<ResizablePanel defaultSize={22}>
					<div className="flex flex-col gap-4 m-5 mt-24 sticky max-w-sm mx-auto">
						<Input
							type="text"
							placeholder="Search articles..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value)}>
							<SelectTrigger>
								<SelectValue placeholder="Select a language" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Language</SelectLabel>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<Button
							onClick={handleReset}
						>
							Reset Settings
						</Button>
						<div className="flex gap-2 flex-wrap">
							{tags.map((tag, index) => (
								<Badge
									className='cursor-pointer'
									key={index}
									onClick={() => handleTagClick(tag)}
									variant={selectedTags.includes(tag) ? 'secondary' : 'default'}
								>
									{tag}
								</Badge>
							))}
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle aria-label='resize this window' />
				<ResizablePanel defaultSize={78} minSize={65}>
					<div className="container mx-auto">
						<div className="flex gap-2 flex-col mt-20">
							<h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
								Our articles!
							</h2>
							<div className='flex justify-between'>
								<p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
									Community-driven articles about climate change and sustainability
								</p>
								<p>
									{filteredArticlesCount} {filteredArticlesCount === 1 ? 'article found' : 'articles found'}
								</p>
							</div>
						</div>
						{filteredArticlesCount === 0 ? (
							<p className="text-center text-lg mt-4">No articles found.</p>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
								{filteredArticles.map((article, index) => {
									const articleVotes = getArticleVotes(article.lang, article.slug);
									return (
										<NextLink
											href={`/articles/${article.lang}/${article.slug}`}
											key={index}
											passHref
											className="flex flex-col gap-2 border border-card-background rounded-md p-4 hover:border-primary/50 transition-colors">
											<div className="bg-muted rounded-md aspect-video mb-2 relative overflow-hidden">
												<img src={`/${article.image}`} alt="" className='aspect-video object-cover w-full h-full' />
												{articleVotes.certified && (
													<div className="absolute top-2 right-2">
														<Badge className="gap-1 bg-green-500 text-white">
															<Award className="h-3 w-3" />
															Certified
														</Badge>
													</div>
												)}
											</div>
											<div className='w-full flex justify-between items-start'>
												<h3 className="text-xl tracking-tight font-medium">{article.title}</h3>
												<Badge variant="outline">{formatDate(article.date_created)}</Badge>
											</div>
											<p className="text-muted-foreground text-base line-clamp-2">
												{article.description}
											</p>
											<div className="flex justify-between items-center text-sm mt-auto pt-2 border-t">
												<div className="flex items-center gap-2">
													<AuthorAvatar name={article.author.name} size="sm" />
													<span className="text-muted-foreground">{article.author.name}</span>
												</div>
												<VoteScore
													upvotes={articleVotes.upvotes}
													downvotes={articleVotes.downvotes}
													certified={articleVotes.certified}
												/>
											</div>
										</NextLink>
									);
								})}
							</div>
						)}
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</>
	);
};

export default ArticlesClient;
