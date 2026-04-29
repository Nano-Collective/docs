import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Folder, MdxFile, PageMapItem } from "nextra";
import { Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import CustomFooter from "@/components/home/Footer";
import { ProjectSearch } from "@/components/ProjectSearch";
import "nextra-theme-docs/style.css";

const CONTENT_ROOT = path.join(process.cwd(), "content", "collective");

function parseFrontmatter(content: string): {
  title?: string;
  sidebar_order?: number;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: { title?: string; sidebar_order?: number } = {};
  for (const line of match[1].split("\n")) {
    const titleMatch = line.match(/^title:\s*["']?(.*?)["']?$/);
    if (titleMatch) fm.title = titleMatch[1];
    const orderMatch = line.match(/^sidebar_order:\s*(\d+)$/);
    if (orderMatch) fm.sidebar_order = parseInt(orderMatch[1], 10);
  }
  return fm;
}

function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function readFrontmatter(filePath: string): {
  title?: string;
  sidebar_order?: number;
} {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(content);
}

function buildPageMapForDir(dir: string, routePrefix: string): PageMapItem[] {
  if (!fs.existsSync(dir)) return [];

  const items: (PageMapItem & { sidebar_order?: number })[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      const folderPath = path.join(dir, folderName);
      const folderRoute = `${routePrefix}/${folderName}`;
      const indexFile = [
        path.join(folderPath, "index.md"),
        path.join(folderPath, "index.mdx"),
      ].find((p) => fs.existsSync(p));
      const folderFm = indexFile ? readFrontmatter(indexFile) : {};
      const folderTitle = folderFm.title || nameFromSlug(folderName);
      const children = buildPageMapForDir(folderPath, folderRoute);

      const folder: Folder<PageMapItem> & {
        title: string;
        sidebar_order?: number;
      } = {
        name: folderName,
        route: folderRoute,
        title: folderTitle,
        children,
        sidebar_order: folderFm.sidebar_order,
      } as Folder<PageMapItem> & { title: string; sidebar_order?: number };
      items.push(folder as PageMapItem & { sidebar_order?: number });
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md") && !entry.name.endsWith(".mdx")) continue;

    const slug = entry.name.replace(/\.(mdx|md)$/, "");
    const fm = readFrontmatter(path.join(dir, entry.name));
    const title = fm.title || nameFromSlug(slug);

    if (slug === "index") {
      items.push({
        name: "index",
        route: routePrefix,
        title,
        frontMatter: { title },
        sidebar_order: fm.sidebar_order,
      } as MdxFile & { sidebar_order?: number });
      continue;
    }

    items.push({
      name: slug,
      route: `${routePrefix}/${slug}`,
      title,
      frontMatter: { title },
      sidebar_order: fm.sidebar_order,
    } as MdxFile & { sidebar_order?: number });
  }

  const itemName = (item: PageMapItem): string | undefined =>
    "name" in item ? item.name : undefined;

  items.sort((a, b) => {
    if (itemName(a) === "index") return -1;
    if (itemName(b) === "index") return 1;
    const ao = a.sidebar_order ?? Infinity;
    const bo = b.sidebar_order ?? Infinity;
    return ao - bo;
  });

  return items;
}

export default function CollectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap: PageMapItem[] = buildPageMapForDir(
    CONTENT_ROOT,
    "/collective",
  );

  const navbar = (
    <Navbar
      logoLink={false}
      logo={
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="hover:underline shrink-0">
            <b>Nano Docs</b>
          </Link>
          <span className="text-sm opacity-25 shrink-0">●</span>
          <Link href="/collective" className="hover:underline truncate">
            <b>Collective</b>
          </Link>
        </div>
      }
    >
      <ThemeSwitch />
    </Navbar>
  );

  return (
    <Layout
      navbar={navbar}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/Nano-Collective/docs/tree/main"
      editLink={null}
      footer={<CustomFooter />}
      search={<ProjectSearch />}
      sidebar={{
        defaultOpen: true,
        toggleButton: false,
        autoCollapse: true,
        defaultMenuCollapseLevel: 1,
      }}
    >
      {children}
    </Layout>
  );
}
