"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Bold, Italic, Underline, Code, List, Heading1, Heading2, Quote,
	Link2, ImageIcon, FileCode, HelpCircle, Download, Github,
	ChevronRight, AlertTriangle, CheckCircle2
} from "lucide-react";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// XSS Sanitization function
function sanitizeForMDX(content: string): string {
	// Remove potentially dangerous patterns
	return content
		// Remove script tags
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		// Remove onclick and other event handlers
		.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
		// Remove javascript: URLs
		.replace(/javascript:/gi, '')
		// Remove data: URLs that could be dangerous
		.replace(/data:\s*text\/html/gi, '')
		// Remove iframe tags
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
		// Remove object/embed tags
		.replace(/<(object|embed)[^>]*>/gi, '');
}

// Sanitize metadata to prevent XSS
function sanitizeMetadata(value: string): string {
	return value
		.replace(/"/g, '\\"')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

export default function EditorPage() {
	const [content, setContent] = useState("# My New Article\n\nStart writing here...");
	const [meta, setMeta] = useState({
		title: "",
		pseudo: "",
		description: "",
		image: "",
		lang: "en",
	});
	const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
	const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("write");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const insertFormat = (startTag: string, endTag: string = "") => {
		if (!textareaRef.current) return;

		const start = textareaRef.current.selectionStart;
		const end = textareaRef.current.selectionEnd;
		const text = textareaRef.current.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end);
		const after = text.substring(end);

		const newContent = before + startTag + selection + endTag + after;
		setContent(newContent);

		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus();
				textareaRef.current.setSelectionRange(start + startTag.length, end + startTag.length);
			}
		}, 0);
	};

	const handleToolbarClick = (action: string) => {
		switch (action) {
			case "bold":
				insertFormat("**", "**");
				break;
			case "italic":
				insertFormat("_", "_");
				break;
			case "underline":
				insertFormat("<u>", "</u>");
				break;
			case "code":
				insertFormat("`", "`");
				break;
			case "h1":
				insertFormat("# ", "");
				break;
			case "h2":
				insertFormat("## ", "");
				break;
			case "list":
				insertFormat("- ", "");
				break;
			case "quote":
				insertFormat("> ", "");
				break;
			case "link":
				insertFormat("[", "](https://url)");
				break;
			case "image":
				insertFormat("![alt text](", ")");
				break;
			case "codeblock":
				insertFormat("```\n", "\n```");
				break;
		}
	};

	const handleDownloadAndSubmit = () => {
		// Sanitize content and metadata before generating file
		const sanitizedContent = sanitizeForMDX(content);
		const sanitizedMeta = {
			title: sanitizeMetadata(meta.title),
			pseudo: sanitizeMetadata(meta.pseudo),
			description: sanitizeMetadata(meta.description),
			image: sanitizeMetadata(meta.image),
			lang: meta.lang,
		};

		const frontmatter = `---
title: "${sanitizedMeta.title}"
description: "${sanitizedMeta.description}"
image: "${sanitizedMeta.image}"
author:
  name: "${sanitizedMeta.pseudo}"
date_created: "${Math.floor(Date.now() / 1000)}"
tags: []
---

`;
		const fullContent = frontmatter + sanitizedContent;
		const blob = new Blob([fullContent], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${sanitizedMeta.title.toLowerCase().replace(/\s+/g, "-") || "article"}.mdx`;
		a.click();
		URL.revokeObjectURL(url);
		setIsSubmitDialogOpen(true);
	};

	const isFormValid = meta.title.trim() !== "" && meta.pseudo.trim() !== "" && meta.description.trim() !== "";

	return (
		<TooltipProvider>
			<Header />
			<div className="container mx-auto py-10 mt-20">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
					<div>
						<h1 className="text-3xl font-bold">Write an Article</h1>
						<p className="text-muted-foreground">Contribute to the climate knowledge base</p>
					</div>
					<div className="flex items-center gap-2">
						{/* Help Button */}
						<Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
							<DialogTrigger asChild>
								<Button variant="outline" size="icon">
									<HelpCircle className="h-4 w-4" />
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl max-h-[80vh]">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<HelpCircle className="h-5 w-5" />
										How to Submit an Article
									</DialogTitle>
									<DialogDescription>
										Learn how the collaborative publishing process works
									</DialogDescription>
								</DialogHeader>
								<ScrollArea className="max-h-[60vh] pr-4">
									<div className="space-y-6">
										{/* Step 1 */}
										<Card>
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">Step 1</Badge>
													<CardTitle className="text-lg">Write Your Article</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="text-sm text-muted-foreground">
												<ul className="list-disc list-inside space-y-1">
													<li>Fill in the metadata (title, pseudo, description)</li>
													<li>Write your content using the toolbar or raw MDX</li>
													<li>Preview your article in real-time</li>
												</ul>
											</CardContent>
										</Card>

										{/* Step 2 */}
										<Card>
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">Step 2</Badge>
													<CardTitle className="text-lg">Download & Submit</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="text-sm text-muted-foreground">
												<ul className="list-disc list-inside space-y-1">
													<li>Click the &quot;Download &amp; Submit&quot; button</li>
													<li>An .mdx file will be downloaded to your computer</li>
													<li>Follow the GitHub instructions in the popup</li>
												</ul>
											</CardContent>
										</Card>

										{/* Step 3 */}
										<Card>
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">Step 3</Badge>
													<CardTitle className="text-lg">Create a Pull Request</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="text-sm text-muted-foreground">
												<ul className="list-disc list-inside space-y-1">
													<li>Go to the GitHub repository</li>
													<li>Upload your .mdx file to <code className="bg-muted px-1 rounded">content/articles/{"{lang}"}</code></li>
													<li>Create a new branch and submit a Pull Request</li>
												</ul>
											</CardContent>
										</Card>

										{/* Step 4 */}
										<Card>
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">Step 4</Badge>
													<CardTitle className="text-lg">Peer Review</CardTitle>
												</div>
											</CardHeader>
											<CardContent className="text-sm text-muted-foreground">
												<ul className="list-disc list-inside space-y-1">
													<li>Maintainers will review your article</li>
													<li>They may suggest changes or approve directly</li>
													<li>Once merged, your article goes live!</li>
												</ul>
											</CardContent>
										</Card>

										<Alert>
											<CheckCircle2 className="h-4 w-4" />
											<AlertTitle>Open Source!</AlertTitle>
											<AlertDescription>
												All articles are open source and can be improved by the community through Pull Requests.
											</AlertDescription>
										</Alert>
									</div>
								</ScrollArea>
								<DialogFooter>
									<Button onClick={() => setIsHelpDialogOpen(false)}>Got it!</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Submit Button */}
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Button
										onClick={handleDownloadAndSubmit}
										disabled={!isFormValid}
										className="gap-2"
									>
										<Download className="h-4 w-4" />
										Download &amp; Submit
									</Button>
								</span>
							</TooltipTrigger>
							{!isFormValid && (
								<TooltipContent>
									<p>Please fill in title, pseudo, and description</p>
								</TooltipContent>
							)}
						</Tooltip>
					</div>
				</div>

				{/* Submit Dialog */}
				<Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-green-500" />
								Article Downloaded!
							</DialogTitle>
							<DialogDescription>
								Your MDX file has been generated. Follow these steps to publish:
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<Badge className="mt-0.5">1</Badge>
									<div>
										<p className="font-medium">Open GitHub</p>
										<Link
											href={`https://github.com/M-U-C-K-A/projet-climat/tree/main/content/articles/${meta.lang}`}
											target="_blank"
											className="text-sm text-primary hover:underline flex items-center gap-1"
										>
											<Github className="h-3 w-3" />
											Go to repository ({meta.lang})
											<ChevronRight className="h-3 w-3" />
										</Link>
									</div>
								</div>
								<Separator />
								<div className="flex items-start gap-3">
									<Badge className="mt-0.5">2</Badge>
									<div>
										<p className="font-medium">Upload your file</p>
										<p className="text-sm text-muted-foreground">
											Click <strong>Add file</strong> → <strong>Upload files</strong>
										</p>
									</div>
								</div>
								<Separator />
								<div className="flex items-start gap-3">
									<Badge className="mt-0.5">3</Badge>
									<div>
										<p className="font-medium">Drag and drop</p>
										<p className="text-sm text-muted-foreground">
											Upload <code className="bg-muted px-1 rounded text-xs">{meta.title.toLowerCase().replace(/\s+/g, "-") || "article"}.mdx</code>
										</p>
									</div>
								</div>
								<Separator />
								<div className="flex items-start gap-3">
									<Badge className="mt-0.5">4</Badge>
									<div>
										<p className="font-medium">Create Pull Request</p>
										<p className="text-sm text-muted-foreground">
											Select &quot;Create a new branch&quot; then &quot;Propose changes&quot;
										</p>
									</div>
								</div>
							</div>
							<Alert variant="default" className="bg-muted">
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription className="text-sm">
									Your article will be reviewed by peers before publication.
								</AlertDescription>
							</Alert>
						</div>
						<DialogFooter className="gap-2">
							<Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
								Close
							</Button>
							<Button asChild>
								<Link href={`https://github.com/M-U-C-K-A/projet-climat/tree/main/content/articles/${meta.lang}`} target="_blank">
									<Github className="h-4 w-4 mr-2" />
									Open GitHub
								</Link>
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Main Content */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="h-[75vh]">
					<TabsList className="mb-4">
						<TabsTrigger value="write">Write</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
						<TabsTrigger value="split" className="hidden md:flex">Split View</TabsTrigger>
					</TabsList>

					<TabsContent value="write" className="h-full">
						<div className="grid grid-cols-1 gap-4 h-full">
							<EditorPanel
								meta={meta}
								setMeta={setMeta}
								content={content}
								setContent={setContent}
								textareaRef={textareaRef}
								handleToolbarClick={handleToolbarClick}
							/>
						</div>
					</TabsContent>

					<TabsContent value="preview" className="h-full">
						<PreviewPanel meta={meta} content={content} />
					</TabsContent>

					<TabsContent value="split" className="h-full">
						<div className="grid grid-cols-2 gap-4 h-full">
							<EditorPanel
								meta={meta}
								setMeta={setMeta}
								content={content}
								setContent={setContent}
								textareaRef={textareaRef}
								handleToolbarClick={handleToolbarClick}
							/>
							<PreviewPanel meta={meta} content={content} />
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</TooltipProvider>
	);
}

