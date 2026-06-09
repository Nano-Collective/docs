"use client";

import { GitPullRequestArrow, MessageCircleQuestion } from "lucide-react";
import { useEffect, useState } from "react";

const FEEDBACK_REPO_OWNER = "Nano-Collective";
const FEEDBACK_REPO_NAME = "docs";

interface IssueCounts {
  open: number;
  closed: number;
  total: number;
}

/**
 * Mirrors Nextra's built-in feedback title format so the issue a reader
 * opens from this widget is indistinguishable from one opened from the
 * right-sidebar "Question? Give us feedback" link, and so the GitHub
 * search query below matches both interchangeably.
 *
 * Nextra's source: `getGitIssueUrl({ title: \`Feedback for "${pageTitle}"\` })`
 * where the quote characters are U+201C and U+201D.
 */
function buildTitlePrefix(title: string): string {
  return `Feedback for \u201C${title}\u201D`;
}

function buildIssueLink(title: string): string {
  const params = new URLSearchParams({
    title: buildTitlePrefix(title),
    body: "",
  });
  return `https://github.com/${FEEDBACK_REPO_OWNER}/${FEEDBACK_REPO_NAME}/issues/new?${params.toString()}`;
}

function buildIssueListLink(title: string, state: "open" | "closed"): string {
  // GitHub's web search uses the same query syntax as the API. We pass
  // the phrase as a quoted string to match exact substrings within the
  // title field, scoped to this repo. The web search page renders
  // `in:title` and `is:state` qualifiers correctly.
  const params = new URLSearchParams();
  params.set(
    "q",
    `repo:${FEEDBACK_REPO_OWNER}/${FEEDBACK_REPO_NAME} is:issue in:title "${buildTitlePrefix(title)}" is:${state}`,
  );
  return `https://github.com/${FEEDBACK_REPO_OWNER}/${FEEDBACK_REPO_NAME}/issues?${params.toString()}`;
}

/**
 * Fetches the latest issue counts from the public GitHub search API.
 * Returns null on failure (offline, rate-limited, etc.) so the UI hides
 * the counts gracefully.
 */
function useIssueCounts(title: string) {
  const [counts, setCounts] = useState<IssueCounts | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    // Build the search query. GitHub's search supports:
    //   - `in:title` qualifier to scope the match to the title field
    //   - phrase matching with double-quoted strings
    //   - `is:open` / `is:closed` for state filtering
    // There is no "starts with" operator, but the phrase match is
    // equivalent for our case because no other issue title legitimately
    // contains `Feedback for "<our whitepaper title>"` as a substring.
    // The `+` separator is the standard GitHub search syntax for
    // combining terms; URLSearchParams encodes spaces as `+` for us.
    const buildQuery = (state: "open" | "closed"): string => {
      const params = new URLSearchParams();
      params.set(
        "q",
        `repo:${FEEDBACK_REPO_OWNER}/${FEEDBACK_REPO_NAME} is:issue in:title "${buildTitlePrefix(title)}" is:${state}`,
      );
      return `https://api.github.com/search/issues?${params.toString()}`;
    };

    const headers: HeadersInit = { Accept: "application/vnd.github+json" };
    Promise.all([
      fetch(buildQuery("open"), { headers, cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(buildQuery("closed"), { headers, cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([openJson, closedJson]) => {
        if (cancelled) return;
        if (!openJson || !closedJson) {
          setStatus("error");
          return;
        }
        const open = Number(openJson.total_count) || 0;
        const closed = Number(closedJson.total_count) || 0;
        setCounts({ open, closed, total: open + closed });
        setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [title]);

  return { counts, status };
}

/**
 * Inline feedback widget rendered in the page header (under the H1) on
 * whitepaper pages, alongside the proposer and status badges.
 *
 * Renders a "Question? Give us feedback" link that opens a pre-filled
 * GitHub issue titled `Feedback for "<title>"` (matching Nextra's
 * default format exactly), plus a live count of open and closed issues
 * whose titles start with that same prefix.
 */
export function WhitepaperFeedbackInline({ title }: { title: string }) {
  const { counts, status } = useIssueCounts(title);

  const newIssueHref = buildIssueLink(title);
  const openListHref = buildIssueListLink(title, "open");
  const closedListHref = buildIssueListLink(title, "closed");

  return (
    <span className="not-prose inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <a
        href={newIssueHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[var(--x-color-primary-600,#7aa2f7)] hover:underline"
      >
        <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
        Question? Give us feedback.
      </a>

      <IssueCountLine
        status={status}
        counts={counts}
        openListHref={openListHref}
        closedListHref={closedListHref}
      />
    </span>
  );
}

function IssueCountLine({
  status,
  counts,
  openListHref,
  closedListHref,
}: {
  status: "idle" | "loading" | "ok" | "error";
  counts: IssueCounts | null;
  openListHref: string;
  closedListHref: string;
}) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--x-color-fg-muted,#888)]">
        <GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden="true" />
        Loading issues…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--x-color-fg-muted,#888)]">
        <GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden="true" />
        Issue count unavailable.
      </span>
    );
  }

  if (status === "ok" && counts) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[var(--x-color-fg-muted,#888)]">
        <GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden="true" />
        {counts.open > 0 ? (
          <a
            href={openListHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-[var(--x-color-fg,#000)] dark:hover:text-white"
          >
            {counts.open} open
          </a>
        ) : (
          <span>0 open</span>
        )}
        {counts.closed > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={closedListHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted hover:text-[var(--x-color-fg,#000)] dark:hover:text-white"
            >
              {counts.closed} closed
            </a>
          </>
        )}
        {counts.total > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{counts.total} total</span>
          </>
        )}
      </span>
    );
  }

  return null;
}
