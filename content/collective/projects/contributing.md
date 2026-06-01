---
title: "Contributing"
description: "How to get involved with an existing Nano Collective project. Where to find work, how to submit, and what to expect from review."
sidebar_order: 2
---

# Contributing

The Nano Collective is a volunteer community. Contributions of every shape and skill level are welcome: code, docs, design, triage, advocacy. This page is for people who want to get involved with an **existing** project under the collective.

If instead you want to propose a **new** project, see [How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life).

## Who can contribute

Anyone. There is no application process and no prerequisite. If you have time, an interest, and you want to help, you are welcome here. First-time open source contributors are particularly welcome; the projects in the collective are explicitly designed to be approachable.

## Finding something to work on

Three ways to find work that matches what you can offer.

### Pick a project that interests you

Every NC project lives at [github.com/Nano-Collective](https://github.com/Nano-Collective). The active projects are:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder)**: a coding agent in your terminal that runs on any model you choose.
- **[Nanotune](https://github.com/Nano-Collective/nanotune)**: fine-tuning small models on Apple Silicon.
- **[get-md](https://github.com/Nano-Collective/get-md)**: HTML to Markdown converter.
- **[json-up](https://github.com/Nano-Collective/json-up)**: JSON migration tool.

Pick the one closest to what you actually use or care about.

### Look for `good first issue` and `help wanted`

Every project tags issues for newcomers. Filter the issues tab by:

- `good first issue`: scoped, well-defined, low context required.
- `help wanted`: the maintainers would love help with this one.

Comment on an issue to claim it before you start working, so two people don't end up writing the same patch.

### Open a new issue

If you have hit a bug or have an idea for an improvement, open an issue on the relevant project's repository. Even if you do not have time to fix it yourself, a clear bug report with reproduction steps is a real contribution.

## Modes of contribution

Before you write the patch, pick the mode that fits.

### Just open the PR

If your contribution is small, self-contained, and does not change the project's scope or public surface, just open the PR. No need to ask first. This includes:

- Bug fixes.
- Typo and documentation corrections.
- Dependency updates.
- Small, self-contained improvements (a clearer error message, a better default, a missing edge case).
- Refactors that do not change behaviour.

A maintainer will review, suggest changes if needed, and merge.

### Propose first

If your contribution is larger or has implications beyond a single PR, raise it before you start. This includes:

- New features or substantial enhancements.
- Changes to public APIs, CLI surface, or configuration.
- Architectural or structural changes.
- Anything affecting the project's branding, voice, or alignment with the collective.
- Any piece of work likely to take more than a few hours of focused effort.

The lightweight way to propose is a GitHub issue describing what you want to do and why. The even-lighter way is a message in [Discord](https://discord.gg/ktPDV6rekE) before opening the issue, especially if you are not sure whether the work is in scope.

Maintainers would rather have an early conversation than reject a finished PR.

## What makes a good PR

These are not hard rules; they are what reviewers find easiest to engage with.

- **Small and focused.** One change per PR. If you have multiple unrelated improvements, split them.
- **Tested.** Add or update tests when you change behaviour. Run the project's full test gate locally before opening the PR (every NC project documents the single command for this in its `CONTRIBUTING.md`).
- **Documented.** If your change affects user-visible behaviour, update the docs in the same PR.
- **Clear commit messages.** Follow the project's commit convention (most NC projects use a light version of Conventional Commits; see the project's `CONTRIBUTING.md`).
- **Honest about what you have not done.** If you have skipped tests, left a `TODO`, or worked around something, say so in the PR description.

## Reading the project's CONTRIBUTING.md

Every NC project has a `CONTRIBUTING.md` in its root. It contains:

- Development setup (prerequisites, install, build, run).
- Testing and linting commands.
- Coding standards specific to the project.
- The release process (contributors do not bump versions; that is a maintainer responsibility).

Read it before you start. The conventions there override the generic guidance on this page when they differ.

## What review looks like

When you open a PR:

- A maintainer responds, usually within a week. If you do not hear back in two weeks, ping the issue or message in [Discord](https://discord.gg/ktPDV6rekE).
- Review can include requested changes. Address them, push more commits, and re-request review. No one is being graded.
- Once the PR is approved and CI is green, a maintainer merges it.
- The next release picks up your change.

## Ways to contribute beyond code

Code is one of many ways. The collective values, equally:

- **Documentation.** Tutorials, examples, references, fixes to existing docs.
- **Design.** UI/UX, brand assets, visual identity.
- **Triage and review.** Answering questions, reviewing PRs, helping new contributors.
- **Advocacy.** Writing blog posts, talks, sharing the work, organising events.
- **Translation.** Where applicable, translating content for international audiences.
- **Testing.** Trying early builds and reporting issues.

If you are not sure which fits, message in Discord and someone will help you find something.

## Paid contribution

The collective has a community fund mechanism for bounties, plus designated donations and (forthcoming) sponsor-provided resources. Most contribution is volunteer, and the volume of paid work is constrained by what is currently in the fund.

If you are taking on a substantial piece of work and want to discuss whether support is available, see [Contributor Resources](/collective/organisation/contributor-resources) for the full catalogue of what is available today and how to ask. Or email [hello@nanocollective.org](mailto:hello@nanocollective.org).

The terms are clear, in writing, in the [Economics Charter](/collective/organisation/economics-charter): nothing open-ended, nothing retrospective, scope agreed before any money changes hands.

## Code of conduct

Be respectful and inclusive. Focus on constructive feedback. Help create a welcoming environment for every contributor, regardless of experience.

If something goes wrong (you experience or witness behaviour that falls short of this), reach out to a maintainer on [Discord](https://discord.gg/ktPDV6rekE) or email [hello@nanocollective.org](mailto:hello@nanocollective.org). We take this seriously.

The full text is on the [Community page](/collective/organisation/community#code-of-conduct).

## After your first contribution

If you contribute and want recognition on the website's [contributors page](https://nanocollective.org/contributors), add yourself by opening a PR against the [website repo](https://github.com/Nano-Collective/website). Instructions are on the contributors page itself.

If you contribute consistently over time, maintainership for the project you work on may be offered. See [Governance](/collective/organisation/governance#how-maintainership-works) for how that works.

## Questions

Discord is the fastest path. For anything more formal or non-public, email [hello@nanocollective.org](mailto:hello@nanocollective.org).
