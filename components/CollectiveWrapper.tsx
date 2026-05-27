"use client";

import type { $NextraMetadata, Heading } from "nextra";
import { useMDXComponents } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { WhitepaperMetaProvider } from "./WhitepaperMeta";

interface CollectiveWrapperProps {
  toc: Heading[];
  children: ReactNode;
  metadata: $NextraMetadata & {
    proposer?: string;
    proposer_github?: string;
    status?: string;
    review_opens?: string;
    review_closes?: string;
  };
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
    <DefaultWrapper toc={toc} metadata={metadata} sourceCode={sourceCode ?? ""}>
      <WhitepaperMetaProvider
        value={{
          proposer: metadata.proposer,
          proposer_github: metadata.proposer_github,
          status: metadata.status,
          review_opens: metadata.review_opens,
          review_closes: metadata.review_closes,
        }}
      >
        {children}
      </WhitepaperMetaProvider>
    </DefaultWrapper>
  );
}
