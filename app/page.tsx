import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { MainLayout } from "@/components/MainLayout";
import { getAllProjects } from "@/lib/projects";
import { useMDXComponents } from "../mdx-components";

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
  const components = useMDXComponents({
    HeroSection: () =>
      import("@/components/home/HeroSection").then((mod) => (
        <mod.HeroSection />
      )),
  });

  // Check for local content first
  const localContent = getLocalContent();
  if (localContent) {
    const compiledSource = await compileMdx(localContent, {
      filePath: "content/index.mdx",
      defaultShowCopyCode: true,
      codeHighlight: true,
    });

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
        <p className="mt-4 text-gray-600">No projects configured.</p>
      </div>
    </div>
  );
}
