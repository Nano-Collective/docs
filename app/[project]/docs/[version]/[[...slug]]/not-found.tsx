"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsWrapper } from "@/components/DocsWrapper";
import { useProject } from "@/lib/project-context";
import { useVersion } from "@/lib/version-context";

export default function NotFound() {
  const { currentVersion } = useVersion();
  const { project } = useProject();
  const pathname = usePathname();

  // Extract the slug from the current path
  // Path format: /{project}/docs/{version}/{slug}
  const slug = pathname?.replace(/^\/[^/]+\/docs\/[^/]+\/?/, "") || "";

  return (
    <DocsWrapper toc={[]} metadata={{}}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {slug ? (
            <>
              The page{" "}
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {slug}
              </code>{" "}
              doesn't exist in version <strong>{currentVersion}</strong>.
            </>
          ) : (
            <>
              This doc is not present in version{" "}
              <strong>{currentVersion}</strong>.
            </>
          )}
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href={`/${project.id}/docs/${currentVersion}`}
            className="underline"
          >
            Go home ({currentVersion})
          </Link>
        </div>
      </div>
    </DocsWrapper>
  );
}
