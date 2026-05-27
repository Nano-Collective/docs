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
 * Supports recursive nested folder structures
 */
export async function buildPageMapForVersion(
  projectId: string,
  version: string,
  repo: Repo,
): Promise<PageMapItem[]> {
  const cacheKey = `${projectId}:${version}`;
  // Skip cache in dev so changes are picked up on refresh
  if (process.env.NODE_ENV !== "development") {
    const cached = pageMapCache.get(cacheKey);
    if (cached) {
      return cached;
    }
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

  // Build nested pageMap manually for remote content
  // Structure: root array containing files and nested Folder objects
  const root: PageMapItem[] = [];

  // Index files grouped by their directory (for folder default pages)
  const indexFilesByFolder = new Map<string, string>();

  for (const file of files) {
    const relativePath = file.replace(/^docs\//, "").replace(/\.(md|mdx)$/, "");
    const parts = relativePath.split("/");
    const isIndex = parts[parts.length - 1] === "index";

    // Track index files for folder default routes
    if (isIndex && parts.length > 1) {
      // e.g., docs/api/index.md -> folderPath = "api"
      const folderPath = parts.slice(0, -1).join("/");
      indexFilesByFolder.set(folderPath, file);
    }
  }

  // Process each file and build the tree
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
    const title = fm.title || pathToDisplayName(file);

    if (isIndex && parts.length === 1) {
      // Root index file - add at beginning
      root.unshift({
        name: "index",
        route: `/${projectId}/docs/${version}`,
        title: title || "Introduction",
        frontMatter: { title: title || "Introduction", ...fm },
      } as MdxFile & { title: string });
      continue;
    }

    if (isIndex) {
      // Subfolder index - skip adding as a page, but it becomes folder default
      continue;
    }

    if (parts.length === 1) {
      // Top-level file - add directly to root
      root.push({
        name: parts[0],
        route: `/${projectId}/docs/${version}/${parts[0]}`,
        title,
        frontMatter: { title, ...fm },
      } as MdxFile & { title: string });
      continue;
    }

    // Nested file - find or create folder hierarchy
    // parts = ['api', 'endpoints', 'users'] -> folderPath = 'api/endpoints'
    const folderParts = parts.slice(0, -1);
    const fileName = parts[parts.length - 1];
    const fileRoute = `/${projectId}/docs/${version}/${relativePath}`;

    // Find or create the parent folder at the correct nesting level
    let currentLevel: PageMapItem[] = root;

    for (let i = 0; i < folderParts.length; i++) {
      const folderName = folderParts[i];
      const folderPath = folderParts.slice(0, i + 1).join("/");

      // Check if folder already exists at this level
      let folder = currentLevel.find(
        (item): item is Folder<PageMapItem> =>
          "children" in item && item.name === folderName,
      );

      if (!folder) {
        // Create new folder
        // Check if this folder has an index file for default route
        const folderIndexFile = indexFilesByFolder.get(folderPath);
        const folderFm = folderIndexFile
          ? fileFrontmatter.get(folderIndexFile)
          : undefined;
        const folderTitle = folderFm?.title || pathToDisplayName(folderName);

        // Determine route - use index file if exists, otherwise first child
        const route = folderIndexFile
          ? `/${projectId}/docs/${version}/${folderPath}`
          : undefined;

        folder = {
          name: folderName,
          route: route || "",
          title: folderTitle,
          children: [],
          frontMatter: folderFm
            ? { title: folderTitle, ...folderFm }
            : { title: folderTitle },
        } as Folder<PageMapItem> & {
          title: string;
          frontMatter: PageFrontmatter;
        };

        currentLevel.push(folder);
      }

      // Move to children for next iteration
      currentLevel = folder.children || [];
    }

    // Add the file to the deepest folder's children
    currentLevel.push({
      name: fileName,
      route: fileRoute,
      title,
      frontMatter: { title, ...fm },
    } as MdxFile & { title: string });
  }

  // Sort items at each level by sidebar_order
  // For folders, sidebar_order comes from the folder's index.md and controls
  // the folder's position in its parent. Index pages are always first within
  // their folder.
  const sortByOrder = (items: PageMapItem[]): void => {
    const getOrder = (item: PageMapItem): number => {
      const fm = (item as unknown as { frontMatter?: PageFrontmatter })
        .frontMatter;
      return fm?.sidebar_order ?? Infinity;
    };

    const isIndex = (item: PageMapItem): boolean =>
      "name" in item && item.name === "index";

    items.sort((a, b) => {
      // Index pages always come first within a folder
      if (isIndex(a)) return -1;
      if (isIndex(b)) return 1;
      return getOrder(a) - getOrder(b);
    });

    // Recursively sort children in folders
    for (const item of items) {
      if ("children" in item && item.children) {
        sortByOrder(item.children);
      }
    }
  };

  sortByOrder(root);

  // Cache the result
  pageMapCache.set(cacheKey, root);

  return root;
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
