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

const headers: HeadersInit = {
	Accept: "application/vnd.github.v3+json",
	"User-Agent": "nano-collective-docs",
};

// Add GitHub token if available for higher rate limits
if (process.env.GITHUB_TOKEN) {
	headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

/**
 * Fetch all releases from the GitHub repository
 */
export async function fetchReleases(repo: Repo): Promise<Release[]> {
	const response = await fetch(
		`https://api.github.com/repos/${repo.owner}/${repo.name}/releases`,
		{ headers, next: { revalidate: 3600 } }
	);

	if (!response.ok) {
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
	path: string,
	repo: Repo
): Promise<GitHubFile[]> {
	const response = await fetch(
		`https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${path}?ref=${version}`,
		{ headers, next: { revalidate: 3600 } }
	);

	if (!response.ok) {
		if (response.status === 404) {
			return [];
		}
		throw new Error(`Failed to fetch directory contents: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchFileContent(
	version: string,
	filePath: string,
	repo: Repo
): Promise<string> {
	const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${version}/${filePath}`;

	const response = await fetch(url, { next: { revalidate: 3600 } });

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
	path: string,
	repo: Repo
): Promise<string[]> {
	const contents = await fetchDirectoryContents(version, path, repo);
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
	repo: Repo
): Promise<boolean> {
	const contents = await fetchDirectoryContents(version, "docs", repo);
	return contents.length > 0;
}
