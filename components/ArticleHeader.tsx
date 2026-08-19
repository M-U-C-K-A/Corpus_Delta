"use client";

import { useEffect, useState } from "react";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { VoteButtons } from "@/components/VoteButtons";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ArticleHeaderProps {
	slug: string;
	lang: string;
	authorName: string;
	dateCreated: string;
	tags?: string[];
}

export function ArticleHeader({ slug, lang, authorName, dateCreated, tags }: ArticleHeaderProps) {
	const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0, certified: false });

	useEffect(() => {
		const fetchVotes = async () => {
			try {
				const res = await fetch(`/api/votes?lang=${lang}&slug=${slug}`);
				const data = await res.json();
				setVotes(data);
			} catch (error) {
				console.error("Failed to fetch votes:", error);
			}
		};
		fetchVotes();
	}, [lang, slug]);

	const formatDate = (timestamp: string): string => {
		const date = new Date(parseInt(timestamp) * 1000);
		return format(date, "dd MMMM yyyy");
	};

	return (
		<div className="flex flex-col gap-4 not-prose border-b pb-4 mb-6">
			<div className="flex flex-wrap items-center gap-4 justify-between">
				<div className="flex items-center gap-3">
					<AuthorAvatar name={authorName} size="lg" />
					<div>
						<p className="font-medium">{authorName}</p>
						<p className="text-sm text-muted-foreground">{formatDate(dateCreated)}</p>
					</div>
				</div>
				<VoteButtons
					articleSlug={slug}
					lang={lang}
					initialUpvotes={votes.upvotes}
					initialDownvotes={votes.downvotes}
					certified={votes.certified}
				/>
			</div>
			{tags && tags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{tags.map((tag, index) => (
						<Badge key={index} variant="secondary">{tag}</Badge>
					))}
				</div>
			)}
		</div>
	);
}
