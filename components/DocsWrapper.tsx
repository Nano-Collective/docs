"use client";

import type { $NextraMetadata, Heading } from "nextra";
import { useMDXComponents } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { useProject } from "@/lib/project-context";
import { useVersion } from "@/lib/version-context";
import { PagefindMetadata } from "./PagefindMetadata";

interface DocsWrapperProps {
  toc: Heading[];
  children: ReactNode;
  metadata: $NextraMetadata;
  sourceCode?: string;
  bottomContent?: ReactNode;
  editUrl?: string;
}

export function DocsWrapper({
  toc,
  children,
  metadata,
  sourceCode,
  bottomContent,
  editUrl,
}: DocsWrapperProps) {
  const { versions, currentVersion } = useVersion();
  const { project: currentProject } = useProject();
  const components = useMDXComponents({});
  const DefaultWrapper = components.wrapper;

  const isLatestVersion = versions.length > 0 && versions[0] === currentVersion;

  const editContent = editUrl ? (
    <div className="mt-8 pt-4 border-t">
      <a
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        Edit this page on GitHub →
      </a>
    </div>
  ) : null;

  const combinedBottomContent = (
    <>
      {editContent}
      {bottomContent}
    </>
  );

  return (
    <DefaultWrapper
      toc={toc}
      metadata={metadata}
      sourceCode={sourceCode ?? ""}
      bottomContent={combinedBottomContent}
    >
      <PagefindMetadata
        project={currentProject.id}
        projectName={currentProject.name}
        version={currentVersion}
        isLatestVersion={isLatestVersion}
      />
      {children}
    </DefaultWrapper>
  );
}
