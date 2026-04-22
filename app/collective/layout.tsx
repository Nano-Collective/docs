import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { MdxFile, PageMapItem } from "nextra";
import { Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import CustomFooter from "@/components/home/Footer";
import { ProjectSearch } from "@/components/ProjectSearch";
import "nextra-theme-docs/style.css";

interface CollectiveDoc {
  slug: string;
  title: string;
  sidebar_order?: number;
}

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

function getCollectiveDocs(): CollectiveDoc[] {
  const dir = path.join(process.cwd(), "content", "collective");
  if (!fs.existsSync(dir)) return [];

  const docs: CollectiveDoc[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.(mdx|md)$/, "");
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const fm = parseFrontmatter(content);
    docs.push({
      slug,
      title:
        fm.title ||
        slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      sidebar_order: fm.sidebar_order,
    });
  }

  return docs.sort(
    (a, b) => (a.sidebar_order ?? Infinity) - (b.sidebar_order ?? Infinity),
  );
}

export default function CollectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getCollectiveDocs();
  const indexDoc = docs.find((d) => d.slug === "index");
  const nonIndex = docs.filter((d) => d.slug !== "index");

  const pageMap: PageMapItem[] = [];

  if (indexDoc) {
    pageMap.push({
      name: "index",
      route: "/collective",
      title: indexDoc.title,
      frontMatter: { title: indexDoc.title },
    } as MdxFile);
  }

  for (const doc of nonIndex) {
    pageMap.push({
      name: doc.slug,
      route: `/collective/${doc.slug}`,
      title: doc.title,
      frontMatter: { title: doc.title },
    } as MdxFile);
  }

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
