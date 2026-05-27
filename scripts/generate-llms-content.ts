/**
 * Post-build script that emits LLM-friendly content alongside the static export:
 *
 *   1. For every Markdown page in the docs site, write a `.md` mirror at the
 *      page's URL plus `.md`. e.g. /collective/organisation/governance →
 *      /collective/organisation/governance.md (raw markdown).
 *   2. Emit /llms.txt at the docs root following https://llmstxt.org/ — a
 *      single index of every page with title, short description, and a link
 *      to its raw markdown.
 *
 * Runs after `next build` (see postbuild in package.json) and writes into the
 * static `out/` directory. Collective docs are read locally; project docs are
 * fetched from each project's latest tagged release on GitHub using the same
 * helpers the build itself uses.
 */

import fs from "node:fs";
import path from "node:path";
import { fetchFileContent, getAllDocsFiles } from "../lib/github";
import { PROJECTS } from "../lib/projects";
import { parseFrontmatter } from "../lib/remote-content";
import { getLatestVersion } from "../lib/versions";

const OUT_DIR = path.join(process.cwd(), "out");
const CONTENT_ROOT = path.join(process.cwd(), "content");
const SITE_BASE = "https://docs.nanocollective.org";

interface PageEntry {
  route: string;
  title: string;
  description?: string;
  section: string;
}

function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function writeMirror(route: string, content: string): void {
  const outPath = `${path.join(OUT_DIR, route.replace(/^\//, ""))}.md`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
}

/**
 * Walk content/collective/ and emit .md mirrors. Returns an entry per page
 * for the llms.txt index.
 */
function processCollectiveDocs(): PageEntry[] {
  const entries: PageEntry[] = [];
  const collectiveRoot = path.join(CONTENT_ROOT, "collective");

  function walk(dir: string, routePrefix: string, sectionLabel: string): void {
    if (!fs.existsSync(dir)) return;

    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory()) {
        const subDir = path.join(dir, item.name);
        const subRoutePrefix = `${routePrefix}/${item.name}`;
        // The folder's display name (from its index.md frontmatter) becomes
        // the section label for everything inside it.
        const indexPath = [
          path.join(subDir, "index.md"),
          path.join(subDir, "index.mdx"),
        ].find((p) => fs.existsSync(p));
        const indexFm = indexPath
          ? parseFrontmatter(fs.readFileSync(indexPath, "utf-8"))
          : {};
        const subSection = indexFm.title || nameFromSlug(item.name);
        walk(subDir, subRoutePrefix, subSection);
        continue;
      }

      if (!item.isFile()) continue;
      if (!item.name.endsWith(".md") && !item.name.endsWith(".mdx")) continue;

      const absPath = path.join(dir, item.name);
      const content = fs.readFileSync(absPath, "utf-8");
      const fm = parseFrontmatter(content);

      if (fm.hidden) continue;

      const slug = item.name.replace(/\.(mdx|md)$/, "");
      const route = slug === "index" ? routePrefix : `${routePrefix}/${slug}`;
      const title = fm.title || nameFromSlug(slug);

      writeMirror(route, content);

      entries.push({
        route,
        title,
        description: fm.description,
        section: sectionLabel,
      });
    }
  }

  walk(collectiveRoot, "/collective", "Introduction");
  return entries;
}

/**
 * For each project, fetch the latest tagged release's docs/ folder from
 * GitHub, write .md mirrors, and return entries grouped by project id.
 */
