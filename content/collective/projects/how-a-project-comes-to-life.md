---
title: "How a Project Comes to Life"
description: "How an idea becomes a Nano Collective project, from a sanity-check conversation to a shipped v1.0"
sidebar_order: 1
---

# How a Project Comes to Life

The Nano Collective umbrellas a growing set of independent projects. Some of them were built by the founding core team. The collective expects more of them, over time, to be built by other people who want their work to land under a brand and a community that takes the same things seriously they do.

This page is the canonical description of how that happens. It is the path from "I have an idea" to "the project ships under the Nano Collective umbrella". If you are thinking about proposing a project, this is for you.

Giving people the resources and the power to build AI in the open, and a home for the work once it exists, is the whole point of this process. The stages below exist to make that path clear and fair, not to gatekeep it.

## Who can propose

Anyone. There is no prerequisite contribution history. You do not need to be a maintainer of an existing NC project, you do not need to have shipped a previous open source project, and you do not need to have been around the collective for any length of time. The quality of the whitepaper is the filter, not the proposer's history.

This includes the core team. When a core team member proposes a project, it goes through the same process as anyone else's proposal, on the same timeline, with the same public review. There is no shortcut. The credibility of the process depends on this.

## What the collective will accept

There is no exclusionary "what we will say no to" list. There is a positive shape we are looking for. The collective is interested in:

- AI tooling that helps users keep their data private.
- Tools that make local AI useful, running on the user's own hardware.
- AI agents and agent workflows.
- Open source variants of existing proprietary software.
- Anything that lands on the three principles: privacy-respecting, local-first, open for all.

These are broad on purpose. If your idea sits inside one of these areas, the answer is likely yes.

## The five stages

A project moves through five stages between idea and shipped code. Each has a clear input, a clear gate, and a clear output.

### Stage 0: Spark

You have an idea. Before you write a whitepaper, raise it with the collective so the conversation is recorded and so anyone already working in the space can surface themselves. Three channels work:

