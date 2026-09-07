---
title: "Project Infrastructure"
description: "Wiring a project up to the collective's shared CI, checks, rulesets, and release conventions"
sidebar_order: 6
---

# Project Infrastructure

Every project in the collective runs the same pull request checks, enforces them
the same way, and releases the same way. None of it is copied into each
repository — it lives in one place,
[`Nano-Collective/.github`](https://github.com/Nano-Collective/.github), and each
project calls it.

This page is the setup guide. A new repository should be able to reach the same
quality bar as `nanocoder` in about twenty lines of configuration.

There are four layers, and they are independent — adopt them in order, but a
project is useful after the first:

| Layer | What it does | Lives in |
|---|---|---|
| [Pull request checks](#what-you-get) | Runs the tests | shared workflow + a caller |
| [Rulesets](#the-rulesets) | Makes them mandatory | applied by script |
| [Release automation](#release-automation) | Version PRs and publishing | shared workflows + a scaffold |
| [Code review](#automated-code-review) | Reviews what tests cannot | shared workflow + a local rubric |

**The gate is automated, not human.** That is the load-bearing decision behind
all of this: a passing test suite is what stands between a change and `main`,
rather than a queue for one person's attention. Everything below follows from
it.

## Why it is shared

Every repository used to carry its own copy of `pr-checks.yml`. They drifted.
Job names diverged, one project's checks were a single coarse job with no
coverage gate, two projects had no pull request checks at all despite having full
test suites, and a coverage-drop setting was declared in one workflow and never
actually read.

With one definition, a change to the check set is one pull request rather than a
hand edit per repository, and every new project inherits the whole apparatus on
day one.

## What you get

Calling the shared workflow gives you nine checks in two groups, plus a tenth
that only runs if you opt into changesets.

**Blocking** — these are the checks the organisation's quality ruleset requires.
A red one stops the merge.

| Check | Runs |
|---|---|
| Linting | `pnpm test:lint` |
| Type Checks | `pnpm test:types` |
| Format Checks | `pnpm test:format` |
| Unused Dependencies | `pnpm test:knip` |
| Unit Tests & Coverage Analysis | `pnpm test:ava:coverage`, then the coverage floor and drop check |
| Verify Build | `pnpm build`, then asserts the output directory is non-empty |

**Advisory** — these run on every pull request and report, but never fail it.

| Check | Runs |
|---|---|
| Package Audit Analysis | `pnpm test:audit` |
| Semgrep Security Scan | `semgrep scan --config auto --error`, in the `semgrep/semgrep` container |
| CodeQL Security Analysis | GitHub CodeQL |

Advisory is deliberate. These depend on upstream advisory feeds and third-party
scanners, so a disclosure landing overnight must not block an unrelated
contributor's bug fix. They tell you something is wrong; they do not hold the
queue hostage while you fix it.

**Conditional** — `Changeset Validation`, which runs only when
`validate-changesets: true`. Because it is skipped otherwise, it must **not** be
added to the required status checks: a skipped job never reports, and a required
check that never reports blocks the merge forever.

## Setting up a new project

### 1. Provide the script contract

The shared workflow calls package scripts, so a project only has to agree on
their names. Add all of these to `package.json`:

```json
{
  "scripts": {
    "build": "…",
    "test:lint": "biome lint .",
    "test:format": "biome ci --formatter-enabled=true --linter-enabled=false --assist-enabled=false .",
    "test:types": "tsc --noEmit",
    "test:ava": "ava",
    "test:ava:coverage": "c8 --reporter=text --reporter=json-summary ava",
    "test:knip": "knip",
    "test:audit": "pnpm audit --audit-level=high --ignore-unfixable",
    "test:security": "semgrep scan --config auto --error",
    "test:all": "…runs the above…"
  }
}
```

Two details that will bite otherwise:

- **`test:lint` is `biome lint .`, not `biome check .`.** `check` runs the
  formatter too, which is what `test:format` is for. One project had them
  conflated and no `test:format` at all.
- **`test:ava:coverage` should emit `json-summary`.** The workflow regenerates it
  if missing, but emitting it directly is one less thing to go wrong.

If you add `test:security`, add `semgrep` to `ignoreBinaries` in `knip.json` —
it is a system binary, not a dependency, and knip will otherwise fail.

### 2. Add the caller workflow

Create `.github/workflows/pr-checks.yml`:

```yaml
name: Pull Request Automated Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

permissions:
  actions: read
  contents: read
  security-events: write

jobs:
  pr-checks:
    uses: Nano-Collective/.github/.github/workflows/pr-checks.yml@main
```

That is the whole file for a standard project.

### What this does not cover

The caller above is scoped `branches: [main]`, and the rulesets target the
default branch. **Pull requests into a long-lived feature branch therefore get
no checks, and no ruleset applies to them.**

Nothing unverified reaches `main` — the eventual `feature/x` → `main` pull
request is checked like any other — but the feature branch itself integrates
blind until that point, and by then the diff is several contributions wide and
correspondingly hard to unpick.

If your project uses long-lived feature branches, widen both to match:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, 'feature/**']
```

and scope the ruleset to the same set. Otherwise, know that "every pull request
is checked" means every pull request *into `main`*.

### 3. Commit a coverage badge

The coverage **drop** check reads its baseline from `badges/coverage.svg` on the
base branch, which `update-badges.yml` keeps current. A project without the badge
skips the drop check rather than failing, so this can come later — but until it
exists, only the absolute floor is enforced.

## Options

Pass inputs only when the defaults do not fit:

| Input | Default | Use when |
|---|---|---|
| `coverage-threshold` | `80` | The project cannot yet meet the floor. See below. |
| `fail-on-coverage-drop` | `true` | Rarely changed. |
| `verify-build` | `true` | The project has no build step. |
| `build-before-tests` | `true` | Tests run purely against source, never a built binary. |
| `build-output-dir` | `dist` | The build writes somewhere else. |
| `node-version` | `'22'` | Almost never. |
| `validate-changesets` | `false` | The project uses changesets. See [Release automation](#release-automation). |

```yaml
jobs:
  pr-checks:
    uses: Nano-Collective/.github/.github/workflows/pr-checks.yml@main
    with:
      coverage-threshold: 71
```

### On lowering the coverage floor

The standard is **80% with fail-on-drop**. A project below it should pin the
floor just under its current coverage rather than sit permanently red — a red
check that everyone learns to ignore is worse than no check, and it punishes
contributors for debt they did not create.

Pinning still ratchets: fail-on-drop means coverage cannot regress from that
point. Treat the input as temporary, comment it with the issue tracking the gap,
and delete it when the project reaches 80.

## The rulesets

Checks that run but do not block are advice. Two rulesets turn them into a gate,
and they are deliberately kept apart rather than combined into one.

| | **Quality gates** | **Review gates** |
|---|---|---|
| Rules | the six blocking status checks, no force-push, no deletion | one approving review, code-owner review, thread resolution |
| Bypass | organisation admins only | organisation admins **and** anyone with `maintain` |

**Why two.** Bypass is all-or-nothing per ruleset. A maintainer has to be able to
merge their own work — GitHub does not let you approve your own pull request, so
a single ruleset with a review requirement routes every maintainer's output
through somebody else. But granting bypass on a combined ruleset would also hand
them the right to merge failing tests.

Splitting gives both properties at once: **review is bypassable by maintainers,
tests are not.** A maintainer merges without waiting for an approval and still
cannot merge red.

The admin bypass on Quality gates is break-glass, and it is worth watching. It is
the same mechanism that produces a rubber-stamp culture if it becomes routine —
if it is being used regularly, the gate is not doing its job.

### Applying them

The organisation is on GitHub Free, which has no organisation-level rulesets, so
they are applied per repository by a script rather than defined once centrally:

```bash
cd .github
./scripts/sync-rulesets.sh preflight        # readiness report, read-only
./scripts/sync-rulesets.sh apply quality
./scripts/sync-rulesets.sh enforce quality  # evaluate -> active
./scripts/sync-rulesets.sh verify
```

Re-run it when a repository drifts or a new one is created.

**Order matters, and getting it wrong makes every open pull request
unmergeable.** The status checks must exist and be reporting *before* Quality
gates is enforced — a pull request whose workflow never ran reports nothing, and
nothing can never satisfy a required check. `preflight` refuses to let you
enforce blind: it reports how many of the six checks actually report per
repository, and how many workflow runs are stuck awaiting approval.

Roll out in `evaluate` mode first, read a day of results, then flip to `active`.

### Check names

Required status checks must use the **prefixed** name, because jobs called
through a reusable workflow are reported as `<caller job>/<job name>`:

```
pr-checks / Linting
pr-checks / Type Checks
pr-checks / Format Checks
pr-checks / Unused Dependencies
pr-checks / Unit Tests & Coverage Analysis
pr-checks / Verify Build
```

The bare name matches nothing, and neither does the longer string the rulesets
**UI** displays — that is a display label, not the matched context. A ruleset
configured with the wrong string reports *"6 of 6 required status checks are
expected"* forever and blocks every merge, which looks like a broken workflow
rather than a typo.

### A trap worth knowing

`bypass_actors: []` means *nobody* — including automation. A ruleset with an
empty bypass list stops scheduled jobs pushing to their own repository, so a
badge or changelog cron starts failing with no obvious connection to the ruleset
somebody added that morning. Keep the admin bypass.

## CODEOWNERS and the merge bar

Review gates requires a code-owner review, which does nothing at all if the
repository has no `CODEOWNERS` — no owner means nothing to review, and the
requirement is satisfied vacuously. Add one:

```
* @Nano-Collective/core-team
```

**Name the team, not individuals.** A team code owner needs write access to the
repository, which `core-team` has. Adding a maintainer then becomes one
membership change rather than a pull request per repository, which is how the
files drift apart.

Watch for a code owner who has lost write access — GitHub reports it at
`/repos/{owner}/{repo}/codeowners/errors`, and an owner without write access
cannot satisfy the requirement.

The merge bar itself — what a reviewer is actually looking for — is written up
once in
[`MAINTAINING.md`](https://github.com/Nano-Collective/.github/blob/main/MAINTAINING.md).
GitHub does not inherit that filename across the organisation the way it does
`CONTRIBUTING.md`, so link to it from your `CONTRIBUTING.md`.

## Release automation

Releases are driven by [changesets](https://github.com/changesets/changesets).
The split is the same as everywhere else: the workflows are shared, the
configuration is a fixed local scaffold.

**Shared** — call these:

| Workflow | Does |
|---|---|
| `release-prepare.yml` | Keeps one open **Version Packages** pull request up to date. Never publishes. |
| `changeset-check.yml` | Non-blocking nudge when a pull request adds no changeset. |
| `validate-changesets` | A `pr-checks` input. Asserts each changeset names a package that actually resolves. |

**Local** — a three-file scaffold, not a decision: `.changeset/config.json`,
`.changeset/changelog.cjs`, and the `@changesets/cli` devDependency. Your own
`release.yml` stays local too, because publishing is repository-specific.

The flow: changesets accumulate on `main` → `release-prepare` maintains a Version
Packages pull request → merging it pushes a version bump → your `release.yml`
sees the bump and publishes. Nothing publishes except that last step, so a
mistake in the shared half cannot ship a package.

`validate-changesets` exists because `changeset-check` only asserts a changeset
*file* was added, never that the package name inside it resolves. A bad name
passes review and then breaks `release-prepare` on every subsequent push to
`main`.

### If your project is on a prerelease version

Run `changeset pre enter alpha` (or `beta`, `rc`) and commit `.changeset/pre.json`
**in the same change that adopts changesets**.

Without it, `changeset version` treats a prerelease as something to *resolve*
rather than continue: `0.1.0-alpha.3` plus one patch changeset becomes `0.1.0`.
The first Version Packages pull request merged then ships a stable release,
claims npm's `latest` tag permanently, and skips the rest of the prerelease
series — while looking like an entirely routine merge.

Two consequences to keep in mind:

- **Cutting the stable release is a deliberate two-step**: `changeset pre exit`,
  then `changeset version`. Deleting `pre.json` at any other moment releases 1.0
  by accident.
- **Exclude `.changeset/pre.json` from your formatter.** `changeset version`
  rewrites it with its own indentation on every run, so if the file is in scope
  the generated Version pull request fails the format check and can never be
  merged. `package.json` needs no such exclusion — changesets detects and
  preserves its existing indentation.

### Verify the publish path before layering automation on it

Wire the Version pull request onto a publish step you have confirmed works. One
project's `release.yml` had been silently broken by a package-manager migration —
it still called `npm ci` with no lockfile — and nothing caught it, because
nothing had tried to release in months. Automation on top of a broken publish
step hides the breakage further.

## Automated code review

The six blocking checks are not a code review. They cover linting, formatting,
types, unused dependencies, whether the existing tests pass, and whether it
builds. None of that catches a logic error, a race, a missing authorisation
check, or an unhandled error path — and *"the tests pass"* says nothing about the
tests that should exist and do not.

`nc-review` fills that gap: headless [Nanocoder](https://github.com/Nano-Collective/nanocoder)
doing a full review — correctness, security, design, test adequacy — plus
contribution checks like scope, duplicates and changeset presence. It posts one
comment and applies one label. **It never merges, never closes, never pushes.** A
human still decides.

Adopting it is two files:

1. `.github/workflows/nc-review.yml` — copy
   [`templates/nc-review.caller.yml`](https://github.com/Nano-Collective/.github/blob/main/templates/nc-review.caller.yml).
2. `.github/nc-review/rubric.md` — **yours**, not shared.

The rubric stays local deliberately. It is where a project says what it cares
about: its conventions, its test layout, the mistakes it keeps seeing. A shared
rubric would produce reviews that read the same everywhere and land nowhere.

It also needs `MINIMAX_API_KEY`. Set it once as an **organisation** secret with
visibility `all` rather than copying it into each repository — organisation
Actions secrets are available to public repositories on the Free plan.

Keep the rubric off anything the status checks already cover. The division is:
the checks judge the code mechanically, `nc-review` judges what they cannot.

## Adopting this in an existing project

Same three steps, plus:

1. **Delete the old `pr-checks.yml`** — or `ci.yml`, or whatever it is called.
   Keep only jobs that are genuinely specific to that project.
2. **Check the script names match.** This is where most of the work is. Projects
   that predate the contract tend to have one or two missing or misnamed.
3. **Run the whole suite locally before opening the pull request** —
   including `test:audit` and `test:security`, not just the blocking checks.
   Advisory-path breakage hides otherwise.

Project-specific work stays in the calling repository as its own job rather than
becoming an input on the shared workflow. `nanocoder` does this for its VS Code
extension: the shared workflow handles the common checks, and a local
`vscode-extension` job type-checks and packages the extension.

## Changing the shared workflow

Edit `.github/workflows/pr-checks.yml` in
[`Nano-Collective/.github`](https://github.com/Nano-Collective/.github). Every
project picks the change up on its next run — there is nothing to roll out.

That reach cuts both ways: a mistake lands everywhere at once. Test on a
low-traffic repository first, and prefer a repository with no open pull requests
so nothing is re-triggered.

## Troubleshooting

**Checks appear as `pr-checks / Linting`, not `Linting`.** Expected. Jobs called
through a reusable workflow are prefixed with the caller's job name. Required
status checks must use the prefixed name; the bare name matches nothing.

**A fix to the shared workflow is not picked up on re-run.** Re-running reuses
the reusable workflow as it resolved when the run was created. Push a new commit
to the branch instead.

**No checks run at all.** Check whether the pull request has conflicts. GitHub
cannot compute a merge ref for a conflicting pull request, so `pull_request`
workflows do not fire — while `pull_request_target` ones still do, which makes it
look as though the workflow itself is broken.

**Checks do not re-run after a fix lands on `main`.** They do not re-run when the
base branch moves. Merge `main` into the branch.

**`semgrep: not found`.** Semgrep is not installed on standard runners. The
shared workflow runs it in the `semgrep/semgrep` container. Do not call
`pnpm test:security` from an ordinary job — that script assumes semgrep is
already on `PATH`, which is true locally and false in CI.

**Every CLI test fails.** Integration tests that spawn the built binary need
`pnpm build` first. The workflow does this by default via `build-before-tests`.

## Related

- [Creating a New Project](/collective/projects/creating-a-new-project) — the
  full playbook: naming, README, licensing, templates, docs.
- [Bringing an Existing Project](/collective/projects/bringing-an-existing-project)
- [Stack Suggestions](/collective/projects/stack-suggestions)
