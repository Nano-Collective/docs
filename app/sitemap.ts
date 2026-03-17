import type { MetadataRoute } from "next";
import { getDocPathsForVersion } from "@/lib/page-map-builder";
import { getAllProjects } from "@/lib/projects";
import { getVersions } from "@/lib/versions";

const BASE_URL = "https://docs.nanocollective.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  ];

  const projects = getAllProjects();

  for (const project of projects) {
    const versions = await getVersions(project.id, project.repo);

    for (const version of versions) {
      const paths = await getDocPathsForVersion(
        project.id,
        version,
        project.repo,
      );

      for (const slugPath of paths) {
        const slug = slugPath.length > 0 ? `/${slugPath.join("/")}` : "";
        urls.push({
          url: `${BASE_URL}/${project.id}/docs/${version}${slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  return urls;
}
