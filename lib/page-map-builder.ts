import type { Folder, MdxFile, PageMapItem } from "nextra";
import { fetchFileContent, getAllDocsFiles, type Repo } from "./github";

// Cache for page maps to avoid repeated API calls during build
// Map keyed by "projectId:version"
const pageMapCache = new Map<string, PageMapItem[]>();

/**
 * Convert file path to a display name
 */
function pathToDisplayName(filePath: string): string {
  const name =
    filePath
      .replace(/^docs\//, "")
      .replace(/\.(md|mdx)$/, "")
      .replace(/\/index$/, "")
      .split("/")
      .pop() || "index";

  // Convert kebab-case to Title Case
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build a pageMap for a specific version from remote GitHub files
 */
export async function buildPageMapForVersion(
  projectId: string,
  version: string,
  repo: Repo,
): Promise<PageMapItem[]> {
  // Check cache first
  const cacheKey = `${projectId}:${version}`;
  const cached = pageMapCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch all doc files from GitHub
  const files = await getAllDocsFiles(version, "docs", repo);

  if (files.length === 0) {
    return [];
  }

  // Build pageMap manually for remote content
  // Note: normalizePages expects items with 'title' property (not just frontMatter.title)
  const pageMap: PageMapItem[] = [];
  const folders = new Map<string, Folder<PageMapItem>>();

  for (const file of files) {
    // e.g., 'docs/guide/intro.md' -> 'guide/intro'
    const relativePath = file.replace(/^docs\//, "").replace(/\.(md|mdx)$/, "");

    const parts = relativePath.split("/");
    const isIndex = parts[parts.length - 1] === "index";
    const title = pathToDisplayName(file);

    if (isIndex && parts.length === 1) {
      // Root index file
      pageMap.unshift({
        name: "index",
        route: `/${projectId}/docs/${version}`,
        title: "Introduction",
        frontMatter: { title: "Introduction" },
      } as MdxFile & { title: string });
    } else if (isIndex) {
    } else if (parts.length === 1) {
      // Top-level file
      pageMap.push({
        name: parts[0],
        route: `/${projectId}/docs/${version}/${parts[0]}`,
        title,
        frontMatter: { title },
      } as MdxFile & { title: string });
    } else {
      // Nested file - create folder structure
      const folderPath = parts.slice(0, -1).join("/");
      let folder = folders.get(folderPath);

      if (!folder) {
        folder = {
          name: parts[parts.length - 2],
          route: `/${projectId}/docs/${version}/${folderPath}`,
          title: pathToDisplayName(parts[parts.length - 2]),
          children: [],
        } as Folder<PageMapItem> & { title: string };
        folders.set(folderPath, folder);
        pageMap.push(folder);
      }

      folder.children.push({
        name: parts[parts.length - 1],
        route: `/${projectId}/docs/${version}/${relativePath}`,
        title,
        frontMatter: { title },
      } as MdxFile & { title: string });
    }
  }

  // Cache the result
  pageMapCache.set(cacheKey, pageMap);

  return pageMap;
}

/**
 * Get all doc file paths for a version (for generating static params)
 */
export async function getDocPathsForVersion(
  _projectId: string,
  version: string,
  repo: Repo,
): Promise<string[][]> {
  const files = await getAllDocsFiles(version, "docs", repo);

  return files.map((file) => {
    // Convert 'docs/guide/intro.md' -> ['guide', 'intro']
    const relativePath = file.replace(/^docs\//, "").replace(/\.(md|mdx)$/, "");

    // Handle index files
    if (relativePath === "index" || relativePath.endsWith("/index")) {
      const parts = relativePath.replace(/\/?index$/, "").split("/");
      return parts.filter(Boolean);
    }

    return relativePath.split("/");
  });
}

/**
 * Convert a slug array to a file path
 */
export function slugToFilePath(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) {
    return "docs/index.md";
  }

  const path = slug.join("/");

  // Check for index files in subdirectories
  return `docs/${path}.md`;
}

/**
 * Try multiple file path variations to find the correct one
 */
export async function findDocFile(
  _projectId: string,
  version: string,
  slug: string[] | undefined,
  repo: Repo,
): Promise<string | null> {
  const basePath = slug?.length ? slug.join("/") : "index";

  // Try different file extensions and index patterns
  const variations = [
    `docs/${basePath}.md`,
    `docs/${basePath}.mdx`,
    `docs/${basePath}/index.md`,
    `docs/${basePath}/index.mdx`,
  ];

  for (const filePath of variations) {
    try {
      await fetchFileContent(version, filePath, repo);
      return filePath;
    } catch {
      // File doesn't exist, try next variation
    }
  }

  return null;
}

/**
 * Clear the page map cache
 */
export function clearPageMapCache(): void {
  pageMapCache.clear();
}
