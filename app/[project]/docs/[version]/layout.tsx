import { notFound } from "next/navigation";
import { Footer, Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import { buildPageMapForVersion } from "@/lib/page-map-builder";
import { ProjectProvider } from "@/lib/project-context";
import { getProject } from "@/lib/projects";
import { VersionProvider } from "@/lib/version-context";
import { getVersions, resolveVersion } from "@/lib/versions";
import "nextra-theme-docs/style.css";
import Link from "next/link";
import { ProjectSearch } from "@/components/ProjectSearch";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    project: string;
    version: string;
  }>;
}

export default async function DocsLayout({ children, params }: LayoutProps) {
  const { project: projectId, version } = await params;
  const project = getProject(projectId);
  if (!project) {
    notFound();
  }

  const versions = await getVersions(projectId, project.repo);
  const resolvedVersion = resolveVersion(version, versions);

  // Build pageMap for the current version
  const pageMap = await buildPageMapForVersion(
    projectId,
    resolvedVersion,
    project.repo,
  );

  const navbar = (
    <Navbar
      logoLink={false}
      logo={
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:underline">
            <b>Nano Docs</b>
          </Link>
          <span className="text-sm opacity-25">●</span>
          <Link href={`/${project.id}`} className="hover:underline">
            <b>{project.name}</b>
          </Link>
        </div>
      }
    >
      <ThemeSwitch />
    </Navbar>
  );

  const footer = <Footer>{new Date().getFullYear()} © Nano Collective.</Footer>;

  return (
    <ProjectProvider project={project}>
      <VersionProvider versions={versions} currentVersion={resolvedVersion}>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase={`https://github.com/${project.repo.owner}/${project.repo.name}/tree/${resolvedVersion}`}
          footer={footer}
          search={<ProjectSearch />}
          sidebar={{
            defaultOpen: true,
            toggleButton: true,
            autoCollapse: true,
            defaultMenuCollapseLevel: 1,
          }}
        >
          {children}
        </Layout>
      </VersionProvider>
    </ProjectProvider>
  );
}
