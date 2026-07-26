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
  /**
   * Release maturity. Anything other than "stable" (the default) renders a
   * badge on the project card so readers know the docs describe a moving
   * target.
   */
  status?: "alpha" | "beta";
  /**
   * Include GitHub pre-releases when resolving documentation versions.
   * Pre-release tags are filtered out by default; alpha/beta projects have no
   * stable release yet, so without this they would have no docs at all.
   */
  includePrereleases?: boolean;
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
    id: "sentinel",
    name: "Sentinel",
    description:
      "Continuous, configurable security and code audits across the repositories in your GitHub organisation, filed as issues for a human to act on.",
    type: "project",
    repo: {
      owner: "Nano-Collective",
      name: "sentinel",
    },
    status: "alpha",
    includePrereleases: true,
  },
  {
    id: "get-md",
    name: "get-md",
    description:
      "A fast, lightweight HTML, PDF, DOCX, and Markdown to Markdown converter optimized for LLM consumption.",
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
  {
    id: "prompt-scrub",
    name: "prompt-scrub",
    description:
      "A local-first tool that strips identifying content out of your prompts before they reach a cloud LLM.",
    type: "library",
    repo: {
      owner: "Nano-Collective",
      name: "prompt-scrubber",
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
