import Link from "next/link";
import type { PageMapItem } from "nextra";
import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import { ProjectSearch } from "./ProjectSearch";

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

  // Minimal pageMap required by Nextra Layout
  const pageMap: PageMapItem[] = [
    {
      name: "index",
      route: "/",
      frontMatter: { title: "Home" },
    } as PageMapItem,
  ];

  return (
    <Layout
      navbar={navbar}
      pageMap={pageMap}
      footer={footer}
      search={<ProjectSearch />}
      sidebar={{ defaultOpen: false, toggleButton: false }}
    >
      {children}
    </Layout>
  );
}
