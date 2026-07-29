---
title: "Bringing an Existing Project"
description: "The path for moving an already-shipped project under the Nano Collective umbrella"
sidebar_order: 2
---

# Bringing an Existing Project

[How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life) covers the path from idea to shipped code. This page covers the other route in: you have already built something, it has users or is ready for them, and you want it to live under the Nano Collective.

The collective wants this to happen. Independent projects joining the umbrella is not an edge case we tolerate; it is part of the point. What follows is deliberately lighter than the whitepaper pipeline, because the biggest question a whitepaper answers, "should this exist?", your project has already answered. The code is inspectable, the users are real, and the argument has been made by shipping.

What the collective cannot see from the outside is everything else: whether the project genuinely honours the principles, whether you are staying with it, whether its history is clean, and what moving it actually costs. That is what this process checks.

## Who can submit

Anyone. Same as proposing a new project: no contribution history required, no application form beyond the submission itself, and the same rules apply to the core team as to everyone else.

## What the collective is looking for

The same positive shape as any project:

- AI tooling that helps users keep their data private.
- Tools that make local AI useful, running on the user's own hardware.
- AI agents and agent workflows.
- Open source variants of existing proprietary software.
- Anything that lands on the three principles: privacy-respecting, local-first, open for all.

One difference from the new-idea path: for an existing project, fit is verified against the code, not the README. "Local-first in spirit" with cloud calls in three places is a conversation, not a disqualification, but it needs to be an honest conversation.

## Small utilities: the fast path