// Editor Panel Component
function EditorPanel({
	meta,
	setMeta,
	content,
	setContent,
	textareaRef,
	handleToolbarClick
}: {
	meta: { title: string; pseudo: string; description: string; image: string; lang: string };
	setMeta: React.Dispatch<React.SetStateAction<typeof meta>>;
	content: string;
	setContent: React.Dispatch<React.SetStateAction<string>>;
	textareaRef: React.RefObject<HTMLTextAreaElement>;
	handleToolbarClick: (action: string) => void;
}) {
	return (
		<div className="flex flex-col gap-4 h-full">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-lg">Metadata</CardTitle>
					<CardDescription>Information about your article</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								placeholder="Article Title"
								value={meta.title}
								onChange={(e) => setMeta({ ...meta, title: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="pseudo">Pseudo *</Label>
							<div className="flex items-center gap-3">
								<Input
									id="pseudo"
									placeholder="Your Pseudonym"
									value={meta.pseudo}
									onChange={(e) => setMeta({ ...meta, pseudo: e.target.value })}
									className="flex-1"
								/>
								{meta.pseudo && <AuthorAvatar name={meta.pseudo} size="lg" />}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="image">Cover Image URL</Label>
							<Input
								id="image"
								placeholder="/images/cover.jpg or https://..."
								value={meta.image}
								onChange={(e) => setMeta({ ...meta, image: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lang">Language</Label>
							<Select value={meta.lang} onValueChange={(val) => setMeta({ ...meta, lang: val })}>
								<SelectTrigger>
									<SelectValue placeholder="Select Language" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="desc">Description *</Label>
						<Input
							id="desc"
							placeholder="Short description of your article"
							value={meta.description}
							onChange={(e) => setMeta({ ...meta, description: e.target.value })}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="flex-1 flex flex-col min-h-0">
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">Content</CardTitle>
						<Badge variant="outline">MDX</Badge>
					</div>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col gap-2 min-h-0">
					<div className="flex items-center gap-2 border rounded-md p-2 bg-muted/50 overflow-x-auto">
						<ToggleGroup type="multiple" variant="outline" size="sm">
							<ToggleGroupItem value="bold" aria-label="Bold" onClick={() => handleToolbarClick('bold')}>
								<Bold className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="italic" aria-label="Italic" onClick={() => handleToolbarClick('italic')}>
								<Italic className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="underline" aria-label="Underline" onClick={() => handleToolbarClick('underline')}>
								<Underline className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="code" aria-label="Code" onClick={() => handleToolbarClick('code')}>
								<Code className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="h1" aria-label="Heading 1" onClick={() => handleToolbarClick('h1')}>
								<Heading1 className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="h2" aria-label="Heading 2" onClick={() => handleToolbarClick('h2')}>
								<Heading2 className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="list" aria-label="List" onClick={() => handleToolbarClick('list')}>
								<List className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="quote" aria-label="Quote" onClick={() => handleToolbarClick('quote')}>
								<Quote className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="link" aria-label="Link" onClick={() => handleToolbarClick('link')}>
								<Link2 className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="image" aria-label="Image" onClick={() => handleToolbarClick('image')}>
								<ImageIcon className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="codeblock" aria-label="Code Block" onClick={() => handleToolbarClick('codeblock')}>
								<FileCode className="h-4 w-4" />
							</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<Textarea
						ref={textareaRef}
						className="flex-1 font-mono resize-none p-4 min-h-[300px]"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Write your article in MDX..."
					/>
				</CardContent>
			</Card>
		</div>
	);
}

// Preview Panel Component
function PreviewPanel({
	meta,
	content
}: {
	meta: { title: string; pseudo: string; description: string; image: string; lang: string };
	content: string;
}) {
	return (
		<Card className="h-full overflow-hidden">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg">Preview</CardTitle>
			</CardHeader>
			<CardContent className="h-full overflow-y-auto">
				<ScrollArea className="h-[calc(100%-2rem)]">
					<div className="prose dark:prose-invert max-w-none">
						{meta.image && (
							<img src={meta.image} alt="Cover" className="w-full h-48 object-cover rounded-md mb-4" />
						)}
						<h1>{meta.title || "Untitled Article"}</h1>
						<p className="text-muted-foreground italic">{meta.description}</p>
						<div className="flex gap-2 mb-4 items-center not-prose">
							<Badge variant="outline">{meta.lang.toUpperCase()}</Badge>
							{meta.pseudo && (
								<div className="flex items-center gap-2">
									<AuthorAvatar name={meta.pseudo} size="sm" />
									<span className="text-sm text-muted-foreground">By {meta.pseudo}</span>
								</div>
							)}
						</div>
						<Separator className="my-4" />
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{content}
						</ReactMarkdown>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
