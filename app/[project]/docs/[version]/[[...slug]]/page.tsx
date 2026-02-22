import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { useMDXComponents } from "../../../../../mdx-components";
import { fetchFileContent, getAllDocsFiles } from "@/lib/github";
import { getVersions, resolveVersion } from "@/lib/versions";
import { getDocPathsForVersion, findDocFile } from "@/lib/page-map-builder";
import { extractTitle } from "@/lib/remote-content";
import { getProject, getAllProjects } from "@/lib/projects";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
	params: Promise<{
		project: string;
		version: string;
		slug?: string[];
	}>;
}

/**
 * Generate all static params for versioned documentation pages
 * Generates params for ALL unique slugs across ALL versions to support 404 pages
 */
export async function generateStaticParams(): Promise<Array<{ project: string; version: string; slug: string[] }>> {
	try {
		const projects = getAllProjects();
		const params: Array<{ project: string; version: string; slug: string[] }> = [];

		for (const project of projects) {
			const versions = await getVersions(project.id, project.repo);
			console.log(`✓ Found versions for ${project.name}:`, versions);

			// Generate params for each version
			for (const version of versions) {
				const paths = await getDocPathsForVersion(project.id, version, project.repo);
				console.log(`✓ Found ${paths.length} docs for ${project.name} ${version}`);

				// Add root page with empty slug array
				params.push({
					project: project.id,
					version,
					slug: []
				});

				// Add all doc paths
				for (const slugPath of paths) {
					if (slugPath.length > 0) {
						params.push({
							project: project.id,
							version,
							slug: slugPath,
						});
					}
				}
			}

			// Add "latest" alias routes
			if (versions.length > 0) {
				const latestVersion = versions[0];
				const latestPaths = await getDocPathsForVersion(project.id, latestVersion, project.repo);

				params.push({
					project: project.id,
					version: "latest",
					slug: []
				});

				for (const slugPath of latestPaths) {
					if (slugPath.length > 0) {
						params.push({
							project: project.id,
							version: "latest",
							slug: slugPath,
						});
					}
				}
			}
		}

		console.log(`✓ Generated ${params.length} static params across all projects`);
		return params;
	} catch (error) {
		console.error("✗ Error in generateStaticParams:", error);
		// Return empty array on error to avoid build failure
		return [];
	}
}

/**
 * Get the first doc file to redirect to when no index exists
 */
async function getFirstDocSlug(
	projectId: string,
	version: string,
	repo: { owner: string; name: string }
): Promise<string | null> {
	const files = await getAllDocsFiles(version, "docs", repo);
	if (files.length === 0) return null;

	// Find first non-index file
	const firstFile = files.find(
		(f) => !f.endsWith("/index.md") && !f.endsWith("/index.mdx")
	);
	if (!firstFile) return null;

	return firstFile
		.replace(/^docs\//, "")
		.replace(/\.(md|mdx)$/, "");
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { project: projectId, version, slug } = await params;
	const project = getProject(projectId);
	if (!project) {
		return { title: "Not Found" };
	}

	const versions = await getVersions(projectId, project.repo);
	const resolvedVersion = resolveVersion(version, versions);

	// If no slug, this will redirect so just return basic metadata
	if (!slug || slug.length === 0) {
		return {
			title: `${project.name} ${resolvedVersion} Documentation`,
			description: `Documentation for ${project.name} ${resolvedVersion}`,
		};
	}

	try {
		const filePath = await findDocFile(projectId, resolvedVersion, slug, project.repo);
		if (!filePath) {
			return { title: "Not Found" };
		}

		const rawMdx = await fetchFileContent(resolvedVersion, filePath, project.repo);
		const title = extractTitle(rawMdx);

		return {
			title: `${title} | ${project.name} ${resolvedVersion}`,
			description: `Documentation for ${project.name} ${resolvedVersion}`,
		};
	} catch {
		return { title: "Not Found" };
	}
}

/**
 * Documentation page component
 */
export default async function DocPage({ params }: PageProps) {
	const { project: projectId, version, slug } = await params;
	const project = getProject(projectId);
	if (!project) {
		notFound();
	}

	const versions = await getVersions(projectId, project.repo);

	// Validate version
	if (version !== "latest" && !versions.includes(version)) {
		notFound();
	}

	const resolvedVersion = resolveVersion(version, versions);

	// If no slug, try to find index or redirect to first doc
	if (!slug || slug.length === 0) {
		const indexFile = await findDocFile(projectId, resolvedVersion, undefined, project.repo);
		if (!indexFile) {
			// No index.md - redirect to first available doc
			const firstSlug = await getFirstDocSlug(projectId, resolvedVersion, project.repo);
			if (firstSlug) {
				redirect(`/${projectId}/docs/${version}/${firstSlug}`);
			}
			notFound();
		}
	}

	// Find the correct file path
	const filePath = await findDocFile(projectId, resolvedVersion, slug, project.repo);
	if (!filePath) {
		notFound();
	}

	// Fetch and compile MDX content
	let rawMdx: string;
	try {
		rawMdx = await fetchFileContent(resolvedVersion, filePath, project.repo);
	} catch {
		notFound();
	}

	// Escape angle brackets followed by numbers (e.g., <100ms) to prevent MDX
	// from interpreting them as JSX elements (element names can't start with numbers)
	const processedMdx = rawMdx.replace(/<(\d)/g, "&lt;$1");

	let compiledSource;
	try {
		compiledSource = await compileMdx(processedMdx, {
			filePath,
			defaultShowCopyCode: true,
			codeHighlight: true,
		});
	} catch (error) {
		console.error(`\n${"=".repeat(60)}`);
		console.error(`MDX COMPILATION ERROR`);
		console.error(`${"=".repeat(60)}`);
		console.error(`File: ${filePath}`);
		console.error(`Project: ${projectId}, Version: ${resolvedVersion}`);
		console.error(`Slug: ${slug?.join("/") || "(index)"}`);
		console.error(`${"─".repeat(60)}`);
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
			if (error.cause) {
				console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
			}
		} else {
			console.error(`Error:`, error);
		}
		console.error(`${"─".repeat(60)}`);
		console.error(`Raw MDX preview (first 500 chars):`);
		console.error(rawMdx.slice(0, 500));
		console.error(`${"=".repeat(60)}\n`);
		throw error;
	}

	// Evaluate the compiled MDX to get the content and metadata
	const components = useMDXComponents({});
	const { default: MDXContent, toc, metadata: mdxMetadata } = evaluate(
		compiledSource,
		components
	);

	// Import DocsWrapper dynamically to avoid SSR issues
	const { DocsWrapper } = await import("@/components/DocsWrapper");

	return (
		<DocsWrapper toc={toc} metadata={mdxMetadata || {}} sourceCode={rawMdx}>
			<MDXContent />
		</DocsWrapper>
	);
}
