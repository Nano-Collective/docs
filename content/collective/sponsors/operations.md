---
title: "Sponsorship Operations"
description: "Where sponsor logos go, what files they live in, what format they need to be in, and how new sponsorships are added across NC surfaces"
sidebar_order: 1
---

# Sponsorship Operations

This page is the operational reference for the Nano Collective sponsorship program — where sponsor logos go, what format they need to be in, and how a new sponsorship gets added across every NC surface. It is the canonical source contributors consult when opening a sponsorship-related PR.

For the public-facing pitch, tiers, and how prospective sponsors get in touch, see [nanocollective.org/sponsor](https://nanocollective.org/sponsor). For the full economic model, see the [Economics Charter](/collective/organisation/economics-charter).

## Logo specifications

Sponsors submit one of each, named consistently (`sponsor-name.svg`, `sponsor-name.png`):

- **SVG** — preferred everywhere. Transparent background. Used on the website (`/sponsor`, homepage, footer) and on the docs site.
- **PNG** — required as a fallback, exported at 2x the target render width. Used in GitHub READMEs, where SVGs from external sources don't always render reliably across light and dark modes. PNG keeps READMEs predictable.

### Max widths

Width caps on desktop. Both formats are sized to these targets; heights scale to preserve aspect ratio.

- **Supporter** — 160px wide. Lower-cost tier, smaller visual presence.
- **Builder** — 220px wide. Top productised tier, appears across every NC surface.
- **Bespoke** — agreed during partnership scoping. Typically 240–280px for named lead partnerships.

### Requirements

- Transparent background, no built-in padding (NC controls spacing in layout).
- Logo must read on both light and dark backgrounds — NC defaults to dark mode. If the sponsor's logo only works on one, request a single-colour or inverted variant for the other.
- Source files live in the website repo under `public/sponsors/`. Logos referenced in project READMEs point at the same files via raw GitHub URLs so there is one source of truth per sponsor.

## Where logos appear, by tier

Single rule across every surface: **more dollars = more surfaces.** Builders appear everywhere Supporters do, plus more places. Supporters appear on collective-wide surfaces only. Individuals are name-only.

### Website (nanocollective.org)

**`/sponsor` page** — the canonical home for all sponsor recognition. Top-to-bottom layout:

- Builder sponsors — logos, larger size, placed first.
- Supporter sponsors — logos, smaller size, below Builders.
- Bespoke partners (if any) — named in their own section with a paragraph each, placement decided when the partnership is agreed.
- Individual sponsors — names only, at the bottom.

**Homepage** — small "Supported by" strip:

- Builders only. Small logos, alphabetical.
- Supporters and Individuals do not appear on the homepage.

**Site footer**:

- Builders only.

### Docs (docs.nanocollective.org)

**Support page** — sponsors list:

- Builders and Supporters appear, with logos.
- Individuals are not listed here.

**Docs site footer**:

- Builders only.

### GitHub

**`Nano-Collective` organisation profile README** — "Supported by" section:

- Builders appear first, larger logos.
- Supporters appear below, smaller logos.
- Individuals do not appear here.

**Each project's README** (Nanocoder, Nanotune, get-md, json-up, and any future NC project) — Sponsors section:

- Builders appear — logos in the project's Sponsors section, same treatment across every project (Builder logos cross-list to all project READMEs).
- Supporters do not appear on individual project READMEs (they live on the org README and `/sponsor` only — this is the Supporter / Builder differentiator).
- Individuals do not appear here.

**`.github/FUNDING.yml`** — exists in every NC repo, links to Open Collective. Puts the "Sponsor" button at the top of each repo with zero ongoing maintenance.

## Adding a new sponsor

The mechanical steps are in the [Sponsor onboarding](/collective/sponsors/onboarding) playbook. This page is the reference for *what* changes; that page is the reference for *how* to make the changes.

## Ending a sponsorship

See the [Sponsor offboarding](/collective/sponsors/offboarding) playbook.

## Updates

These specs are versioned in this repository. Every change is dated and public. If something here is unclear, contradicts another part of the docs, or no longer reflects how the program is run, open an issue on the [docs repository](https://github.com/Nano-Collective/docs).
