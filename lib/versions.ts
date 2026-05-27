import {
  docsExistForVersion,
  fetchReleases,
  type Release,
  type Repo,
} from "./github";

const isDev = process.env.NODE_ENV === "development";

// Cache for versions to avoid repeated API calls during build
// Map keyed by project ID
const versionCache = new Map<string, string[]>();

/**
 * Parse version string to extract major, minor, patch
 */
function parseVersion(tag: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  // Remove 'v' prefix if present
  const version = tag.replace(/^v/, "");
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);

  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Filter releases to only include latest patch of each minor version
 */
export function filterMajorReleases(releases: Release[]): Release[] {
  const minorVersions = new Map<string, Release>();

  for (const release of releases) {
    const parsed = parseVersion(release.tag_name);
    if (!parsed) continue;

    // Use "major.minor" as the key to keep latest patch of each minor version
    const key = `${parsed.major}.${parsed.minor}`;
    const existing = minorVersions.get(key);

    if (!existing) {
      minorVersions.set(key, release);
    } else {
      // Keep the newer release (higher patch)
      const existingParsed = parseVersion(existing.tag_name);
      if (existingParsed && parsed.patch > existingParsed.patch) {
        minorVersions.set(key, release);
      }
    }
  }

  // Sort by version descending (newest first)
  return Array.from(minorVersions.values()).sort((a, b) => {
    const aParsed = parseVersion(a.tag_name);
    const bParsed = parseVersion(b.tag_name);
    if (!aParsed || !bParsed) return 0;

    // Compare major, then minor, then patch
    if (bParsed.major !== aParsed.major) {
      return bParsed.major - aParsed.major;
    }
    if (bParsed.minor !== aParsed.minor) {
      return bParsed.minor - aParsed.minor;
    }
    return bParsed.patch - aParsed.patch;
  });
}

/**
 * Get list of available versions (latest patch of each minor release)
 */
export async function getVersions(
  projectId: string,
  repo: Repo,
): Promise<string[]> {
  // In dev mode, use main branch directly to avoid release API calls
  if (isDev) {
    return ["main"];
  }

  const cached = versionCache.get(projectId);
  if (cached) {
    return cached;
  }

  const releases = await fetchReleases(repo);
  const majorReleases = filterMajorReleases(releases);

  // Filter to only versions that have a docs/ folder
  const versionsWithDocs: string[] = [];
  for (const release of majorReleases) {
    const hasDocs = await docsExistForVersion(release.tag_name, repo);
    if (hasDocs) {
      versionsWithDocs.push(release.tag_name);
    }
  }

  versionCache.set(projectId, versionsWithDocs);
  return versionsWithDocs;
}

/**
 * Resolve "latest" to the actual latest version
 */
export function resolveVersion(version: string, allVersions: string[]): string {
  if ((version === "latest" || version === "main") && allVersions.length > 0) {
    return allVersions[0];
  }
  return version;
}

/**
 * Check if a version string is valid
 */
export function isValidVersion(
  version: string,
  allVersions: string[],
): boolean {
  if (version === "latest" || version === "main") return allVersions.length > 0;
  return allVersions.includes(version);
}

/**
 * Get the latest version
 */
export async function getLatestVersion(
  projectId: string,
  repo: Repo,
): Promise<string | null> {
  const versions = await getVersions(projectId, repo);
  return versions.length > 0 ? versions[0] : null;
}

/**
 * Clear the version cache (useful for testing or forcing refresh)
 */
export function clearVersionCache(projectId?: string): void {
  if (projectId) {
    versionCache.delete(projectId);
  } else {
    versionCache.clear();
  }
}
