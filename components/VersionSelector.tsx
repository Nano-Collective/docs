"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

interface VersionSelectorProps {
  versions: string[];
  currentVersion: string;
}

export function VersionSelector({
  versions,
  currentVersion,
}: VersionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleVersionChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newVersion = event.target.value;
      if (newVersion === currentVersion) return;

      // Replace version segment in current path
      // /{project}/docs/{version}/{slug} -> /{project}/docs/{newVersion}/{slug}
      const newPath = pathname.replace(/\/[^/]+\/docs\/[^/]+/, (match) => {
        const pathParts = match.split("/").filter(Boolean);
        const project = pathParts[0]; // First segment is project
        return `/${project}/docs/${newVersion}`;
      });

      router.push(newPath);
    },
    [currentVersion, pathname, router],
  );

  // Display current version with "latest" badge if it's the latest
  const isLatest = currentVersion === versions[0];
  const _displayVersion = isLatest
    ? `${currentVersion} (latest)`
    : currentVersion;

  return (
    <div className="nextra-version-selector">
      <label htmlFor="version-select" className="sr-only">
        Select documentation version
      </label>
      <select
        id="version-select"
        value={currentVersion}
        onChange={handleVersionChange}
        className="nextra-select"
        aria-label="Select documentation version"
      >
        {versions.map((version, index) => (
          <option key={version} value={version}>
            {index === 0 ? `${version} (latest)` : version}
          </option>
        ))}
      </select>
      <style jsx>{`
				.nextra-version-selector {
					padding: 0.5rem 1rem;
					border-bottom: 1px solid var(--nextra-border-color, #e5e7eb);
				}

				:global(.dark) .nextra-version-selector {
					border-bottom-color: var(--nextra-border-color, #374151);
				}

				.nextra-select {
					width: 100%;
					padding: 0.5rem 0.75rem;
					font-size: 0.875rem;
					line-height: 1.25rem;
					border-radius: 0.375rem;
					border: 1px solid var(--nextra-border-color, #e5e7eb);
					background-color: transparent;
					color: inherit;
					cursor: pointer;
					appearance: none;
					background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
					background-position: right 0.5rem center;
					background-repeat: no-repeat;
					background-size: 1.5em 1.5em;
					padding-right: 2.5rem;
				}

				:global(.dark) .nextra-select {
					border-color: var(--nextra-border-color, #374151);
				}

				.nextra-select:hover {
					border-color: var(--nextra-primary-color, #3b82f6);
				}

				.nextra-select:focus {
					outline: none;
					border-color: var(--nextra-primary-color, #3b82f6);
					box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
				}

				.sr-only {
					position: absolute;
					width: 1px;
					height: 1px;
					padding: 0;
					margin: -1px;
					overflow: hidden;
					clip: rect(0, 0, 0, 0);
					white-space: nowrap;
					border-width: 0;
				}
			`}</style>
    </div>
  );
}
