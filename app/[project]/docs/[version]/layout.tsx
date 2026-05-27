import { notFound } from "next/navigation";
import { Layout, Navbar, ThemeSwitch } from "nextra-theme-docs";
import CustomFooter from "@/components/home/Footer";
import { SidebarSelectors } from "@/components/SidebarSelectors";
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

  // Inject sidebar selectors into the page map as a Nextra separator item.
  // normalizePages expects the first item to be a MetaJsonFile ({ data: ... }),
  // and then processes the remaining items. Separator items in the meta are
  // spliced into the items list, but since we're building the page map
  // programmatically, we inject directly into both the meta and the items list.
  const existingMeta =
    pageMap.length > 0 && "data" in pageMap[0]
      ? (pageMap[0] as { data: Record<string, unknown> }).data
      : {};

  const pageMapWithSelectors = [
    {
      data: {
        "sidebar-selectors": {
          type: "separator" as const,
          title: <SidebarSelectors />,
        },
        ...existingMeta,
      },
    },
    // Separator item in the items list (normalizePages iterates these)
    {
      name: "sidebar-selectors",
      type: "separator" as const,
      title: <SidebarSelectors />,
    },
    // Rest of page map items (skip existing meta if it was the first item)
    ...(pageMap.length > 0 && "data" in pageMap[0]
      ? pageMap.slice(1)
      : pageMap),
  ] as unknown as typeof pageMap;

  const navbar = (
    <Navbar
      logoLink={false}
      logo={
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="hover:underline shrink-0">
            <b>Nano Docs</b>
          </Link>
          <span className="text-sm opacity-25 shrink-0">●</span>
          <Link href={`/${project.id}`} className="hover:underline truncate">
            <b>{project.name}</b>
          </Link>
        </div>
      }
    >
      <ThemeSwitch />
    </Navbar>
  );

  const footer = <CustomFooter />;

  return (
    <ProjectProvider project={project}>
      <VersionProvider versions={versions} currentVersion={resolvedVersion}>
        <Layout
          navbar={navbar}
          pageMap={pageMapWithSelectors}
          docsRepositoryBase={`https://github.com/${project.repo.owner}/${project.repo.name}/tree/${resolvedVersion}`}
          editLink={null}
          footer={footer}
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
      </VersionProvider>
    </ProjectProvider>
  );
}
