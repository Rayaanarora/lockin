import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://lockin.top",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: "https://lockin.top/recap",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];
}
