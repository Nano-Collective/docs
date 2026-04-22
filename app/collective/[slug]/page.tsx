import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { useMDXComponents } from "../../../mdx-components";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getCollectiveContent(slug: string): string | null {
  const mdxPath = path.join(
    process.cwd(),
    "content",
    "collective",
    `${slug}.mdx`,
  );
  if (fs.existsSync(mdxPath)) {
    return fs.readFileSync(mdxPath, "utf-8");
  }
  const mdPath = path.join(
    process.cwd(),
    "content",
    "collective",
    `${slug}.md`,
  );
  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, "utf-8");
  }
  return null;
}

function getCollectiveSlugs(): string[] {
  const dir = path.join(process.cwd(), "content", "collective");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx|md)$/, ""))
    .filter((slug) => slug !== "index");
}

export async function generateStaticParams() {
  return getCollectiveSlugs().map((slug) => ({ slug }));
}

export default async function CollectivePage({ params }: PageProps) {
  const { slug } = await params;
  const components = useMDXComponents({});

  const content = getCollectiveContent(slug);
  if (!content) {
    notFound();
  }

  const compiledSource = await compileMdx(content, {
    filePath: `content/collective/${slug}.mdx`,
    defaultShowCopyCode: true,
    codeHighlight: true,
  });

  const {
    default: MDXContent,
    toc,
    metadata: mdxMetadata,
  } = evaluate(compiledSource, components);

  const { CollectiveWrapper } = await import("@/components/CollectiveWrapper");

  return (
    <CollectiveWrapper
      toc={toc}
      metadata={mdxMetadata || {}}
      sourceCode={content}
    >
      <MDXContent />
    </CollectiveWrapper>
  );
}