The [Creating a New Project](/collective/projects/creating-a-new-project) playbook already lets small utilities, focused libraries, and well-scoped tools skip the whitepaper. The same logic applies here. If your existing project is in that category, skip the submission document and public window: raise it in [Discord](https://discord.gg/ktPDV6rekE) or as an issue, and a maintainer will run the checklist below with you directly. The migration conventions still apply in full.

If you are not sure which side of the line your project sits on, ask. The answer costs nothing.

## The process

Four stages. Shorter than the whitepaper pipeline, public in the same way.

### Stage 0: Raise it

Before writing anything, raise the project with the collective so the conversation is recorded:

- An issue on the [docs repository](https://github.com/Nano-Collective/docs).
- An issue on the [`Nano-Collective/organisation`](https://github.com/Nano-Collective/organisation) repository.
- A message in [Discord](https://discord.gg/ktPDV6rekE).

A maintainer or core team member responds with one of:

- "Yes, write the submission."
- "Yes, but talk to X first, they maintain something adjacent."
- "Probably not, here is why."
- "This is a fast-path utility, skip the submission and let's run the checklist."

**Output:** a green light, a redirect, or a fast-path routing.

### Stage 1: The submission

You write a submission document and open a pull request against the [docs repository](https://github.com/Nano-Collective/docs), the same mechanics as a whitepaper. It is a shorter, different document. A whitepaper argues; a submission points. One to two pages. It answers the questions a reviewer cannot answer from the repository:

**About the project**

- What it is, who uses it, and links: repository, docs, package registry entries, anything that shows it living in the world.
- How it honours the three principles, stated concretely. Where it does not fully, say so. Partial fit named honestly beats perfect fit claimed.

**Provenance**

- Current licence, and current copyright holder.
- Whether any contributor ever signed a CLA or similar, and whether all contributions arrived under the current licence.
- Any employer, company, or third party with a plausible claim on the code.
- Any trademark, registered or informal, on the name.

This section matters more than it looks. It is the only part of the assessment that can create a legal problem rather than a quality problem, and none of it is visible from the outside. NC projects are MIT with copyright "Nano Collective"; if your project is not, the submission should say what relicensing would take and whether it is possible.

**Maintainer intent**

- Are you bringing the project with you, or handing it over? Name it plainly. These are different transactions and are assessed differently (see below).
- If you are staying: your commitment, against the same floor as the whitepaper pipeline. Aim for three months of active maintenance after the move. Co-maintainers welcome and encouraged.

**Technical alignment and migration**

- Stack, test coverage, and how far the project currently sits from the conventions in [Creating a New Project](/collective/projects/creating-a-new-project): the CI gate, the security checks, the docs structure, the repo layout.
- The migration plan: repository transfer or fork, what happens to any existing package names, whether existing install paths survive, and what current users will see.
- Who does the migration work, roughly on what timeline. The collective helps; it does not do it for you by default.

**Duplication check**

- A sentence on how the project relates to shipped NC projects and to any whitepaper currently in flight. Overlap is not automatically fatal, but it must be named, not discovered.

A maintainer reviewing the PR checks that the sections are answered, the project fits the positive shape, and the proposer is named. Merge opens the review window. As with whitepapers, **merge does not mean acceptance**.

**Output:** submission merged, status set to `In public review`, window opens.

### Stage 2: Public review window

**Default window: 14 days.** Shorter than the whitepaper window for a stated reason: reviewers can read working code, so the signal arrives faster than it does for a proposal. This is not a lighter gate; it is a faster-converging one. Extensions are allowed with a recorded reason, exactly as in the whitepaper pipeline.

During the window:

- Anyone can read the code, test the tool, and raise issues on the docs repo (use a `submission:<slug>` label) or discuss in Discord. Concerns that matter get re-raised as issues so they are recorded.
- You respond to issues within a reasonable window. Aim for a week.
- You iterate the submission document by PR, same mechanics as a whitepaper. Git history is the audit trail.

**Output:** a sharpened submission, recorded community feedback.

### Stage 3: Decision

At the close of the window, the founding core team makes the call, on the same basis as a whitepaper Stage 3: recorded on the submission page, dated, with rationale. Rationale is mandatory, even for a yes.

Three outcomes:

**Accepted.** The six criteria below hold. The project enters migration (Stage 4).

**Accepted as handover.** The project fits but the current maintainer is stepping away. This is a legitimate outcome, but it is never the default: it requires a named NC contributor committed to picking the project up before the yes lands. If nobody steps up, the answer is "not yet", recorded as such, and the submission can be reactivated when someone does. The collective does not accept projects into silence.

**Declined.** One or more criteria did not hold, and the reason is written down. A decline is a statement about fit with the collective, not a judgement on the project. Your project continues to exist exactly as it did the day before you submitted; nothing about this process touches it until acceptance and migration. There is no penalty for coming back after addressing what did not hold.

The six criteria:

1. **Principle fit, verified.** The three principles hold in the code, or the gaps are named with a credible plan.
2. **Technical alignment.** The path to the conventions and CI gate is realistic and someone owns it.
3. **Maintainer commitment.** A named maintainer, three-month floor, or a named NC contributor for a handover.
4. **Provenance is clean.** Licence, copyright, and claims are resolved or resolvable, in writing.
5. **No unresolved duplication.** Relationship to existing projects and in-flight whitepapers is settled.
6. **Migration cost is understood.** Users, package names, and install paths have a plan, and the work is owned.

**Output:** accepted, accepted as handover, or a documented reason for no.

### Stage 4: Migration

On acceptance, the project moves under [`Nano-Collective`](https://github.com/Nano-Collective) and the [Creating a New Project](/collective/projects/creating-a-new-project) conventions apply: MIT licence, README, CONTRIBUTING, CI workflows, docs folder, and the launch checklist. Prefer a repository transfer over a fork wherever possible, so stars, issues, and watchers travel with the project.

The submission document stays in the docs as the historical record, with a banner pointing to the live project, exactly as whitepapers do.

**Output:** a Nano Collective repository, and one more project under the umbrella.

## Statuses

Submissions use the same [status taxonomy](/collective/projects/how-a-project-comes-to-life#status-taxonomy) as whitepapers, with the same archive windows. `Build approved` reads as `Accepted` for a submission; everything else carries over unchanged.

## What you get

Everything the [whitepaper pipeline offers](/collective/projects/how-a-project-comes-to-life#what-you-get), with the honest caveats stated there intact: brand and audience, distribution rails, infrastructure defaults, governance commitments, and a defined process for funding work as it comes online. Your project keeps its identity, its maintainers, and its roadmap. What changes is the floor it stands on.

## How to start

1. Raise the project via [docs issue](https://github.com/Nano-Collective/docs/issues/new), [organisation issue](https://github.com/Nano-Collective/organisation/issues/new), or [Discord](https://discord.gg/ktPDV6rekE).
2. Get a green light, a redirect, or a fast-path routing.
3. Write the submission. Open the PR.
4. Be ready for 14 days of public review.
5. Come out the other side under the umbrella.
