---
title: "Brand Guidelines"
description: "How to talk about, write for, and represent the Nano Collective consistently across projects"
sidebar_order: 4
---

# Brand Guidelines

This page is the source of truth for how the Nano Collective is talked about, written about, and presented across the docs site, project READMEs, contributor guides, social channels, and anywhere else the collective shows up.

If you are a maintainer writing project copy, a contributor opening a docs PR, or an external advocate writing about the collective, this is your reference. If you are a sub-agent or automation enforcing consistency across projects, this page is your target.

The collective is built on the principle that what we ship and how we describe it should match. Loose, off-message copy makes the collective harder to trust, harder to navigate, and harder to maintain. The guidelines below are deliberately tight so that the work can stay loose where it matters: on the actual code and projects.

## The canonical description

The version used in the [Introduction](/collective). Use this near-verbatim wherever the collective is being introduced from scratch:

> The Nano Collective is a community-led group of developers, designers, and maintainers building open-source AI tools for the people who use them. We build not for profit, but for the community. Everything we produce is open, transparent, and shaped by the people who rely on it.
>
> Every tool we ship aims to be **privacy-respecting**, **local-first**, and **open for all**.

The three principles in the second paragraph are not decoration. They are the filter applied when deciding what the collective builds, how it builds it, and who gets to shape it. Where space is tight, the second paragraph can be dropped, but the principles should never be paraphrased loosely. They are: privacy-respecting, local-first, open for all. In that order. Use those exact phrases.

## The canonical project tagline

Every Nano Collective project introduces itself with the same single sentence near the top of its `README.md` and its docs landing page:

