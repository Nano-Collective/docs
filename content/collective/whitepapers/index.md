---
title: "Whitepapers"
description: "Technical whitepapers, design notes, and concept documents for projects the Nano Collective is considering but has not yet built"
sidebar_order: 3
---

# Whitepapers

This section is where we publish technical thinking for projects that do not yet exist as code.

A whitepaper here is a working document — part design note, part proposal, part research — that captures the problem, the proposed shape of a solution, and the open questions, *before* a repository is spun up under the collective. The goal is to make the thinking legible: so contributors can read, critique, and shape the direction before implementation begins, and so the reasoning behind a project is recoverable long after the code lands.

## What belongs here

A whitepaper is appropriate when:

- The project is non-trivial enough that "just open a repo and start coding" would skip important design decisions.
- The shape of the work benefits from being argued in prose before it is argued in code.
- There are open questions — architectural, ethical, economic, or technical — that the collective should reason about in the open.

A whitepaper is **not** required for every new project. Small utilities, focused libraries, and well-scoped tools can go straight to the [Creating a New Project](/collective/projects/creating-a-new-project) playbook. Whitepapers are for the projects where the *thinking* is itself the artefact worth publishing.

## What a whitepaper should cover

There is no rigid template — each whitepaper should be shaped by what the project actually needs — but most will touch on:

- **Problem** — what gap or need motivates this project, and why it matters now.
- **Principles** — the non-negotiables the design must honour (privacy, locality, openness, and anything project-specific).
- **Proposed approach** — the technical shape of the solution, at whatever depth is useful. Architecture sketches, data flows, failure modes, dependencies.
- **Alternatives considered** — what else was on the table and why this approach won.
- **Open questions** — what is still unresolved, and where input from the collective is most valuable.
- **Next steps** — what would need to be true for this to move from whitepaper to repository.

Whitepapers are versioned in git like the rest of the docs. They are expected to evolve as the thinking sharpens. When a whitepaper graduates into a real project, leave it in place as the historical record and link from the new project's README back to it.

## How to add one

1. Create a new file at `content/collective/whitepapers/<project-slug>.md`.
2. Add frontmatter with `title`, `description`, and a `sidebar_order` value.
3. Write the document in whatever structure best serves the project — the sections above are a starting point, not a contract.
4. Open a PR against the [docs repository](https://github.com/Nano-Collective/docs). Whitepapers go through the same review as any other docs change, but expect more discussion: the point is to surface disagreement early.

If you are not sure whether your idea warrants a whitepaper or just an issue, open a discussion in [Discord](https://discord.gg/ktPDV6rekE) first.
