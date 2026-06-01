---
title: "Sponsor onboarding"
description: "Step-by-step playbook for what the Nano Collective core team does when a new sponsorship is confirmed"
sidebar_order: 2
---

# Sponsor onboarding

This page is the operational playbook for what happens after a sponsor commits: logo intake, payment setup, where the logo gets added, and what we publish to acknowledge them. It is published openly because transparency about how the program runs is part of why sponsors should trust it.

For tier perks and the public pitch, see [nanocollective.org/sponsor](https://nanocollective.org/sponsor). For *where* logos go on which surfaces, see [Sponsorship Operations](/collective/sponsors/operations).

## When a sponsorship is confirmed

Trigger: a sponsor has signed up via Open Collective (Individual, Supporter), confirmed via Discord (Builder, Bespoke), agreed to provide non-cash support such as credits, compute, or other resources, or completed a designated donation conversation.

### 1. Logo and link intake

Request from the sponsor:

- **SVG** of the logo, transparent background, no built-in padding.
- **PNG** of the same logo, exported at 2x the target tier width (Supporter 320px, Builder 440px, Bespoke 480 to 560px).
- The link the logo should resolve to (usually their company homepage).
- Confirmation of the legal/display name to use under the logo.

If a sponsor's logo only renders on light or dark backgrounds, request a second variant for the other. NC defaults to dark mode but the docs site supports both.

Store the source files in the website repo at `public/sponsors/<sponsor-slug>.svg` and `public/sponsors/<sponsor-slug>.png`. The slug is lowercase-hyphenated.

### 2. Payment setup

- **Individual / Supporter via Open Collective.** Sponsor signs up directly through the OSC tier page. No core team action needed for payment.
- **Builder.** Confirm OSC tier exists at $1,000/month. If the sponsor needs an invoice, set up the OSC invoice flow (typically required for contributions over $1,000 USD).
- **Bespoke.** Terms agreed and written down before any money moves. Publish the agreed terms on `/sponsor` once the partnership is live.
- **Bitcoin.** Share the wallet address via the agreed channel; ledger the contribution in the Open Collective expense flow.
- **Non-cash.** No Open Collective sign-up is needed, since no money changes hands. Confirm the resources (credits, compute, licenses, hardware, or similar) have been delivered or committed, then work out directly with the sponsor what they get in return: agree a fair monthly equivalent value and map it to a tier per [Sponsorship Operations](/collective/sponsors/operations). Record the agreed value and what was provided so the contribution is visible alongside cash sponsorships.

Annual prepayments receive a 10% discount. Apply this at OSC tier level or via invoice as appropriate.

### 3. Add the sponsor across NC surfaces

What to edit depends on the tier. The placement rules are in [Sponsorship Operations](/collective/sponsors/operations). The mechanical PRs:

**For any sponsor:**

- Open a PR on `nano-collective/website` adding the sponsor's logo files to `public/sponsors/` and listing them in the appropriate section of `pages/sponsor.tsx`.

**For Supporter and above:**

- Same website PR also adds the logo to the `Nano-Collective` GitHub org profile README. Submit a PR on `nano-collective/.github` if the repo exists, or edit the org-profile README directly.

**For Builder and Bespoke:**

- Open a PR on each project repo (`nanocoder`, `nanotune`, `get-md`, `json-up`, plus any newer NC project) adding the logo to the project's `README.md` Sponsors section. Same logo file across all repos: link to the raw GitHub URL of the file in the website repo so there is one source of truth.
- The website PR also updates the homepage "Supported by" strip and the site footer to include the logo.
- On the docs site, the website PR adds the logo to the Support page sponsors list and to the docs footer.

### 4. Publish acknowledgement

- **Supporter.** One-time post across NC social presences (Discord, X, LinkedIn) welcoming the sponsor. Mentions the project they are aligned with, if applicable.
- **Builder.** A dedicated welcome post on the NC blog, plus the social acknowledgement above.
- **Bespoke.** Joint or NC-authored post on the NC blog announcing the partnership, with the agreed framing and any co-marketing assets.

Draft the post before publishing and run it past the sponsor's contact for confirmation. Sponsors should never see their welcome post for the first time once it is live.

### 5. Quarterly update (Builder only)

At the end of each quarter, send Builder sponsors an update email covering:

- What shipped that quarter, across NC projects.
- Where community fund disbursements went (linkable to the public Open Collective ledger).
- What is next on the public roadmap.

This is informational, not promotional, and matches the brand voice: operational, understated, honest.

## When in doubt

The fastest way to clarify a step is on [Discord](https://discord.gg/ktPDV6rekE), or email [hello@nanocollective.org](mailto:hello@nanocollective.org). For changes to this playbook itself, open an issue or a PR on the [docs repository](https://github.com/Nano-Collective/docs).