async function processProjectDocs(): Promise<Map<string, PageEntry[]>> {
  const result = new Map<string, PageEntry[]>();

  for (const project of PROJECTS) {
    const version = await getLatestVersion(project.id, project.repo);
    if (!version) {
      console.warn(`  No latest version for ${project.id}, skipping`);
      continue;
    }

    console.log(`  Fetching ${project.id}@${version}…`);
    const files = await getAllDocsFiles(version, "docs", project.repo);
    const entries: PageEntry[] = [];

    for (const file of files) {
      const content = await fetchFileContent(version, file, project.repo);
      const fm = parseFrontmatter(content);
      if (fm.hidden) continue;

      const relativePath = file
        .replace(/^docs\//, "")
        .replace(/\.(md|mdx)$/, "");

      let route: string;
      if (relativePath === "index") {
        route = `/${project.id}/docs/${version}`;
      } else if (relativePath.endsWith("/index")) {
        const folder = relativePath.replace(/\/index$/, "");
        route = `/${project.id}/docs/${version}/${folder}`;
      } else {
        route = `/${project.id}/docs/${version}/${relativePath}`;
      }

      const title = fm.title || nameFromSlug(path.basename(relativePath));

      writeMirror(route, content);

      entries.push({
        route,
        title,
        description: fm.description,
        section: project.name,
      });
    }

    result.set(project.id, entries);
  }

  return result;
}

function generateLlmsTxt(
  collective: PageEntry[],
  projects: Map<string, PageEntry[]>,
): string {
  const lines: string[] = [];

  lines.push("# Nano Collective Documentation");
  lines.push("");
  lines.push(
    "> The Nano Collective is a community-led group of developers, designers, and maintainers building open-source AI tools for the people who use them. We build not for profit, but for the community. Every tool we ship aims to be privacy-respecting, local-first, and open for all.",
  );
  lines.push("");
  lines.push(
    "This file lists every page in the Nano Collective documentation. Each link points to the page's raw Markdown so it can be fetched and parsed directly without HTML rendering.",
  );
  lines.push("");
  lines.push(
    "Documentation is split into two parts: the **Collective** docs (governance, brand, contribution, and how the collective works) and the **Project** docs (one section per Nano Collective project, linking to the latest released version).",
  );
  lines.push("");

  // Group collective entries by section so the index reads as the sidebar.
  const sectionMap = new Map<string, PageEntry[]>();
  for (const entry of collective) {
    if (!sectionMap.has(entry.section)) sectionMap.set(entry.section, []);
    sectionMap.get(entry.section)?.push(entry);
  }

  // Sidebar order: Introduction, Projects, Organisation, then anything else.
  const sectionOrder = ["Introduction", "Projects", "Organisation"];
  const orderedKeys = [
    ...sectionOrder.filter((s) => sectionMap.has(s)),
    ...[...sectionMap.keys()].filter((k) => !sectionOrder.includes(k)),
  ];

  for (const section of orderedKeys) {
    const items = sectionMap.get(section);
    if (!items || items.length === 0) continue;

    lines.push(`## Collective — ${section}`);
    lines.push("");
    items.sort((a, b) => a.route.localeCompare(b.route));
    for (const item of items) {
      const desc = item.description ? `: ${item.description}` : "";
      lines.push(`- [${item.title}](${SITE_BASE}${item.route}.md)${desc}`);
    }
    lines.push("");
  }

  // One section per project, in PROJECTS declaration order.
  for (const project of PROJECTS) {
    const items = projects.get(project.id);
    if (!items || items.length === 0) continue;

    lines.push(`## ${project.name}`);
    lines.push("");
    lines.push(`> ${project.description}`);
    lines.push("");
    items.sort((a, b) => a.route.localeCompare(b.route));
    for (const item of items) {
      const desc = item.description ? `: ${item.description}` : "";
      lines.push(`- [${item.title}](${SITE_BASE}${item.route}.md)${desc}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  console.log("Generating LLM-friendly content…");

  if (!fs.existsSync(OUT_DIR)) {
    console.error(
      `Output directory ${OUT_DIR} does not exist. Run 'next build' first.`,
    );
    process.exit(1);
  }

  console.log("Processing collective docs…");
  const collective = processCollectiveDocs();
  console.log(`  Wrote ${collective.length} collective pages`);

  console.log("Processing project docs…");
  const projects = await processProjectDocs();
  let projectCount = 0;
  for (const entries of projects.values()) projectCount += entries.length;
  console.log(`  Wrote ${projectCount} project pages`);

  const llmsTxt = generateLlmsTxt(collective, projects);
  fs.writeFileSync(path.join(OUT_DIR, "llms.txt"), llmsTxt);
  console.log("  Wrote llms.txt");

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed to generate LLM content:", err);
  process.exit(1);
});
