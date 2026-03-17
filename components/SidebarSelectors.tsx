"use client";

import { useCallback, useEffect, useState } from "react";
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
    <div className="sidebar-selector-item">
      <p className="sidebar-selector-label">{label}</p>
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

export function SidebarSelectors() {
  const { versions, currentVersion } = useVersion();
  const { project: currentProject } = useProject();
  const allProjects = getAllProjects();

  if (versions.length === 0) return null;

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
    <div className="sidebar-selectors">
      <SidebarSelector
        label="Project"
        value={currentProject.id}
        displayValue={currentProject.name}
        onValueChange={(id) => {
          window.location.href = `/${id}/docs/latest`;
        }}
        disabled={allProjects.length === 1}
        items={allProjects.map((p) => ({ value: p.id, label: p.name }))}
      />
      <SidebarSelector
        label="Version"
        value={currentVersion}
        displayValue={versionDisplay}
        onValueChange={handleVersionChange}
        items={versions.map((v, i) => ({
          value: v,
          label: i === 0 ? `${v} (latest)` : v,
        }))}
      />
    </div>
  );
}
