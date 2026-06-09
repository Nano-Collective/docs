---
title: "Whitepapers"
description: "Technical whitepapers, design notes, and concept documents for projects the Nano Collective is considering but has not yet built"
sidebar_order: 3
---

# Whitepapers

This section is where we publish technical thinking for projects that do not yet exist as code.

A whitepaper here is the **case for building a project**, written in prose so the collective can reason about whether to back it before any code lands. It captures the problem, the proposed shape of a solution, and the open questions. The thinking is the artefact.

For the full lifecycle from idea to shipped project, read [How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life). This page covers what a whitepaper *is* and how to add one. That page covers the five stages a whitepaper moves through on its way to becoming a real project.

## What belongs here

A whitepaper is appropriate when:

- The project is non-trivial enough that "just open a repo and start coding" would skip important design decisions.
- The shape of the work benefits from being argued in prose before it is argued in code.
- There are open questions, architectural, ethical, economic, or technical, that the collective should reason about in the open.

A whitepaper is **not** required for every new project. Small utilities, focused libraries, and well-scoped tools can go straight to the [Creating a New Project](/collective/projects/creating-a-new-project) playbook. Whitepapers are for the projects where the *thinking* is itself the artefact worth publishing.

## What a whitepaper should cover

There is no rigid template. Each whitepaper should be shaped by what the project actually needs, but most will touch on:

- **Problem.** What gap or need motivates this project, and why it matters now.
- **Principles.** The non-negotiables the design must honour (privacy, locality, openness, and anything project-specific).
- **Proposed approach.** The technical shape of the solution at whatever depth is useful. Architecture sketches, data flows, failure modes, dependencies.
- **Alternatives considered.** What else was on the table and why this approach won.
- **Open questions.** What is still unresolved, and where input from the collective is most valuable.
- **A v1.0 success picture.** What would prove the idea.

Whitepapers are versioned in git like the rest of the docs. They are expected to evolve as the thinking sharpens during the public review window (see [How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life)). When a whitepaper graduates into a real project, it stays in place as the historical record and the live project's README links back to it.

## What merging a whitepaper means

**Merge does not mean the collective has agreed to build the project.** It means the thinking is good enough to publish, and good enough to invite public review.

When your whitepaper merges:

- Its status becomes `In public review`.
- A 30-day window opens during which anyone can raise issues, suggest changes, and discuss the proposal.
- You iterate the document in response to feedback (via further PRs against the merged file).
- At the end of the window, the core team makes a build / decline / iterate decision, recorded on the whitepaper page itself.

Every whitepaper page carries a **"Question? Give us feedback."** link directly under the title, alongside the proposer and status badges. Clicking it opens a pre-filled GitHub issue against the docs repo, with the title `Feedback for "<page title>"` so it shows up alongside the others. The widget also shows a live count of open and closed issues for the current whitepaper, so readers can see at a glance what has already been raised before posting a duplicate.

Full details in [How a Project Comes to Life](/collective/projects/how-a-project-comes-to-life).

## Frontmatter

Whitepapers carry a few extra frontmatter fields beyond the standard `title`, `description`, and `sidebar_order`. These power the status badge and the proposer attribution that appear at the top of the page:

```yaml
---
title: "Sentinel (working title)"
description: "..."
sidebar_order: 4
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "In public review"
review_opens: "2026-05-22"
review_closes: "2026-06-21"
---
```

| Field | Purpose |
| --- | --- |
| `proposer` | Display name of the person driving the proposal. Required. |
| `proposer_github` | Optional GitHub handle. Renders a link to the proposer's profile. |
| `status` | One of: `Draft`, `In public review`, `Build approved`, `Building`, `Shipped`, `Paused`, `Declined`, `Superseded`. |
| `review_opens` | ISO date the review window began. Usually the merge date. |
| `review_closes` | ISO date the review window closes. Drives the countdown badge. |
| `status_changed_on` | ISO date the current `status` was set. Required when moving to a terminal status (`Shipped`, `Paused`, `Declined`, `Superseded`) so the daily archive workflow knows when the clock started. After the archive window elapses the file is deleted from the docs repo (git history is the archive). |

## How to add one

1. Raise the idea first via an [issue on the docs repo](https://github.com/Nano-Collective/docs/issues/new) (start the title with `Feedback for "<project working title>"` once the slug is known), an [issue on the organisation repo](https://github.com/Nano-Collective/organisation/issues/new), or a message in [Discord](https://discord.gg/ktPDV6rekE). This is Stage 0 in the lifecycle.
2. With a green light, create a new file at `content/collective/whitepapers/<project-slug>.md`.
3. Add the frontmatter above, including yourself as proposer.
4. Write the document in whatever structure best serves the project. The sections above are a starting point, not a contract.
5. Open a PR against the [docs repository](https://github.com/Nano-Collective/docs).

All issues raised against a whitepaper (Stage 0 conversation, public review feedback, or follow-ups) should start their title with `Feedback for "<page title>"` (using the exact same punctuation, including the curly quotation marks) so they show up in that paper's feedback count and so the proposer can keep track of them in one place.

If you are not sure whether your idea warrants a whitepaper, open a Stage 0 conversation first.
