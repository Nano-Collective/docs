import path from "node:path";

interface Options {
  /** Absolute base path like `/${projectId}/docs/${version}` */
  basePath: string;
  /** File path within the docs tree, e.g. `docs/guide/intro.md` */
  filePath: string;
  /** The repo and git ref the page was fetched from, for relative images */
  repo: { owner: string; name: string };
  ref: string;
}

const EXTERNAL_URL_RE = /^https?:\/\//;
// A link to a folder's index (or the README standing in for one) points at a
// route that is never generated: index pages are served at the folder itself.
const INDEX_SEGMENT_RE = /(^|\/)(index|README)(\.mdx?)?$/;

/**
 * Remark plugin that resolves relative markdown links to absolute paths
 * with the correct versioned base path.
 *
 * e.g. on page `docs/index.md` with basePath `/json-up/docs/v0.1.2`:
 *   `getting-started` → `/json-up/docs/v0.1.2/getting-started`
 *
 * e.g. on page `docs/guide/intro.md`:
 *   `../getting-started` → `/json-up/docs/v0.1.2/getting-started`
 *   `../README.md#setup` → `/json-up/docs/v0.1.2#setup`
 *
 * Relative images are rewritten to raw.githubusercontent.com at the same ref.
 */
export function remarkResolveRelativeLinks({
  basePath,
  filePath,
  repo,
  ref,
}: Options) {
  // Directory of the current file relative to docs root
  // e.g. `docs/guide/intro.md` → `guide`, `docs/index.md` → `.`
  const fileDir = path.posix.dirname(filePath.replace(/^docs\//, ""));

  return (tree: MdastNode) => {
    visitLinks(tree, (node) => {
      const url = node.url;
      if (!url) return;

      // Skip external links, anchors, and already-absolute paths
      if (
        EXTERNAL_URL_RE.test(url) ||
        url.startsWith("/") ||
        url.startsWith("#") ||
        url.startsWith("data:")
      ) {
        return;
      }

      // Relative images live in the repo, not on this site: serve them from
      // GitHub at the same ref the page was fetched from.
      if (node.type === "image") {
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(filePath), url),
        );
        node.url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${ref}/${resolved}`;
        return;
      }

      // Separate the path from any anchor or query string
      const hashIndex = url.indexOf("#");
      const pathPart = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
      const suffix = hashIndex >= 0 ? url.slice(hashIndex) : "";

      if (!pathPart) return;

      // Resolve relative path against current file's directory
      const resolved = path.posix
        .normalize(path.posix.join(fileDir, pathPart))
        .replace(INDEX_SEGMENT_RE, "")
        .replace(/^\.$/, "");

      node.url = resolved
        ? `${basePath}/${resolved}${suffix}`
        : `${basePath}${suffix}`;
    });
  };
}

interface MdastNode {
  type: string;
  url?: string;
  children?: MdastNode[];
}

function visitLinks(node: MdastNode, fn: (node: MdastNode) => void) {
  if (node.type === "link" || node.type === "image") {
    fn(node);
  }
  if (node.children) {
    for (const child of node.children) {
      visitLinks(child, fn);
    }
  }
}
