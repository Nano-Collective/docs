/**
 * Extended frontmatter interface for sidebar and SEO metadata
 */
export interface PageFrontmatter {
  title?: string;
  description?: string;
  sidebar_order?: number;
  hidden?: boolean;
}

/**
 * Parse full frontmatter from raw MDX content
 */
export function parseFrontmatter(rawMdx: string): PageFrontmatter {
  const frontmatter: PageFrontmatter = {};

  // Try to extract from frontmatter
  const frontmatterMatch = rawMdx.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const fmContent = frontmatterMatch[1];

    // Extract title
    const titleMatch = fmContent.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) {
      frontmatter.title = titleMatch[1].trim();
    }

    // Extract description
    const descMatch = fmContent.match(/description:\s*["']?([^"'\n]+)["']?/);
    if (descMatch) {
      frontmatter.description = descMatch[1].trim();
    }

    // Extract sidebar_order
    const orderMatch = fmContent.match(/sidebar_order:\s*(\d+)/);
    if (orderMatch) {
      frontmatter.sidebar_order = parseInt(orderMatch[1], 10);
    }

    // Extract hidden (boolean)
    const hiddenMatch = fmContent.match(/hidden:\s*(true|false)/);
    if (hiddenMatch) {
      frontmatter.hidden = hiddenMatch[1] === "true";
    }
  }

  return frontmatter;
}

/**
 * Extract title from raw MDX content (frontmatter or first heading)
 */
export function extractTitle(rawMdx: string): string {
  // Try to extract from frontmatter
  const frontmatterMatch = rawMdx.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(
      /title:\s*["']?([^"'\n]+)["']?/,
    );
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Fall back to first heading
  const headingMatch = rawMdx.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return "Documentation";
}

/**
 * Convert file path to a human-readable title
 */
export function pathToTitle(filePath: string): string {
  // Remove docs/ prefix and extension
  const name = filePath
    .replace(/^docs\//, "")
    .replace(/\.(md|mdx)$/, "")
    .replace(/\/index$/, "");

  // Convert to title case
  return name
    .split(/[-_/]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
