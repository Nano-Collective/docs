export interface ProjectConfig {
  id: string; // URL slug: "nanocoder"
  name: string; // Display name: "Nanocoder"
  description: string; // Short description for project cards
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
    repo: {
      owner: "Nano-Collective",
      name: "nanotune",
    },
  },
  {
    id: "get-md",
    name: "get-md",
    description: "Extract and convert content to Markdown format.",
    repo: {
      owner: "Nano-Collective",
      name: "get-md",
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

export function isValidProject(id: string): boolean {
  return PROJECTS.some((project) => project.id === id);
}
