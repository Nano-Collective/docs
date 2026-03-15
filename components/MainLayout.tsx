import Link from "next/link";
import type { MdxFile, MetaJsonFile, PageMapItem } from "nextra";
import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import { getApps, getLibraries } from "@/lib/projects";
import { ProjectSearch } from "./ProjectSearch";
import { TooltipProvider } from "./ui/tooltip";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navbar = (
    <Navbar
      logoLink={false}
      logo={
        <Link href="/" className="hover:underline">
          <b>Nano Docs</b>
        </Link>
      }
    >
      <ThemeSwitch />
    </Navbar>
  );

  const footer = <Footer>{new Date().getFullYear()} © Nano Collective.</Footer>;

  const apps = getApps();
  const libraries = getLibraries();

  // Build meta data for ordering/titles
  const metaData: Record<string, string | Record<string, unknown>> = {
    index: "Home",
    "---projects": { type: "separator", title: "Projects" },
  };
  for (const app of apps) {
    metaData[app.id] = app.name;
  }
  metaData["---libraries"] = { type: "separator", title: "Libraries" };
  for (const lib of libraries) {
    metaData[lib.id] = lib.name;
  }
  metaData["---links"] = { type: "separator", title: "" };
  metaData.website = {
    title: "nanocollective.org ↗",
    href: "https://nanocollective.org",
  };

  // Build pageMap: MetaJsonFile first, then separator + page items in order.
  // Nextra's client-side normalizePages only iterates over actual items in
  // the list, so separators and href-links must be included as items too.
  const pageMap = [
    { data: metaData } as MetaJsonFile,
    { name: "index", route: "/", title: "Home", frontMatter: { title: "Home" } } as MdxFile,
    { name: "---projects", type: "separator", title: "Projects" },
    ...apps.map((app) => ({
      name: app.id,
      route: `/${app.id}`,
      title: app.name,
      frontMatter: { title: app.name },
    })),
    { name: "---libraries", type: "separator", title: "Libraries" },
    ...libraries.map((lib) => ({
      name: lib.id,
      route: `/${lib.id}`,
      title: lib.name,
      frontMatter: { title: lib.name },
    })),
    { name: "---links", type: "separator", title: "" },
    {
      name: "website",
      title: "nanocollective.org ↗",
      href: "https://nanocollective.org",
      frontMatter: { title: "nanocollective.org ↗" },
    },
  ] as PageMapItem[];

  return (
    <Layout
      navbar={navbar}
      pageMap={pageMap}
      footer={footer}
      search={<ProjectSearch />}
      sidebar={{ defaultOpen: false, toggleButton: false }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </Layout>
  );
}
