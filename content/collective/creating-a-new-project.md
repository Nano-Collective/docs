---
title: "Creating a New Project"
description: "Conventions and playbook for spinning up a new project under the Nano Collective"
sidebar_order: 2
---

# Creating a New Project

Projects under the Nano Collective run independently — each has its own maintainers, release cadence, and roadmap — but they share a consistent approach to how they are structured, tested, released, and presented.

This guide captures those conventions. It is the playbook for spinning up a new repository under the collective. The furthest-ahead reference implementation is [Nanocoder](https://github.com/Nano-Collective/nanocoder); when in doubt, mirror what that project does.

The goal is not bureaucracy. It is to make every project in the collective legible from the outside, lower the barrier for contributors moving between projects, and ensure every tool we ship meets a shared bar for quality and openness.

## Before You Start

A few questions to resolve before opening a new repo:

1. **Does this belong in the collective?** Nano Collective projects are open source, community-oriented, and align with our [values](/collective#what-we-stand-for) (privacy-respecting, local-first, open for all). If a project does not fit, it is better hosted elsewhere.
2. **Is there an existing project it should live in?** Small utilities or extensions may be better as a module inside an existing project than as a new repository.
3. **Who are the initial maintainers?** Every project needs at least one person committed to reviewing PRs, triaging issues, and cutting releases.
4. **Have you discussed it with the collective?** Raise the idea in Discord or as a GitHub discussion before creating the repository. We are not precious about this — it is mainly a sanity check and a chance to surface anyone already working in the space.

## Repository Setup

### Naming

- Repositories live under the [`Nano-Collective`](https://github.com/Nano-Collective) GitHub organisation.
- Use short, lowercase, hyphen-separated names (e.g. `nanocoder`, `get-md`, `json-up`).
- NPM packages, where applicable, are published under the `@nanocollective` scope.

### Top-Level Structure

Every project should include these top-level files:

- `README.md` — the front door to the project (see [README](#readme) below)
- `CONTRIBUTING.md` — how to contribute (see [CONTRIBUTING](#contributing-guide) below)
- `LICENSE` — MIT License, copyright "Nano Collective"
- `CODE_OF_CONDUCT.md` or an equivalent section in `CONTRIBUTING.md`
- `.github/` — workflows, issue templates, PR template
- `docs/` — user-facing documentation (see [Documentation](#documentation) below)
- A package manifest appropriate to the language (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.)

## README

The `README.md` is the front door. It should tell a newcomer what the project is, why it exists, and how to start using it — in that order. Keep it scannable.

Recommended sections, in order:

1. **Title and one-liner** — What is this, in one sentence.
2. **Mission framing** — A short paragraph placing the project in the Nano Collective ("built by the [Nano Collective](https://github.com/Nano-Collective) — a community collective building AI tooling not for profit, but for the community").
3. **Status badges** — Build, coverage, version, downloads, license, stars. Auto-generated badges live in a `badges/` directory and are updated by a workflow.
4. **Quick start** — The fastest path to running the tool. Multiple install methods where relevant (npm, Homebrew, Nix).
5. **Usage examples** — A handful of concrete command or code examples.
6. **Documentation** — Link to the online docs and the local `docs/` folder.
7. **Community** — Discord invite, contributing link, issues / discussions.

Match the tone used across the collective: friendly, mission-driven, action-oriented, no jargon for jargon's sake.

## Contributing Guide

Every project needs a `CONTRIBUTING.md`. It should:

- Welcome contributors of all skill levels explicitly.
- Describe the development setup (prerequisites, clone, install, build, run).
- Document the testing and linting expectations, and point to the single command that runs the full gate.
- Describe coding standards in force for the project (strictness, naming, error handling).
- Document the release process, with a clear note that contributors do not bump versions — that is a maintainer responsibility.
- Include or link to the Code of Conduct.

Mirror [Nanocoder's CONTRIBUTING.md](https://github.com/Nano-Collective/nanocoder/blob/main/CONTRIBUTING.md) as the current reference.

## Licensing

- **License:** MIT.
- **Copyright holder:** `Nano Collective`.
- Do not require individual CLAs. Contributors retain copyright to their contributions; the MIT grant is sufficient.

## Linting and Formatting

Every project should have linting and formatting set up — whatever is idiomatic for the chosen stack. The rules themselves are up to the project; the important thing is that they are codified, enforced in CI, and applied consistently.

Pre-commit hooks that auto-format staged files are a nice-to-have and save a lot of review churn.

## Testing

Every project should have a test suite, coverage reporting, and a single catch-all command that runs the full gate (format, types, lint, tests) so contributors and CI can check a project's state in one go. The framework, test layout, and coverage thresholds are up to the project — pick what fits the stack.

For language- and stack-specific recommendations, see [Stack Suggestions](/collective/stack-suggestions).

## CI / CD

CI runs on GitHub Actions. Every Nano Collective project should have the following workflows:

### `pr-checks.yml`

Runs on every pull request. Jobs run in **parallel** for speed. The following are **required** on every project:

- Linting and formatting
- Type checking (where the stack supports it)
- Tests with coverage threshold enforcement
- Build verification — confirm the expected artefacts are produced
- **Dead code detection** — unused dependencies, exports, and files. Use a tool appropriate to the stack (e.g. Knip for TypeScript).
- **Package security audit** — surface known vulnerabilities in dependencies (e.g. `pnpm audit --audit-level=high`, `cargo audit`, `pip-audit`).
- **Security scanning** — static analysis for common vulnerability classes. Semgrep is the current default; CodeQL or an equivalent is fine. At least one must be wired up.

The three security / hygiene checks (dead code, dependency audit, security scanning) are non-negotiable — they are cheap to run and catch an outsized share of real problems.

### `release.yml`

Runs on pushes to `main`:

- Detect whether the project's version has changed against the published version on its registry.
- If it has, run the full test gate, then publish the release and create a GitHub Release with changelog notes.
- Trigger cascading updates for any other package managers the project supports (Homebrew, Nix, etc.).
- Notify the Discord webhook.

### `update-badges.yml`

Regenerates the status badges referenced from the README.

For canonical, stack-specific implementations of these workflows, see [Nanocoder's `.github/workflows`](https://github.com/Nano-Collective/nanocoder/tree/main/.github/workflows) and the [Stack Suggestions](/collective/stack-suggestions) doc.

## Issue and PR Templates

Every repo should include:

- **Bug report template** — description, environment (OS, versions, provider, model), steps to reproduce, expected vs actual behaviour, logs, a duplicate-check checklist.
- **Feature request template** — description, use case, proposed solution, alternatives, alignment with local-first / privacy-respecting values.
- **Pull request template** — description, type of change, testing notes (automated + manual), a checklist covering style, self-review, docs, logging, and breaking changes.

## Commit Messages

Commits follow a simple convention, derived from Conventional Commits but kept deliberately light:

- `feat: <description>` — new feature
- `fix: <description>` — bug fix
- `mod: <description>` — modification / update to existing behaviour
- `chore(deps): <description>` — dependency update
- `docs: <description>` — documentation-only change
- Scope is optional in parentheses — `feat(config): ...`
- Lowercase, imperative mood, no trailing period
- Release commits: `release: vX.Y.Z`
- Automated updates can use `[skip ci]`

## Documentation

Every project has a `docs/` folder in its repository. These docs are surfaced on the Nano Collective docs site.

### Structure

```
docs/
  index.md                  # Introduction / overview
  community.md              # Community / contribution pointers
  getting-started/
    index.md
    installation.md
    setup.md
  configuration/
    index.md
    ...
  features/
    index.md
    ...
```

### Frontmatter

Every doc page uses YAML frontmatter:

```yaml
---
title: "Page Title"
description: "Brief description used for SEO and link previews"
sidebar_order: 1
---
```

### Tone

Practical and user-focused. Lead with the thing the reader came to do. Use code blocks liberally. Link to reference material rather than duplicating it.

## Visual Identity

Projects should feel like they belong to the same collective without being identical. Shared elements:

- **Fonts** (for web surfaces): Poppins (sans), Lora (serif, headings), Fira Code (mono).
- **Colour scheme:** **Tokyo Night** is the collective's default palette, used in both light and dark variants. Dark mode is the default. Tokens are defined in OKLch so colours stay perceptually consistent across surfaces.
- **Logos:** Each project has its own mark, but the Nano Collective logo should appear somewhere prominent on web surfaces and READMEs.

For CLI projects, theme support (as in Nanocoder) is encouraged — a handful of built-in themes with a consistent token structure (`text`, `base`, `primary`, `secondary`, `success`, `error`, `warning`, `info`, plus diff colours).

## Launch Checklist

Before announcing a new project, run through this list:

- [ ] `README.md` with the sections described above
- [ ] `CONTRIBUTING.md`
- [ ] `LICENSE` (MIT, "Nano Collective")
- [ ] Code of Conduct (file or section)
- [ ] Linting and formatting set up for the chosen stack
- [ ] Test suite with at least a smoke test, full gate command passing
- [ ] Dead code detection wired up (e.g. Knip)
- [ ] Package security audit wired up (e.g. `pnpm audit`)
- [ ] Security scanning wired up (Semgrep, CodeQL, or equivalent)
- [ ] CI workflows: `pr-checks.yml`, `release.yml`, `update-badges.yml`
- [ ] Issue templates (bug, feature) and PR template
- [ ] `docs/` folder with at minimum an `index.md` and `getting-started/`
- [ ] Badges in the README point to real endpoints
- [ ] At least one release published (even a `0.1.0`) so the install path is proven
- [ ] Project listed on the [Nano Collective website](https://nanocollective.org)
- [ ] Announced in Discord

## Ongoing Responsibilities

Maintainers of a project commit to:

- Reviewing incoming PRs within a reasonable window (aim for a week; acknowledge sooner).
- Triaging issues — even a one-line response that confirms the issue has been seen is valuable.
- Cutting releases on a cadence appropriate to the project.
- Keeping documentation in step with the code.
- Flagging to the wider collective when they need help, are stepping back, or are planning a significant change.

If you can no longer maintain a project, say so — the collective can find another maintainer, fold the project into another, or archive it cleanly. Silent abandonment is the worst outcome for users.

## When the Conventions Do Not Fit

These conventions are defaults, not laws. If a project has a good reason to diverge — a different language ecosystem, a genuinely different audience, a testing framework that fits its shape better — that is fine. Document the divergence in the project's `CONTRIBUTING.md` so contributors are not surprised, and raise it with the collective so we can update these docs if the divergence turns out to be a better default.

The conventions exist to reduce friction, not to create it.
