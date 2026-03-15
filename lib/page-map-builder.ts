import type { Folder, MdxFile, PageMapItem } from "nextra";
import { fetchFileContent, getAllDocsFiles, type Repo } from "./github";
import { type PageFrontmatter, parseFrontmatter } from "./remote-content";

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

  // Fetch frontmatter for each file in parallel
  const fileFrontmatter = new Map<string, PageFrontmatter>();
  await Promise.all(
    files.map(async (file) => {
      try {
        // Only fetch first ~50 lines to extract frontmatter (reduces API calls)
        const content = await fetchFileContent(version, file, repo);
        const partialContent = content.slice(0, 2000);
        const fm = parseFrontmatter(partialContent);
        fileFrontmatter.set(file, fm);
      } catch {
        // If we can't fetch the file, use empty frontmatter
        fileFrontmatter.set(file, {});
      }
    }),
  );

  // Build pageMap manually for remote content
  // Note: normalizePages expects items with 'title' property (not just frontMatter.title)
  const pageMap: PageMapItem[] = [];
  const folders = new Map<string, Folder<PageMapItem>>();

  for (const file of files) {
    const fm = fileFrontmatter.get(file) || {};

    // Skip hidden pages
    if (fm.hidden) {
      continue;
    }

    // e.g., 'docs/guide/intro.md' -> 'guide/intro'
    const relativePath = file.replace(/^docs\//, "").replace(/\.(md|mdx)$/, "");

    const parts = relativePath.split("/");
    const isIndex = parts[parts.length - 1] === "index";
    // Use frontmatter title, fallback to path-based title
    const title = fm.title || pathToDisplayName(file);

    if (isIndex && parts.length === 1) {
      // Root index file
      pageMap.unshift({
        name: "index",
        route: `/${projectId}/docs/${version}`,
        title: "Introduction",
        frontMatter: { title: "Introduction" },
      } as MdxFile & { title: string });
    } else if (!isIndex && parts.length === 1) {
      // Top-level file
      pageMap.push({
        name: parts[0],
        route: `/${projectId}/docs/${version}/${parts[0]}`,
        title,
        frontMatter: { title, ...fm },
      } as MdxFile & { title: string });
    } else if (!isIndex) {
      // Nested file - create folder structure
      const folderPath = parts.slice(0, -1).join("/");
      let folder = folders.get(folderPath);

      if (!folder) {
        // Check if folder has frontmatter (from index file)
        const folderIndexPath = `docs/${folderPath}/index.md`;
        const folderFm = fileFrontmatter.get(folderIndexPath) || {};
        const folderTitle =
          folderFm.title || pathToDisplayName(parts[parts.length - 2]);

        folder = {
          name: parts[parts.length - 2],
          route: `/${projectId}/docs/${version}/${folderPath}`,
          title: folderTitle,
          children: [],
        } as Folder<PageMapItem> & { title: string };
        folders.set(folderPath, folder);
        pageMap.push(folder);
      }

      folder.children.push({
        name: parts[parts.length - 1],
        route: `/${projectId}/docs/${version}/${relativePath}`,
        title,
        frontMatter: { title, ...fm },
      } as MdxFile & { title: string });
    }
  }

  // Sort top-level items and folder children by sidebar_order
  const getSidebarOrder = (item: PageMapItem): number => {
    // Only MdxFile items have frontMatter with sidebar_order
    const fm = (item as unknown as { frontMatter?: PageFrontmatter })
      .frontMatter;
    return fm?.sidebar_order ?? Infinity;
  };

  const sortByOrder = (a: PageMapItem, b: PageMapItem): number => {
    return getSidebarOrder(a) - getSidebarOrder(b);
  };

  // Sort items at top level
  pageMap.sort(sortByOrder);

  // Sort children within each folder
  for (const folder of folders.values()) {
    if (folder.children) {
      folder.children.sort(sortByOrder);
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
