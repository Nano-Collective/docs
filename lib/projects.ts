export interface ProjectConfig {
  id: string; // URL slug: "nanocoder"
  name: string; // Display name: "Nanocoder"
  description: string; // Short description for project cards
  type: "project" | "library"; // Distinguish between applications and libraries
  repo: {
    owner: string; // "Nano-Collective"
    name: string; // "nanocoder"
  };
  docsPath?: string; // Default: "docs"
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: "nanocoder",
    name: "Nanocoder",
    description:
      "A beautiful privacy-first coding agent running in your terminal",
    type: "project",
    repo: {
      owner: "Nano-Collective",
      name: "nanocoder",
    },
  },
  {
    id: "nanotune",
    name: "Nanotune",
    description:
      "A simple, interactive CLI for fine-tuning small language models on Apple Silicon.",
    type: "project",
    repo: {
      owner: "Nano-Collective",
      name: "nanotune",
    },
  },
  {
    id: "get-md",
    name: "get-md",
    description:
      "A fast, lightweight HTML to Markdown converter optimized for LLM consumption.",
    type: "library",
    repo: {
      owner: "Nano-Collective",
      name: "get-md",
    },
  },
  {
    id: "json-up",
    name: "json-up",
    description:
      "A fast, type-safe JSON migration tool with Zod schema validation.",
    type: "library",
    repo: {
      owner: "Nano-Collective",
      name: "json-up",
    },
  },
  // Add more projects here
];

export function getProject(id: string): ProjectConfig | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export function getAllProjects(): ProjectConfig[] {
  return PROJECTS;
}

export function getApps(): ProjectConfig[] {
  return PROJECTS.filter((p) => p.type === "project");
}

export function getLibraries(): ProjectConfig[] {
  return PROJECTS.filter((p) => p.type === "library");
}

export function isValidProject(id: string): boolean {
  return PROJECTS.some((project) => project.id === id);
}
