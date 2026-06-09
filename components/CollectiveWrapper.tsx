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
  /**
   * The page's route slug (the array segments from the `[...slug]` param
   * joined with `/`). Used to scope the feedback link + count to the
   * current whitepaper. Optional — only required for pages that should
   * render the feedback widget in their header.
   */
  pageSlug?: string;
  sourceCode?: string;
}

export function CollectiveWrapper({
  toc,
  children,
  metadata,
  pageSlug,
  sourceCode,
}: CollectiveWrapperProps) {
  const components = useMDXComponents({});
  const DefaultWrapper = components.wrapper;

  return (
    <DefaultWrapper toc={toc} metadata={metadata} sourceCode={sourceCode ?? ""}>
      <WhitepaperMetaProvider
        value={{
          // Only set `slug` when this page actually lives under
          // /collective/whitepapers/ — the feedback widget only renders
          // there. We pass it from the page component so the provider
          // doesn't have to know about routing.
          slug: pageSlug?.startsWith("whitepapers/")
            ? pageSlug.slice("whitepapers/".length)
            : undefined,
          title: metadata.title,
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
