"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Award } from "lucide-react";

interface VoteButtonsProps {
	articleSlug: string;
	lang: string;
	initialUpvotes?: number;
	initialDownvotes?: number;
	certified?: boolean;
	size?: "sm" | "md";
}

export function VoteButtons({
	articleSlug,
	lang,
	initialUpvotes = 0,
	initialDownvotes = 0,
	certified = false,
	size = "md",
}: VoteButtonsProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes);
	const [downvotes, setDownvotes] = useState(initialDownvotes);
	const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const storageKey = `vote-${lang}-${articleSlug}`;

	// Load user's previous vote from localStorage
	useEffect(() => {
		const savedVote = localStorage.getItem(storageKey);
		if (savedVote === "up" || savedVote === "down") {
			setUserVote(savedVote);
		}
	}, [storageKey]);

	const handleVote = async (voteType: "up" | "down") => {
		if (isLoading) return;

		setIsLoading(true);

		// If user already voted the same way, remove the vote
		if (userVote === voteType) {
			if (voteType === "up") {
				setUpvotes((prev) => Math.max(0, prev - 1));
			} else {
				setDownvotes((prev) => Math.max(0, prev - 1));
			}
			setUserVote(null);
			localStorage.removeItem(storageKey);
		} else {
			// If user previously voted differently, swap the vote
			if (userVote === "up") {
				setUpvotes((prev) => Math.max(0, prev - 1));
			} else if (userVote === "down") {
				setDownvotes((prev) => Math.max(0, prev - 1));
			}

			// Add the new vote
			if (voteType === "up") {
				setUpvotes((prev) => prev + 1);
			} else {
				setDownvotes((prev) => prev + 1);
			}

			setUserVote(voteType);
			localStorage.setItem(storageKey, voteType);
		}

		// Try to persist to API (fire and forget)
		try {
			await fetch("/api/votes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					articleSlug,
					lang,
					voteType: userVote === voteType ? "remove" : voteType,
					previousVote: userVote,
				}),
			});
		} catch (error) {
			console.error("Failed to persist vote:", error);
		}

		setIsLoading(false);
	};

	const score = upvotes - downvotes;
	const isSmall = size === "sm";

	return (
		<div className={`flex items-center gap-2 ${isSmall ? "text-sm" : ""}`}>
			<div className="flex items-center gap-1">
				<Button
					variant={userVote === "up" ? "default" : "ghost"}
					size={isSmall ? "sm" : "default"}
					className={`${isSmall ? "h-7 w-7 p-0" : "h-9 w-9 p-0"}`}
					onClick={() => handleVote("up")}
					disabled={isLoading}
				>
					<ThumbsUp className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
				</Button>
				<span
					className={`font-medium min-w-[2rem] text-center ${score > 0 ? "text-green-600 dark:text-green-400" : score < 0 ? "text-red-600 dark:text-red-400" : ""
						}`}
				>
					{score}
				</span>
				<Button
					variant={userVote === "down" ? "destructive" : "ghost"}
					size={isSmall ? "sm" : "default"}
					className={`${isSmall ? "h-7 w-7 p-0" : "h-9 w-9 p-0"}`}
					onClick={() => handleVote("down")}
					disabled={isLoading}
				>
					<ThumbsDown className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
				</Button>
			</div>

			{certified && (
				<Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
					<Award className="h-3 w-3" />
					Certified
				</Badge>
			)}
		</div>
	);
}

// Lightweight display-only version for article cards
export function VoteScore({
	upvotes = 0,
	downvotes = 0,
	certified = false,
}: {
	upvotes?: number;
	downvotes?: number;
	certified?: boolean;
}) {
	const score = upvotes - downvotes;

	return (
		<div className="flex items-center gap-2 text-sm">
			<span
				className={`font-medium ${score > 0 ? "text-green-600 dark:text-green-400" : score < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
					}`}
			>
				{score > 0 ? `+${score}` : score} pts
			</span>
			{certified && (
				<Badge variant="secondary" className="gap-1 h-5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
					<Award className="h-2.5 w-2.5" />
					Certified
				</Badge>
			)}
		</div>
	);
}
