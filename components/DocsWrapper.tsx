"use client";

import type { $NextraMetadata, Heading } from "nextra";
import { useMDXComponents } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useProject } from "@/lib/project-context";
import { getAllProjects } from "@/lib/projects";
import { useVersion } from "@/lib/version-context";
import { PagefindMetadata } from "./PagefindMetadata";

interface DocsWrapperProps {
  toc: Heading[];
  children: ReactNode;
  metadata: $NextraMetadata;
  sourceCode?: string;
  bottomContent?: ReactNode;
}

function SidebarSelector({
  label,
  value,
  displayValue,
  onValueChange,
  disabled,
  items,
}: {
  label: string;
  value: string;
  displayValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  items: { value: string; label: string }[];
}) {
  const [inputValue, setInputValue] = useState(displayValue);

  // Sync when displayValue changes externally (e.g. navigation)
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setInputValue("");
  }, []);

  const handleValueChange = useCallback(
    (val: unknown) => {
      if (!val) return;
      const selected = items.find((item) => item.value === val);
      if (selected) setInputValue(selected.label);
      onValueChange(val as string);
    },
    [items, onValueChange],
  );

  const filteredItems = items.filter(
    (item) =>
      !inputValue ||
      item.label.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--muted-foreground)",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </p>
      <Combobox
        value={value}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        inputValue={inputValue}
        onInputValueChange={(val) => setInputValue(val)}
        disabled={disabled}
      >
        <ComboboxInput placeholder={`Search ${label}...`} />
        <ComboboxContent>
          <ComboboxList>
            {filteredItems.map((item) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
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

  const [projectContainer, setProjectContainer] = useState<HTMLElement | null>(
    null,
  );
  const [versionContainer, setVersionContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    if (versions.length === 0) return;

    const sidebar = document.querySelector("aside.nextra-sidebar");
    if (!sidebar || sidebar.querySelector(".version-selector-container"))
      return;

    const projDiv = document.createElement("div");
    projDiv.className = "project-selector-container";
    const verDiv = document.createElement("div");
    verDiv.className = "version-selector-container";

    sidebar.insertBefore(verDiv, sidebar.firstChild);
    sidebar.insertBefore(projDiv, sidebar.firstChild);

    setProjectContainer(projDiv);
    setVersionContainer(verDiv);
  }, [versions]);

  const handleVersionChange = (newVersion: string) => {
    const newPath = window.location.pathname.replace(
      /\/[^/]+\/docs\/[^/]+/,
      (match) => {
        const project = match.split("/").filter(Boolean)[0];
        return `/${project}/docs/${newVersion}`;
      },
    );
    window.location.href = newPath;
  };

  const isLatestVersion = versions.length > 0 && versions[0] === currentVersion;
  const versionDisplay = isLatestVersion
    ? `${currentVersion} (latest)`
    : currentVersion;

  return (
    <>
      {projectContainer &&
        createPortal(
          <SidebarSelector
            label="Project"
            value={currentProject.id}
            displayValue={currentProject.name}
            onValueChange={(id) => {
              window.location.href = `/${id}/docs/latest`;
            }}
            disabled={allProjects.length === 1}
            items={allProjects.map((p) => ({ value: p.id, label: p.name }))}
          />,
          projectContainer,
        )}
      {versionContainer &&
        createPortal(
          <SidebarSelector
            label="Version"
            value={currentVersion}
            displayValue={versionDisplay}
            onValueChange={handleVersionChange}
            items={versions.map((v, i) => ({
              value: v,
              label: i === 0 ? `${v} (latest)` : v,
            }))}
          />,
          versionContainer,
        )}
      <DefaultWrapper
        toc={toc}
        metadata={metadata}
        sourceCode={sourceCode ?? ""}
        bottomContent={bottomContent}
      >
        <PagefindMetadata
          project={currentProject.id}
          projectName={currentProject.name}
          version={currentVersion}
          isLatestVersion={isLatestVersion}
        />
        {children}
      </DefaultWrapper>
    </>
  );
}
