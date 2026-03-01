import path from "node:path";

interface Options {
  /** Absolute base path like `/${projectId}/docs/${version}` */
  basePath: string;
  /** File path within the docs tree, e.g. `docs/guide/intro.md` */
  filePath: string;
}

const EXTERNAL_URL_RE = /^https?:\/\//;

/**
 * Remark plugin that resolves relative markdown links to absolute paths
 * with the correct versioned base path.
 *
 * e.g. on page `docs/index.md` with basePath `/json-up/docs/v0.1.2`:
 *   `getting-started` → `/json-up/docs/v0.1.2/getting-started`
 *
 * e.g. on page `docs/guide/intro.md`:
 *   `../getting-started` → `/json-up/docs/v0.1.2/getting-started`
 */
export function remarkResolveRelativeLinks({ basePath, filePath }: Options) {
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
        url.startsWith("#")
      ) {
        return;
      }

      // Separate the path from any anchor or query string
      const hashIndex = url.indexOf("#");
      const pathPart = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
      const suffix = hashIndex >= 0 ? url.slice(hashIndex) : "";

      if (!pathPart) return;

      // Resolve relative path against current file's directory
      const resolved = path.posix.normalize(path.posix.join(fileDir, pathPart));

      node.url = `${basePath}/${resolved}${suffix}`;
    });
  };
}

interface MdastNode {
  type: string;
  url?: string;
  children?: MdastNode[];
}

function visitLinks(node: MdastNode, fn: (node: MdastNode) => void) {
  if (node.type === "link") {
    fn(node);
  }
  if (node.children) {
    for (const child of node.children) {
      visitLinks(child, fn);
    }
  }
}
