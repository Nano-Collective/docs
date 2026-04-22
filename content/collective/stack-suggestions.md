---
title: "Stack Suggestions"
description: "Suggested tooling and conventions per language stack for Nano Collective projects"
sidebar_order: 3
---

# Stack Suggestions

The [Creating a New Project](/collective/creating-a-new-project) guide is intentionally stack-agnostic — it describes *what* every project needs (tests, linting, CI, docs, etc.) without mandating *how*. This doc fills in the *how* for each stack we actively use in the collective.

These are suggestions, not mandates. They represent what is working well today in existing Nano Collective projects, so a new project using the same stack can hit the ground running without re-deciding everything from scratch. If you have a good reason to diverge, diverge — and consider opening a PR on this doc if your approach is worth sharing.

The canonical reference implementation for most of these suggestions is [Nanocoder](https://github.com/Nano-Collective/nanocoder).

## TypeScript / Node

Most existing collective projects are TypeScript on Node. If you are starting another, the defaults below will make the project look and feel consistent with the rest of the collective.

### Core Toolchain

- **Package manager:** `pnpm` (v10+)
- **Node version:** 20+ (22 used in CI)
- **Module system:** ESM
- **TypeScript config:** `strict: true`, ESNext target
- **Path aliases:** `@/*` mapped to `source/*` (via `tsconfig.json` `paths` + `tsc-alias` at build time)

### Linting and Formatting

**Biome** is the collective's current default — it covers both linting and formatting in a single tool and is fast enough to run on every keystroke.

Typical `biome.json` settings:

- Indentation: tabs, width 2
- Line endings: LF
- Line width: 80
- Quotes: single (double for JSX)
- Semicolons: always
- Trailing commas: all
- Bracket spacing: off (`{foo}` not `{ foo }`)
- Arrow parentheses: as needed
- `noUnusedVariables`, `noUnusedImports`, `useExhaustiveDependencies` set to `error`
- `noExplicitAny` set to `warn`

Copy [Nanocoder's `biome.json`](https://github.com/Nano-Collective/nanocoder/blob/main/biome.json) as a starting point and adjust from there.

### Pre-commit Hooks

**Husky + lint-staged** to auto-format staged files on commit. Typical config formats `.js`, `.ts`, `.jsx`, `.tsx`, `.json`, and `.md`.

### Testing

- **Framework:** AVA, loaded via `tsx` for TypeScript support.
- **Layout:** `.spec.ts` files alongside the source they test. For larger suites, a `__tests__/` subdirectory within the source directory.
- **Execution:** Serial (`serial: true`, `workerThreads: false`). This is required for Ink / React CLI components and keeps behaviour predictable.
- **Coverage:** `c8` for reporting. Enforce an **80% line threshold** in CI and fail on coverage drop.

### Scripts

The scripts below keep the test surface consistent across TypeScript projects in the collective:

- `pnpm test:ava` — run the test suite
- `pnpm test:ava:coverage` — run with coverage
- `pnpm test:lint` — Biome lint check
- `pnpm test:format` — Biome format check
- `pnpm test:types` — `tsc --noEmit`
- `pnpm test:all` — the catch-all: format, types, lint, tests, dependency audit, unused-code check (Knip)

`pnpm test:all` is the single command a contributor or CI should be able to run to know whether the project is in a green state.

### CI Specifics

The `pr-checks.yml` workflow runs each of the above as parallel jobs for speed. Add:

- `knip` — unused dependency / export detection
- `pnpm audit --audit-level=high`
- Semgrep + CodeQL scans

For the `release.yml` workflow, the pattern is: compare `package.json` version against NPM, and if different, run the full gate and publish. See [Nanocoder's release workflow](https://github.com/Nano-Collective/nanocoder/blob/main/.github/workflows/release.yml) for the canonical implementation.

### Distribution

- **NPM scope:** `@nanocollective`
- **Other package managers:** Homebrew taps and Nix flakes are both in use — see Nanocoder for examples of both. They are triggered as cascading jobs from `release.yml`.

## Other Stacks

We do not yet have deep projects with other stacks at a collective level. If you are starting a project in Python, Rust, Go, or anything else, you have a free hand — pick the idiomatic tooling for that ecosystem.

If your project ends up working well and you think its conventions are worth codifying, open a PR adding a section here so future projects can start from a known-good baseline.
