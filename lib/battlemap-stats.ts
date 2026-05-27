/**
 * Markdown post-processor for the Nanocoder battlemap.
 *
 * Replaces marker pairs like `<!--stars:owner/repo-->VALUE<!--/stars-->` and
 * `<!--contributors:owner/repo-->VALUE<!--/contributors-->` with live counts
 * fetched from the GitHub API. Called from fetchFileContent so any markdown
 * pulled through the docs build gets resolved counts at deploy time.
 *
 * After substitution, the HTML comment syntax is stripped to avoid MDX JSX
 * parsing errors (MDX fails on `<!--` since `!` isn't a valid JSX element start).
 */

const isDev = process.env.NODE_ENV === "development";

// Match HTML comment markers: <!--stars:owner/repo-->VALUE<!--/stars-->
const MARKER =
  /<!--\s*(stars|contributors):([A-Za-z0-9._/-]+?)\s*-->[^<]*<!--\s*\/\1\s*-->/g;

interface RepoStats {
  stars: number | null;
  contributors: number | null;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nano-collective-docs",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function getFetchOptions(): RequestInit {
  if (isDev) {
    return { headers: getHeaders(), cache: "no-store" };
  }
  return { headers: getHeaders(), next: { revalidate: 3600 } };
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(n);
}

async function getStars(repo: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}`,
      getFetchOptions(),
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { stargazers_count?: number };
    return body.stargazers_count ?? null;
  } catch {
    return null;
  }
}

async function getContributors(repo: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contributors?per_page=1&anon=true`,
      getFetchOptions(),
    );
    if (!res.ok) return null;
    const link = res.headers.get("link");
    if (link) {
      const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (match) return Number(match[1]);
    }
    const body = (await res.json()) as unknown[];
    return Array.isArray(body) ? body.length : 0;
  } catch {
    return null;
  }
}

async function fetchRepoStats(repo: string): Promise<RepoStats> {
  const [stars, contributors] = await Promise.all([
    getStars(repo),
    getContributors(repo),
  ]);
  return { stars, contributors };
}

/**
 * Substitute battlemap stat markers with live values. Returns the original
 * content unchanged if no markers are present or if fetches fail.
 *
 * After substitution, the HTML comment markers are stripped so only the
 * formatted count remains. This prevents MDX JSX parsing errors (MDX fails
 * on `<!--` since `!` isn't a valid JSX element start character).
 */
export async function substituteBattlemapMarkers(
  content: string,
): Promise<string> {
  if (
    !content.includes("<!--stars:") &&
    !content.includes("<!--contributors:")
  ) {
    return content;
  }

  const repos = new Set<string>();
  for (const m of content.matchAll(MARKER)) {
    repos.add(m[2]);
  }
  if (repos.size === 0) return content;

  const entries = await Promise.all(
    Array.from(repos).map(async (repo) => {
      const stats = await fetchRepoStats(repo);
      return [repo, stats] as const;
    }),
  );
  const cache = new Map(entries);

  // Strip HTML comment syntax after substitution to avoid MDX parsing errors
  return content.replace(MARKER, (full, kind: string, repo: string) => {
    const stats = cache.get(repo);
    if (!stats) return full;
    const count = kind === "stars" ? stats.stars : stats.contributors;
    if (count === null) return full;
    // Return only the formatted count, without HTML comment markers
    return formatCount(count);
  });
}
