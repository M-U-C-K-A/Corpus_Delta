import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const votesFilePath = path.join(process.cwd(), "data", "votes.json");

interface VotesData {
	articles: {
		[key: string]: {
			upvotes: number;
			downvotes: number;
			certified: boolean;
		};
	};
}

function getVotesData(): VotesData {
	try {
		if (!fs.existsSync(votesFilePath)) {
			return { articles: {} };
		}
		const data = fs.readFileSync(votesFilePath, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading votes file:", error);
		return { articles: {} };
	}
}

function saveVotesData(data: VotesData): void {
	try {
		fs.writeFileSync(votesFilePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Error saving votes file:", error);
	}
}

// GET - Retrieve all votes or votes for a specific article
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const lang = searchParams.get("lang");
	const slug = searchParams.get("slug");

	const votesData = getVotesData();

	if (lang && slug) {
		const articleKey = `${lang}/${slug}`;
		const articleVotes = votesData.articles[articleKey] || {
			upvotes: 0,
			downvotes: 0,
			certified: false,
		};
		return NextResponse.json(articleVotes);
	}

	return NextResponse.json(votesData);
}

// POST - Submit a vote
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { articleSlug, lang, voteType, previousVote } = body;

		if (!articleSlug || !lang) {
			return NextResponse.json(
				{ error: "Missing articleSlug or lang" },
				{ status: 400 }
			);
		}

		const votesData = getVotesData();
		const articleKey = `${lang}/${articleSlug}`;

		if (!votesData.articles[articleKey]) {
			votesData.articles[articleKey] = {
				upvotes: 0,
				downvotes: 0,
				certified: false,
			};
		}

		const articleVotes = votesData.articles[articleKey];

		// Handle vote removal
		if (voteType === "remove") {
			if (previousVote === "up") {
				articleVotes.upvotes = Math.max(0, articleVotes.upvotes - 1);
			} else if (previousVote === "down") {
				articleVotes.downvotes = Math.max(0, articleVotes.downvotes - 1);
			}
		} else {
			// Remove previous vote if changing vote type
			if (previousVote === "up") {
				articleVotes.upvotes = Math.max(0, articleVotes.upvotes - 1);
			} else if (previousVote === "down") {
				articleVotes.downvotes = Math.max(0, articleVotes.downvotes - 1);
			}

			// Add new vote
			if (voteType === "up") {
				articleVotes.upvotes += 1;
			} else if (voteType === "down") {
				articleVotes.downvotes += 1;
			}
		}

		saveVotesData(votesData);

		return NextResponse.json({
			success: true,
			votes: articleVotes,
		});
	} catch (error) {
		console.error("Error processing vote:", error);
		return NextResponse.json(
			{ error: "Failed to process vote" },
			{ status: 500 }
		);
	}
}
