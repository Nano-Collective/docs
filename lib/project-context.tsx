"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { ProjectConfig } from "./projects";

interface ProjectContextValue {
  project: ProjectConfig;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  children,
  project,
}: {
  children: ReactNode;
  project: ProjectConfig;
}) {
  return (
    <ProjectContext.Provider value={{ project }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
