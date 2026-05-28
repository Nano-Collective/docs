/**
 * Applies the archive timeline rules to whitepapers in
 * content/collective/whitepapers/. Runs daily via the
 * `archive-whitepapers` GitHub Action.
 *
 * Rules (also documented at
 * /collective/projects/how-a-project-comes-to-life):
 *
 *   Shipped     -> delete 90 days after status_changed_on
 *   Paused      -> delete 90 days after status_changed_on
 *   Declined    -> delete 30 days after status_changed_on
 *   Superseded  -> delete immediately
 *
 * Archiving deletes the whitepaper file outright. Git history is the
 * archive; once the window elapses, the page is gone from the live site
 * and no longer resolves at its URL.
 *
 * A whitepaper that enters a terminal status MUST also carry a
 * `status_changed_on: <ISO date>` field. Without it, this script warns
 * and leaves the file in place.
 */

import fs from "node:fs";
import path from "node:path";

const WHITEPAPERS_DIR = path.join(
  process.cwd(),
  "content",
  "collective",
  "whitepapers",
);

const ARCHIVE_WINDOW_DAYS: Record<string, number> = {
  Shipped: 90,
  Paused: 90,
  Declined: 30,
  Superseded: 0,
};

const TERMINAL_STATUSES = Object.keys(ARCHIVE_WINDOW_DAYS);

interface WhitepaperFile {
  slug: string;
  filePath: string;
  frontmatter: Record<string, string | number>;
}

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(raw: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return out;
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    const value = unquote(m[2]);
    if (/^-?\d+$/.test(value)) out[key] = parseInt(value, 10);
    else out[key] = value;
  }
  return out;
}

function readAll(): WhitepaperFile[] {
  if (!fs.existsSync(WHITEPAPERS_DIR)) return [];
  const out: WhitepaperFile[] = [];
  for (const file of fs.readdirSync(WHITEPAPERS_DIR)) {
    if (!file.endsWith(".md") || file === "index.md") continue;
    const filePath = path.join(WHITEPAPERS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    out.push({
      slug: file.replace(/\.md$/, ""),
      filePath,
      frontmatter: parseFrontmatter(raw),
    });
  }
  return out;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shouldDelete(
  file: WhitepaperFile,
  today: string,
): { remove: boolean; reason?: string } {
  const status = String(file.frontmatter.status ?? "");
  if (!TERMINAL_STATUSES.includes(status)) {
    return { remove: false, reason: "not a terminal status" };
  }
  const changedOn = file.frontmatter.status_changed_on;
  if (!changedOn) {
    return {
      remove: false,
      reason: `terminal status \`${status}\` but no status_changed_on set`,
    };
  }
  const elapsed = daysBetween(String(changedOn), today);
  const window = ARCHIVE_WINDOW_DAYS[status];
  if (elapsed < window) {
    return {
      remove: false,
      reason: `${elapsed}/${window} days elapsed since status_changed_on`,
    };
  }
  return { remove: true };
}

function main(): void {
  const today = todayIso();
  console.log(`Checking whitepapers for archival on ${today}`);
  const all = readAll();

  let deletedThisRun = 0;
  for (const file of all) {
    const decision = shouldDelete(file, today);
    if (decision.remove) {
      fs.unlinkSync(file.filePath);
      console.log(`  deleted ${file.slug} (${file.frontmatter.status})`);
      deletedThisRun += 1;
    } else if (
      TERMINAL_STATUSES.includes(String(file.frontmatter.status ?? ""))
    ) {
      console.log(`  skip ${file.slug}: ${decision.reason}`);
    }
  }

  console.log(`Done. Deleted ${deletedThisRun} whitepaper(s) this run.`);
}

main();