- An issue on the [docs repository](https://github.com/Nano-Collective/docs).
- An issue on the [`Nano-Collective/organisation`](https://github.com/Nano-Collective/organisation) repository.
- A message in [Discord](https://discord.gg/ktPDV6rekE).

A maintainer or core team member will respond with one of:

- "Yes, write the whitepaper."
- "Yes, but talk to X first, they are already in this space."
- "Probably not, here is why."
- "Too small for a whitepaper, just open the issue or PR on project X."

This is a sanity check, not a gate. Most of the answers are yes. The point is to save you a month of writing a whitepaper for an idea that was never going to fly, and to introduce you to anyone you should be working with.

**Output of this stage:** a green light to write, or a redirect to a better path.

### Stage 1: Whitepaper draft

You write a whitepaper following the conventions in the [whitepapers section](/collective/whitepapers). Open a pull request against the [docs repository](https://github.com/Nano-Collective/docs) when it is ready.

#### What a whitepaper is

At merge, a whitepaper is the **case for building** the project, not a finished build spec. It is an argument that the project deserves to exist, with enough shape sketched that the collective can reason about whether to back it, and with the open questions named honestly. The document then evolves through public review, tightening towards something a builder could pick up by the time the build decision lands.

What needs to be true at merge:

- Problem named clearly, with "why now" landed.
- Principles the project must honour: privacy, locality, openness, plus anything project-specific.
- Proposed approach in shape form. Architecture sketch, key trade-offs, failure modes. Not a full design.
- Alternatives considered, with the reasons they lost.
- Open questions listed honestly, not hidden.
- A v1.0 success picture. What would prove the idea.
- A named proposer (you), committed to driving it.

What does NOT need to be true at merge:

- Full architecture or API surface.
- Implementation plan or timeline.
- Resolved answers to every open question.
- A named maintainer pool. That is a Stage 3 requirement.

#### What PR review checks for

A maintainer reviewing the PR checks for:

- **Fit with the collective.** Aligned with the positive shape above. If your idea sits elsewhere, that is fine, but it goes elsewhere.
- **Genuine novelty.** Not a duplicate of an existing project or another whitepaper in flight.
- **Coherent argument.** Problem clear, approach plausible, open questions named honestly.
- **A named proposer.** Not anonymous.

#### Merge does not mean endorsement

This is the single most important point on this page. **Merging the whitepaper does not mean the collective has agreed to build it.** It means the thinking is good enough to publish, and good enough to invite public review. The build decision is a separate gate at Stage 3.

This is a deliberate departure from how earlier whitepapers landed in NC, where merge effectively read as endorsement. From now on, the two are separate.

**Output of this stage:** whitepaper merged, status set to `In public review`, the public review window opens.

### Stage 2: Public review window

Your whitepaper is live on the docs site. A status badge tells anyone reading it that the review window is open, and shows the date it closes. **Default window: 30 days.** Extensions or shortenings are allowed when the shape of the proposal warrants it, with a recorded reason.

#### How the document evolves

You iterate on the whitepaper by opening pull requests against the merged file. Two flavours:

- **Substantive PRs from you.** Responding to a concern, sharpening the argument, expanding a section, filling out build-spec detail that was deferred at merge. A maintainer reviews these, but the bar is light. Most should merge fast.
- **Editorial PRs from anyone.** Typos, broken links, formatting, small clarifications. Same review bar as any docs PR. You do not have a monopoly on the document for these.

Substantive scope changes from anyone other than you should be raised as an issue first, not opened as a PR cold. You drive the direction.

The git history of the whitepaper file is the audit trail. The state on `main` is always the canonical version.

#### Feedback channels

- **GitHub issues** on the docs repo. The "Questions? Raise an issue" link at the bottom of every page is the easiest way. Use a `whitepaper:<slug>` label so issues are findable and groupable.
- **Discord** for lightweight discussion. Anything that turns into a real concern should be re-raised as an issue so it is recorded.
- **PR comments** on the substantive and editorial PRs themselves.

#### When the clock resets

Not every revision restarts the review window:

- **Sharpening, clarifying, filling out, responding to a concern**: no reset. The document keeps tightening.
- **Fundamental pivot** in what is being proposed (different problem, different shape of solution, different audience): the window restarts. The community is now reviewing a meaningfully different proposal.

Flag pivots openly when they happen. A maintainer makes the call on whether a change crosses the line.

#### What you are doing during the window

- Responding to issues within a reasonable window. Aim for a week.
- Iterating the document in response to substantive feedback.
- Converting prose into tightening build-spec detail. By the end of the window, the whitepaper should read like something a builder could pick up.
- Identifying other contributors interested in maintaining or co-building the project.

**Output of this stage:** sharpened whitepaper, recorded community feedback, named maintainer commitment.

### Stage 3: Build approval

At the end of the review window, the **founding core team** makes the call. As the collective grows, this will widen (see the [governance page](/collective/organisation/governance)).

The decision is recorded on the whitepaper page itself as a short note, dated, with rationale. Rationale is mandatory, even for a yes. A no is not a death sentence. It usually means "not yet" or "not in this shape". The whitepaper stays in place with the decision attached.

#### Criteria for a yes

- **The whitepaper has held up.** Concerns raised in review have been addressed in the document or acknowledged as known trade-offs.
- **Maintainer commitment is real.** At least one named maintainer ready to drive the project for an initial period (aim for three months of active maintenance after v1.0). Co-maintainers welcome.
- **Scope is buildable.** A v1.0 that proves the core idea is realistic within a reasonable window.
- **Fit with the collective remains true.** Nothing surfaced in review that conflicts with the positive shape.

#### What "no" looks like

Decline is not a separate enumerated list. It means one or more of the criteria above were not met. The specific reason is written on the whitepaper page when the decision lands. We will not give you a vague "no". You will know exactly what did not hold up.

#### What "iterate" looks like

If the decision is iterate, a list of what needs to change is recorded. You come back with another review window when you have addressed it. There is no penalty for coming back.

**Output of this stage:** a green light, a redirect, or a documented reason for no.

### Stage 4: Build and ship

On a yes, the project enters the existing [Creating a New Project](/collective/projects/creating-a-new-project) playbook. A repository is created under [`Nano-Collective`](https://github.com/Nano-Collective). The whitepaper stays in `/collective/whitepapers` as the historical record, with a banner pointing to the live project.

From this point, the project follows the existing conventions: MIT licence, README + CONTRIBUTING + LICENCE, CI workflows, docs folder, launch checklist. It is now just a project.

**Public from day one.** No private build period. The collective's brand is built on "shape this with us, not after". A new repository launches with a clear README noting it is pre-v0.1 and stability is not promised.

**Output of this stage:** a working Nano Collective repository.

## Status taxonomy

Every whitepaper carries a status badge. The eight values:

| Status | Meaning |
| --- | --- |
| `Draft` | PR open, not yet merged. |
| `In public review` | Merged. Inside the review window. Issues actively invited. |
| `Build approved` | Stage 3 yes. Maintainer named. Repository creation imminent or done. |
| `Building` | Repository live, project under active build. Whitepaper now sits as historical record. |
| `Shipped` | Project has reached v1.0+ and is in the projects list. |
| `Paused` | Approved or in-progress work that has stalled. Honest label, not a hiding place. |
| `Declined` | Reviewed, decided against. Rationale attached. |
| `Superseded` | Replaced by a newer whitepaper or folded into another project. Links to the successor. |

Terminal statuses are archived after a set window so the whitepapers section does not accumulate clutter:

- `Shipped`: 90 days after v1.0.
- `Paused`: 90 days after entering paused.
- `Declined`: 30 days after the decline.
- `Superseded`: archived immediately. The successor is canonical.

Archiving deletes the whitepaper file outright. Git history is the archive. Once the window elapses, the page is gone from the live docs site and its URL no longer resolves. If you want to preserve a reference to a whitepaper's reasoning beyond its window, link to the GitHub history of the file before it lapses.

## What you sign up for

A whitepaper-to-project journey is a real time commitment:

- **30 days of active review iteration.** Responding to issues, sharpening the doc.
- **Maintainer commitment** for the initial build phase. Aim for at least three months of active maintainership after v1.0.
- **Following the conventions.** Repo structure, CI, docs, brand. The [Creating a New Project](/collective/projects/creating-a-new-project) playbook covers them.
- **Not flying solo if you do not want to.** The collective will help find co-maintainers and contributors where it can. Solo maintenance is allowed but discouraged.

## What you get

This page is honest about where the collective is. NC is in active outreach for sponsors and partnerships. Some of what proposers will eventually get is still being built. Here is the current state:

- **Brand and audience.** The collective's reach and organisational identity sit behind your project from day one. A solo project starting at zero stars and zero distribution starts under NC at a meaningfully higher floor.
- **Distribution rails.** The `@nanocollective` npm scope, the docs site, the website's project surface, the release pipeline. Built once, available to every project.
- **Infrastructure defaults.** CI workflows, docs site integration, badges, release pipelines. Less to set up, more to inherit.
- **Governance commitments.** Open from day one. No retrospective term changes. No sponsor influence over the roadmap or over which contributors get paid. See the [Economics Charter](/collective/organisation/economics-charter) and the [sponsor page](https://nanocollective.org/sponsor).
- **A defined process for funding work.** The community fund mechanism exists. Designated donations exist. Bespoke partnerships exist as a category. **Funded balance and live partnerships do not yet exist.** NC is pre-sponsor, pre-partnership, pre-bounty-pool. Honesty over flattery.
- **A path to becoming fundable.** A credible, well-argued project under NC is itself the artefact that helps unlock sponsor and partnership conversations. Builders are not just consumers of the fund; they are part of the case being made to the people who will fill it.

For the full picture of what is available today and what is being built toward, see [Contributor Resources](/collective/organisation/contributor-resources).

## If you disappear

Life happens. If the original proposer goes dark mid-process:

- Any other contributor can pick the whitepaper up. Note it in the whitepaper file (as a new proposer line) and in an issue, then carry on.
- If nobody picks it up within 60 days, the whitepaper moves to `Paused`. It can be reactivated later by anyone willing to drive it.

## How to start

If you have an idea:

1. Raise it via [docs issue](https://github.com/Nano-Collective/docs/issues/new), [organisation issue](https://github.com/Nano-Collective/organisation/issues/new), or [Discord](https://discord.gg/ktPDV6rekE).
2. Get a green light or redirect.
3. Write the whitepaper. Open the PR.
4. Be ready for 30 days of public review.
5. Come out the other side with a buildable project.

If you have a question that does not fit any of those, email [hello@nanocollective.org](mailto:hello@nanocollective.org).
