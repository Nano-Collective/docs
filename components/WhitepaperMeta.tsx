"use client";

import { createContext, type ReactNode, useContext } from "react";
import { ProposerBadge } from "./ProposerBadge";
import { StatusBadge } from "./StatusBadge";

interface WhitepaperMeta {
  proposer?: string;
  proposer_github?: string;
  status?: string;
  review_opens?: string;
  review_closes?: string;
}

const WhitepaperMetaContext = createContext<WhitepaperMeta | null>(null);

export function WhitepaperMetaProvider({
  value,
  children,
}: {
  value: WhitepaperMeta;
  children: ReactNode;
}) {
  return (
    <WhitepaperMetaContext.Provider value={value}>
      {children}
    </WhitepaperMetaContext.Provider>
  );
}

export function WhitepaperMetaInline() {
  const meta = useContext(WhitepaperMetaContext);
  if (!meta) return null;
  if (!meta.proposer && !meta.status) return null;

  return (
    <div className="not-prose flex flex-col gap-2 mt-4 mb-8">
      {meta.proposer && (
        <ProposerBadge name={meta.proposer} github={meta.proposer_github} />
      )}
      {meta.status && (
        <StatusBadge
          status={meta.status}
          reviewOpens={meta.review_opens}
          reviewCloses={meta.review_closes}
        />
      )}
    </div>
  );
}
