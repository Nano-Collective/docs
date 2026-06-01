---
title: "Governance"
description: "How decisions get made at the Nano Collective today, how contribution works, and how the model widens as the collective grows"
sidebar_order: 5
---

# Governance

This page describes how the Nano Collective is run today and how that is expected to evolve as the community grows.

It exists for two reasons. First, transparency: anyone investing time in the collective deserves to know who makes decisions, how, and on what basis. Second, scaffolding: writing the current model down is the only way to evolve it deliberately rather than by accident.

The collective is early. The model below reflects that. It will widen as more people show up consistently and take on responsibility, and the page will be updated openly when it does.

## How decisions get made today

Decisions at the Nano Collective are made by the **founding core team**, which is small. Most decisions today are made in the open (in GitHub issues, pull requests, Discord, and the documentation repository) with rationale shared for anything non-trivial. Where a decision can't reasonably be made in the open (security, individual contributor matters, sensitive sponsorship conversations), it is recorded internally and surfaced when it can be.

What this means in practice:

- **Project direction.** Roadmaps, scope, and architectural direction currently sit with the core team, in conversation with the maintainers and active contributors of each project.
- **Day-to-day decisions.** Accepting PRs, triaging issues, and releasing sit with each project's maintainers.
- **Collective-level decisions.** The Brand Guidelines, the Economics Charter, the Support model, and governance itself sit with the core team and are versioned publicly so that every change is dated and explained.
- **New project approval.** At the end of a whitepaper's public review window (see [How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life)), the core team makes the build / decline / iterate call. The decision is recorded on the whitepaper page itself, with rationale, including for a yes. As the collective grows, this approval call widens in the same way the rest of decision-making does.

This is a centralised model. It is not a permanent one. The *Where this is going* section below sets out the direction.

## How contribution works

There is no application process to contribute to the Nano Collective. Find a project, read its `CONTRIBUTING.md`, and either open an issue or open a PR. Two practical modes for contributors:

### Just open the PR

If your contribution is small, self-contained, and doesn't change the project's scope, public surface, or direction, just open the PR. No need to ask first. This includes:

- Bug fixes
- Typo and documentation corrections
- Dependency updates
- Small, self-contained improvements (a clearer error message, a better default, a missing edge case)
- Refactors that don't change behaviour

A maintainer will review, suggest changes if needed, and merge.

### Propose first

If your contribution is larger or has implications beyond a single PR, raise it before you start. This includes:

- New features or substantial enhancements
- Changes to public APIs, CLI surface, or configuration
- Architectural or structural changes
- Anything affecting the project's branding, voice, or alignment with the collective
- Any piece of work likely to take more than a few hours of focused effort

The lightweight way to propose is a GitHub issue describing what you want to do and why. The lighter way is a message in [Discord](https://discord.gg/ktPDV6rekE) before you open the issue, especially if you're not sure whether the work is in scope. Maintainers would rather have an early conversation than reject a finished PR.

If you are not sure which mode applies, default to a quick Discord message. It is faster than guessing wrong.

## How maintainership works

Maintainers today are added by invitation. The criteria are not formal, but in practice they come down to three things:

- **Consistent contribution.** Someone who has shown up over time, not just dropped a single PR.
- **Demonstrated judgement.** Their decisions, reviews, and discussions have lined up with how the collective tends to think: they get the voice, the trade-offs, and the bar.
- **Willingness.** Maintenance is a real workload. Being asked is not the same as having to accept.

Maintainers can review, merge, triage issues, and cut releases on the project they maintain. They are not signing up for a fixed shift. Stepping back, going quiet for a while, or rotating off is welcome and expected. Burnout is real and the collective is built to absorb it.

There is no formal hierarchy among maintainers within a project. Disagreements are resolved in conversation; if a deadlock persists, the core team is the tie-breaker today, and that role is one of the things that widens as the collective grows.

## Where this is going

The intent of the Nano Collective is for decision-making to widen with the community.

Concretely, that means three directions over time:

- **More maintainers per project.** Today most projects have one or two; the goal is enough that no single person is the bottleneck on any project.
- **More autonomy at the project level.** Maintainers should be empowered to make decisions about the project they run without needing to clear them with the core team. The collective sets the shared bar (Brand, Charter, conventions); projects own everything inside that.
- **Distributed collective-level decisions.** Currently the core team makes collective-level calls. The longer arc is for those calls to be made by a wider group (maintainers across projects, contributors who have shown sustained involvement, and others) using whatever lightweight process works at the time.

There is no fixed timeline. The collective will widen as the community grows into it, not on a schedule. What will not change is the principle: anyone investing time in the Nano Collective deserves a transparent answer to "who decides this, and on what basis."

## Amendments

This page is versioned in the docs repository. Material changes (anything that meaningfully alters how decisions are made, how maintainership works, or how the model evolves) will be communicated with at least 30 days notice before taking effect, in line with the same approach used for the [Economics Charter](/collective/organisation/economics-charter).

Smaller changes (clarifications, typo fixes, sharpening of wording) are committed directly with a clear commit message.

If anything here is unclear, contradicts another part of the docs, or no longer reflects how the collective actually operates, open an issue on the [docs repository](https://github.com/Nano-Collective/docs) or email [hello@nanocollective.org](mailto:hello@nanocollective.org).