> Built by the [Nano Collective](https://nanocollective.org) — a community collective building AI tooling not for profit, but for the community.

This applies to **every** project under the umbrella, regardless of whether the project itself is AI-focused. The tagline describes the *collective that built it*, not the project. Keep the wording exact. Small variations across projects make the collective feel inconsistent.

A short variant is acceptable where space is tight (e.g. badge copy, package descriptions):

> Built by the [Nano Collective](https://nanocollective.org).

## How to refer to the collective

| Form | When to use |
| --- | --- |
| **The Nano Collective** | First mention in any document; preferred form throughout body copy. Always capitalised. |
| **NC** | Acceptable abbreviation after first mention. Used in headings only when space is tight. |
| **The Collective** | Acceptable as occasional emphasis (capitalised). Avoid as the default; it is less identifiable than "the Nano Collective". |
| ~~the collective~~ | Avoid as a noun. Lowercase reads as generic and undermines the identity. |

GitHub organisation handle: `@Nano-Collective`. Domain: `nanocollective.org` (lowercase, no separator). Docs site: `docs.nanocollective.org`.

## Project names

Spelling and capitalisation are not optional. Use these exactly:

| Project | Canonical form |
| --- | --- |
| Nanocoder | One word, capital N. Not "NanoCoder", not "nano-coder", not "nanocoder" in body copy. |
| Nanotune | One word, capital N. Same pattern. |
| get-md | All lowercase, hyphenated. Render in inline code style (`get-md`) when the surrounding text might confuse it with prose. |
| json-up | All lowercase, hyphenated. Same pattern as `get-md`. |

When listing projects in copy, alphabetise unless there is a deliberate reason to prioritise (e.g. flagship project first in marketing copy).

## Voice and tone

The collective's voice is **operational, understated, and honest**. It is closer to internal engineering documentation than to marketing copy. The same voice applies to the docs site, project READMEs, release notes, social posts, and external writing.

**Do:**

- Be specific. Name the project, the feature, the workflow.
- Hedge the future. Describe shipped work in present tense; describe planned work as planned.
- Trust the reader. Skip explanations that any reader of technical docs already has.
- Stand for something. The collective has a clear view on where AI should and shouldn't go, and that view is allowed to show. Adversarial framing (naming what's broken about the centralised, closed-platform default) has its place when it earns its keep, used sparingly, and grounded in what the collective is building in response. *"AI shouldn't only belong to a handful of platforms"* lands when it is followed by the project that proves it.
- Pair aspiration with the concrete. Values, mission, and vision have a real place in collective copy. They are how we frame *why* we build what we build, and the work loses something without them. The rule is balance: aspirational claims should land in something a reader can actually see in a project. *"We believe AI should belong to everyone, which is why our tools run on your hardware, with no cloud dependency"* is stronger than either half on its own.

**Don't:**

- Use marketing register. No "transformative", "revolutionary", "cutting-edge", "next-generation".
- Promise products before they exist. If something is not shipped or in active development, it goes in a "What's coming" or future-tense section, never in the present-tense description of what the collective is.
- Lean entirely on adversarial framing. A page that is *only* what we are against, with nothing about what we are building instead, reads as a complaint.
- Lean entirely on aspiration. A page that is *only* values and mission, with nothing concrete to point at, reads as a wish list. Every aspirational claim deserves a working example beside it.

## Terms to avoid

A handful of phrases circulate in adjacent AI-industry copy and earlier drafts of collective material that should **not** appear in any current Nano Collective documentation, READMEs, or social copy. They over-promise, or sound like something while saying nothing specific.

- **"Sovereign AI"**: over-promised and overloaded. Use *"open AI tooling"*, *"local-first AI"*, or describe what the project actually does.
- **"Trustless AI"**: same problem.
- **"Intimate technology"**, **"intelligent infrastructure"**: vague clichés. They sound profound and mean very little. Pick the project and say what it actually does.

Unshipped products and internal team names are also off-limits in public copy. The general rule is already captured under voice and tone (don't promise products before they exist), so we don't enumerate them here. If you are unsure whether something is publicly named or shippable, ask in the core team channel before writing it down.

If you find yourself reaching for any of the phrases above, the underlying point can almost always be made better with concrete language about what the project actually does.

## Cross-linking conventions

| Where the doc lives | Link style |
| --- | --- |
| Inside the docs site (`content/...`) | Relative absolute path, e.g. `/collective/organisation/support` |
| Project repo `README.md`, `CONTRIBUTING.md` | Full URL: `https://docs.nanocollective.org/collective/organisation/support` (these render on GitHub, where relative paths break) |
| Project repo `docs/` folder | Relative absolute path within the docs site |

The four canonical cross-links every project should know:

- Charter: `https://docs.nanocollective.org/collective/organisation/economics-charter`
- Support: `https://docs.nanocollective.org/collective/organisation/support`
- Community + Code of Conduct: `https://docs.nanocollective.org/collective/organisation/community`
- Brand (this page): `https://docs.nanocollective.org/collective/organisation/brand`

## Required patterns for project documentation

Every Nano Collective project's documentation should follow these patterns:

### `README.md`

- Opens with the project name as the H1.
- Second line: the canonical project tagline (above), with the Nano Collective link.
- Followed by a one-sentence description of what the project does.
- Includes a section near the bottom that links the [Nano Collective](https://nanocollective.org), the [docs](https://docs.nanocollective.org), the [GitHub organisation](https://github.com/Nano-Collective), and [Discord](https://discord.gg/ktPDV6rekE).

### `CONTRIBUTING.md`

- Defers to the [Code of Conduct](https://docs.nanocollective.org/collective/organisation/community). Does not redefine it inline.
- Links the [Economics Charter](https://docs.nanocollective.org/collective/organisation/economics-charter) for any contributor compensation questions. Does not restate the charter's terms.
- Project-specific contribution guidance (development setup, coding standards, test expectations) is fine here. That is what `CONTRIBUTING.md` is for. The collective-level terms are linked, not repeated.

### `docs/index.md` (project's own documentation landing)

- Same opening pattern as `README.md`: project name, canonical tagline, one-sentence description.
- No manifesto framing in the introduction. Lead with what the project does.

### `docs/community.md` (if present)

- Donations and sponsorship sections defer to the [Support page](https://docs.nanocollective.org/collective/organisation/support). Do not restate the support model.
- Code of Conduct defers to the [collective Community page](https://docs.nanocollective.org/collective/organisation/community).
- Project-specific community channels (Discord, GitHub Discussions, etc.) live here.

## Visual identity

Coming soon: logo files, colour palette, typography, and badge templates will be published here as they are finalised.

Until then, the working reference implementation for visual style and asset structure is [Nanocoder](https://github.com/Nano-Collective/nanocoder). Its README, badges, and asset structure represent the current de facto standard.

## Updates and feedback

These guidelines are versioned in this repository. Every change is public and dated. If something here is unclear, contradicts another part of the docs, or no longer reflects the collective's voice, open an issue on the [docs repository](https://github.com/Nano-Collective/docs). These are meant to be iterated on.
