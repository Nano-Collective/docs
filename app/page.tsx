import { redirect } from "next/navigation";
import { getAllProjects } from "@/lib/projects";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { useMDXComponents } from "../mdx-components";
import { MainLayout } from "@/components/MainLayout";
import fs from "fs";
import path from "path";

function getLocalContent(): string | null {
	const contentPath = path.join(process.cwd(), "content", "index.mdx");
	if (fs.existsSync(contentPath)) {
		return fs.readFileSync(contentPath, "utf-8");
	}
	const mdContentPath = path.join(process.cwd(), "content", "index.md");
	if (fs.existsSync(mdContentPath)) {
		return fs.readFileSync(mdContentPath, "utf-8");
	}
	return null;
}

export default async function HomePage() {
	// Check for local content first
	const localContent = getLocalContent();
	if (localContent) {
		const compiledSource = await compileMdx(localContent, {
			filePath: "content/index.mdx",
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

	// No local content - redirect to first project
	const defaultProject = getAllProjects()[0];
	if (defaultProject) {
		redirect(`/${defaultProject.id}`);
	}
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Documentation</h1>
				<p className="mt-4 text-gray-600">
					No projects configured.
				</p>
			</div>
		</div>
	);
}
