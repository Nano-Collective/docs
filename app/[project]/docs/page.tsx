import { notFound, redirect } from "next/navigation";
import { getAllProjects, getProject } from "@/lib/projects";
import { getLatestVersion } from "@/lib/versions";

interface PageProps {
  params: Promise<{
    project: string;
  }>;
}

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    project: project.id,
  }));
}

export default async function ProjectDocsPage({ params }: PageProps) {
  const { project: projectId } = await params;
  const project = getProject(projectId);
  if (!project) {
    notFound();
  }

  const latestVersion = await getLatestVersion(projectId, project.repo);
  if (latestVersion) {
    redirect(`/${projectId}/docs/${latestVersion}`);
  }
  notFound();
}
