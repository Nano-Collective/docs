import { getProject, getAllProjects } from "@/lib/projects";
import { notFound, redirect } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { useMDXComponents } from "../../mdx-components";
import { MainLayout } from "@/components/MainLayout";
import fs from "fs";
import path from "path";

interface PageProps {
	params: Promise<{
		project: string;
	}>;
}

function getLocalContent(slug: string): string | null {
	const mdxPath = path.join(process.cwd(), "content", `${slug}.mdx`);
	if (fs.existsSync(mdxPath)) {
		return fs.readFileSync(mdxPath, "utf-8");
	}
	const mdPath = path.join(process.cwd(), "content", `${slug}.md`);
	if (fs.existsSync(mdPath)) {
		return fs.readFileSync(mdPath, "utf-8");
	}
	return null;
}

function getLocalContentSlugs(): string[] {
	const contentDir = path.join(process.cwd(), "content");
	if (!fs.existsSync(contentDir)) return [];
	return fs
		.readdirSync(contentDir)
		.filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
		.filter((f) => f !== "index.mdx" && f !== "index.md")
		.map((f) => f.replace(/\.(mdx|md)$/, ""));
}

export async function generateStaticParams() {
	const projects = getAllProjects();
	const projectParams = projects.map((project) => ({
		project: project.id,
	}));

	// Also generate params for local content files
	const contentSlugs = getLocalContentSlugs();
	const contentParams = contentSlugs.map((slug) => ({
		project: slug,
	}));

	return [...projectParams, ...contentParams];
}

export default async function ProjectPage({ params }: PageProps) {
	const { project: projectId } = await params;

	// Check for local content first
	const localContent = getLocalContent(projectId);
	if (localContent) {
		const compiledSource = await compileMdx(localContent, {
			filePath: `content/${projectId}.mdx`,
			defaultShowCopyCode: true,
			codeHighlight: true,
		});

		const components = useMDXComponents({});
		const { default: MDXContent } = evaluate(compiledSource, components);

		return (
			<MainLayout>
				<MDXContent />
			</MainLayout>
		);
	}

	// No local content - check if it's a valid project
	const project = getProject(projectId);
	if (!project) {
		notFound();
	}

	redirect(`/${projectId}/docs`);
}
