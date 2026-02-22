"use client";

import type { Heading } from "nextra";
import { useMDXComponents } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useProject } from "@/lib/project-context";
import { getAllProjects } from "@/lib/projects";
import { useVersion } from "@/lib/version-context";

interface DocsWrapperProps {
  toc: Heading[];
  children: ReactNode;
  metadata: Record<string, unknown>;
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
  const allProjects = getAllProjects();
  const components = useMDXComponents({});
  const DefaultWrapper = components.wrapper;
  const injectedRef = useRef(false);

  // Inject project and version selectors into sidebar using useEffect
  useEffect(() => {
    if (versions.length === 0 || injectedRef.current) return;

    // Find the sidebar - it has class "nextra-sidebar"
    const sidebar = document.querySelector("aside.nextra-sidebar");
    if (!sidebar) {
      console.log("Sidebar not found");
      return;
    }

    // Check if we already added the selectors
    if (
      sidebar.querySelector(".version-selector-container") ||
      sidebar.querySelector(".project-selector-container")
    ) {
      return;
    }

    injectedRef.current = true;

    // ============================================
    // CREATE PROJECT SELECTOR
    // ============================================
    const projectContainer = document.createElement("div");
    projectContainer.className = "project-selector-container";
    projectContainer.style.cssText = `
			padding: 0.75rem 1rem;
			border-bottom: 1px solid #e5e7eb;
			flex-shrink: 0;
		`;

    // Create project label
    const projectLabel = document.createElement("label");
    projectLabel.textContent = "Project";
    projectLabel.style.cssText = `
			display: block;
			font-size: 0.75rem;
			font-weight: 500;
			color: #6b7280;
			margin-bottom: 0.25rem;
		`;

    // Create project select element
    const projectSelect = document.createElement("select");
    projectSelect.setAttribute("aria-label", "Select project");
    projectSelect.style.cssText = `
			width: 100%;
			padding: 0.5rem 2rem 0.5rem 0.75rem;
			font-size: 0.875rem;
			border-radius: 0.375rem;
			border: 1px solid #e5e7eb;
			background-color: transparent;
			color: inherit;
			cursor: pointer;
			appearance: none;
			background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
			background-position: right 0.5rem center;
			background-repeat: no-repeat;
			background-size: 1.5em 1.5em;
		`;

    // Add project options
    allProjects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      if (project.id === currentProject.id) {
        option.selected = true;
      }
      projectSelect.appendChild(option);
    });

    // Disable if only one project
    if (allProjects.length === 1) {
      projectSelect.disabled = true;
      projectSelect.style.cursor = "not-allowed";
      projectSelect.style.opacity = "0.6";
    }

    // Handle project change - always go to latest version
    projectSelect.addEventListener("change", (e) => {
      const newProjectId = (e.target as HTMLSelectElement).value;
      // When switching projects, always go to latest version
      // This avoids 404s when version/slug doesn't exist in new project
      window.location.href = `/${newProjectId}/docs/latest`;
    });

    projectContainer.appendChild(projectLabel);
    projectContainer.appendChild(projectSelect);

    // ============================================
    // CREATE VERSION SELECTOR
    // ============================================
    const versionContainer = document.createElement("div");
    versionContainer.className = "version-selector-container";
    versionContainer.style.cssText = `
			padding: 0.75rem 1rem;
			border-bottom: 1px solid #e5e7eb;
			flex-shrink: 0;
		`;

    // Create version label
    const versionLabel = document.createElement("label");
    versionLabel.textContent = "Version";
    versionLabel.style.cssText = `
			display: block;
			font-size: 0.75rem;
			font-weight: 500;
			color: #6b7280;
			margin-bottom: 0.25rem;
		`;

    // Create version select element
    const versionSelect = document.createElement("select");
    versionSelect.setAttribute("aria-label", "Select documentation version");
    versionSelect.style.cssText = `
			width: 100%;
			padding: 0.5rem 2rem 0.5rem 0.75rem;
			font-size: 0.875rem;
			border-radius: 0.375rem;
			border: 1px solid #e5e7eb;
			background-color: transparent;
			color: inherit;
			cursor: pointer;
			appearance: none;
			background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
			background-position: right 0.5rem center;
			background-repeat: no-repeat;
			background-size: 1.5em 1.5em;
		`;

    // Add version options
    versions.forEach((version, index) => {
      const option = document.createElement("option");
      option.value = version;
      option.textContent = index === 0 ? `${version} (latest)` : version;
      if (version === currentVersion) {
        option.selected = true;
      }
      versionSelect.appendChild(option);
    });

    // Handle version change
    versionSelect.addEventListener("change", (e) => {
      const newVersion = (e.target as HTMLSelectElement).value;
      const currentPath = window.location.pathname;
      // Replace version segment in path: /{project}/docs/{version}/{slug}
      const newPath = currentPath.replace(/\/[^/]+\/docs\/[^/]+/, (match) => {
        const pathParts = match.split("/").filter(Boolean);
        const project = pathParts[0]; // First segment is project
        return `/${project}/docs/${newVersion}`;
      });
      window.location.href = newPath;
    });

    versionContainer.appendChild(versionLabel);
    versionContainer.appendChild(versionSelect);

    // ============================================
    // INSERT BOTH SELECTORS (project first, then version)
    // ============================================
    // Insert version selector first
    sidebar.insertBefore(versionContainer, sidebar.firstChild);
    // Insert project selector first (pushes version selector down)
    sidebar.insertBefore(projectContainer, sidebar.firstChild);
  }, [versions, currentVersion, currentProject, allProjects]);

  return (
    <DefaultWrapper
      toc={toc}
      metadata={metadata}
      sourceCode={sourceCode}
      bottomContent={bottomContent}
    >
      {children}
    </DefaultWrapper>
  );
}
