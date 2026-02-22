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
