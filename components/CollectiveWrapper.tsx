"use client";

import type { $NextraMetadata, Heading } from "nextra";
import { useMDXComponents } from "nextra-theme-docs";
import type { ReactNode } from "react";

interface CollectiveWrapperProps {
  toc: Heading[];
  children: ReactNode;
  metadata: $NextraMetadata;
  sourceCode?: string;
}

export function CollectiveWrapper({
  toc,
  children,
  metadata,
  sourceCode,
}: CollectiveWrapperProps) {
  const components = useMDXComponents({});
  const DefaultWrapper = components.wrapper;

  return (
    <DefaultWrapper
      toc={toc}
      metadata={metadata}
      sourceCode={sourceCode ?? ""}
    >
      {children}
    </DefaultWrapper>
  );
}
