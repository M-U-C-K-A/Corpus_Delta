import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: "*", allow: "/" },
		sitemap: absoluteUrl(siteConfig.url, "/sitemap.xml"),
	};
}
