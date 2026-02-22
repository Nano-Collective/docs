"use client";

import { createContext, type ReactNode, useContext } from "react";

interface VersionContextValue {
  versions: string[];
  currentVersion: string;
}

const VersionContext = createContext<VersionContextValue | null>(null);

export function VersionProvider({
  children,
  versions,
  currentVersion,
}: {
  children: ReactNode;
  versions: string[];
  currentVersion: string;
}) {
  return (
    <VersionContext.Provider value={{ versions, currentVersion }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (!context) {
    return { versions: [], currentVersion: "" };
  }
  return context;
}
