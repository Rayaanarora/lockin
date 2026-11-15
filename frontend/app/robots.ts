import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/recap"],
        disallow: ["/api/", "/reset-password"]
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "PerplexityBot",
          "Google-Extended",
          "ClaudeBot",
          "Applebot",
          "Twitterbot",
          "facebookexternalhit"
        ],
        allow: ["/", "/recap", "/llms.txt"]
      }
    ],
    sitemap: "https://lockin.top/sitemap.xml"
  };
}
