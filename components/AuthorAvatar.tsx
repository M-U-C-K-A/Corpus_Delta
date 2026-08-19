"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthorAvatarProps {
	name: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeMap = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-12 w-12",
};

export function AuthorAvatar({ name, size = "md", className = "" }: AuthorAvatarProps) {
	// Generate Dicebear avatar URL based on the pseudo
	const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

	// Get initials for fallback
	const initials = name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<Avatar className={`${sizeMap[size]} ${className}`}>
			<AvatarImage src={avatarUrl} alt={name} />
			<AvatarFallback className="text-xs">{initials || "?"}</AvatarFallback>
		</Avatar>
	);
}
