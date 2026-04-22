import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { compileMdx } from "nextra/compile";
import { evaluate } from "nextra/evaluate";
import { useMDXComponents } from "../../mdx-components";

function getIndexContent(): string | null {
  const mdxPath = path.join(
    process.cwd(),
    "content",
    "collective",
    "index.mdx",
  );
  if (fs.existsSync(mdxPath)) {
    return fs.readFileSync(mdxPath, "utf-8");
  }
  const mdPath = path.join(process.cwd(), "content", "collective", "index.md");
  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, "utf-8");
  }
  return null;
}

export default async function CollectiveIndexPage() {
  const components = useMDXComponents({});
  const content = getIndexContent();
  if (!content) notFound();

  const compiledSource = await compileMdx(content, {
    filePath: "content/collective/index.mdx",
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
