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
}

export function DocsWrapper({
  toc,
  children,
  metadata,
  sourceCode,
  bottomContent,
}: DocsWrapperProps) {
  const { versions, currentVersion } = useVersion();
  const { project: currentProject } = useProject();
  const components = useMDXComponents({});
  const DefaultWrapper = components.wrapper;

  const isLatestVersion = versions.length > 0 && versions[0] === currentVersion;

  return (
    <DefaultWrapper
      toc={toc}
      metadata={metadata}
      sourceCode={sourceCode ?? ""}
      bottomContent={bottomContent}
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
