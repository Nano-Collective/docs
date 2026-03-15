import fs from "node:fs";
import path from "node:path";

export interface Repo {
  owner: string;
  name: string;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Get the local docs path for a repo if configured via LOCAL_DOCS_<ID> env var.
 * e.g. LOCAL_DOCS_NANOCODER=../nano-coder → resolves to absolute path + /docs
 */
function getLocalDocsPath(repo: Repo): string | null {
  if (!isDev) return null;

  // Check LOCAL_DOCS_<REPO_NAME> (uppercased, hyphens replaced with underscores)
  const envKey = `LOCAL_DOCS_${repo.name.toUpperCase().replace(/-/g, "_")}`;
  const localPath = process.env[envKey];
  if (!localPath) return null;

  const resolved = path.resolve(localPath);
  const docsDir = path.join(resolved, "docs");
  if (fs.existsSync(docsDir)) {
    return docsDir;
  }

  console.warn(
    `LOCAL_DOCS: ${docsDir} does not exist (from ${envKey}=${localPath})`,
  );
  return null;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "nano-collective-docs",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  } else if (isDev) {
    console.warn(
      "No GITHUB_TOKEN found. Set it in .env.local to avoid rate limits.",
    );
  }

  return headers;
}

function getFetchOptions(): RequestInit {
  // Disable fetch cache in dev to avoid caching failed responses
  if (isDev) {
    return { headers: getHeaders(), cache: "no-store" };
  }
  return { headers: getHeaders(), next: { revalidate: 3600 } };
}

/**
 * Fetch all releases from the GitHub repository
 */
export async function fetchReleases(repo: Repo): Promise<Release[]> {
  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/releases`,
    getFetchOptions(),
  );

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      console.warn(
        `GitHub API rate limit exceeded (${response.status}). Set GITHUB_TOKEN in .env.local for higher limits.`,
      );
      return [];
    }
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }

  const releases: Release[] = await response.json();

  // Filter out drafts and prereleases
  return releases.filter((r) => !r.draft && !r.prerelease);
}

/**
 * Fetch directory contents from GitHub for a specific version
 */
export async function fetchDirectoryContents(
  version: string,
  dirPath: string,
  repo: Repo,
): Promise<GitHubFile[]> {
  // Try local filesystem first
  const localDocs = getLocalDocsPath(repo);
  if (localDocs) {
    // dirPath is like "docs" or "docs/getting-started"
    const relativePath = dirPath.replace(/^docs\/?/, "");
    const fullPath = relativePath
      ? path.join(localDocs, relativePath)
      : localDocs;

    if (!fs.existsSync(fullPath)) return [];

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      type: entry.isDirectory() ? "dir" : "file",
      download_url: null,
    }));
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${dirPath}?ref=${version}`,
    getFetchOptions(),
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    if (response.status === 403 || response.status === 429) {
      console.warn(
        `GitHub API rate limit exceeded (${response.status}). Set GITHUB_TOKEN in .env.local for higher limits.`,
      );
      return [];
    }
    throw new Error(
      `Failed to fetch directory contents: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchFileContent(
  version: string,
  filePath: string,
  repo: Repo,
): Promise<string> {
  // Try local filesystem first
  const localDocs = getLocalDocsPath(repo);
  if (localDocs) {
    // filePath is like "docs/getting-started/installation.md"
    const relativePath = filePath.replace(/^docs\/?/, "");
    const fullPath = path.join(localDocs, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Local file not found: ${fullPath}`);
    }

    return fs.readFileSync(fullPath, "utf-8");
  }

  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${version}/${filePath}`;

  const response = await fetch(
    url,
    isDev ? { cache: "no-store" } : { next: { revalidate: 3600 } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Recursively get all markdown files in the docs directory
 */
export async function getAllDocsFiles(
  version: string,
  dirPath: string,
  repo: Repo,
): Promise<string[]> {
  const contents = await fetchDirectoryContents(version, dirPath, repo);
  const files: string[] = [];

  for (const item of contents) {
    if (item.type === "dir") {
      const subFiles = await getAllDocsFiles(version, item.path, repo);
      files.push(...subFiles);
    } else if (
      item.type === "file" &&
      (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
    ) {
      files.push(item.path);
    }
  }

  return files;
}

/**
 * Check if a docs folder exists for a given version
 */
export async function docsExistForVersion(
  version: string,
  repo: Repo,
): Promise<boolean> {
  const contents = await fetchDirectoryContents(version, "docs", repo);
  return contents.length > 0;
}
