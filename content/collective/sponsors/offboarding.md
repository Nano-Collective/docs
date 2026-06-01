---
title: "Sponsor offboarding"
description: "What happens when a Nano Collective sponsorship ends: by lapse, by cancellation, or by NC declining to continue"
sidebar_order: 3
---

# Sponsor offboarding

Every sponsorship ends at some point. This page documents how the Nano Collective handles the end of a sponsorship, on the sponsor's side or ours, so a sponsor knows exactly what to expect before they sign up.

For onboarding and active-sponsorship operations, see the [Sponsor onboarding playbook](/collective/sponsors/onboarding) and [Sponsorship Operations](/collective/sponsors/operations).

## How sponsorships end

A sponsorship can end in three ways:

- **Lapsed.** The recurring payment fails and is not restored within 14 days (covers genuine failures: expired card, banking issue, missed renewal).
- **Cancelled.** The sponsor cancels their recurring contribution on Open Collective or notifies NC directly.
- **Declined-by-NC.** In rare cases, the Nano Collective declines to continue a sponsorship under the editorial line on [nanocollective.org/sponsor](https://nanocollective.org/sponsor). Decisions are made by the core team and are not appealable, and we notify the sponsor before taking down their logo.

## What happens, and when

Regardless of which way a sponsorship ends, the process is the same.

### Day 0: sponsorship ends

The sponsor's last accepted payment closes their active period. No new perks accrue. Existing acknowledgements (welcome blog posts, quarterly updates already sent) remain published as a public record of the partnership. We do not retroactively edit history.

### Day 0 to 30: logo removal window

Sponsor logos stay live for **30 days** after the sponsorship ends, across every surface they were placed on (the `/sponsor` page, the homepage strip, the site footer, the docs site, the org profile README, and any project READMEs). This window exists so the transition is not abrupt: sponsors who lapse accidentally can restore the payment without losing visibility, and sponsors who cancel cleanly are not pulled down the same day.

Sponsors who request immediate removal can have it; reach out via [Discord](https://discord.gg/ktPDV6rekE) and we will remove within 48 hours.

### Day 30: logo removed

After the 30-day window, the core team opens a PR removing the sponsor's logo from every NC surface, using the same list of files as the onboarding PRs in reverse. The source files in `public/sponsors/` are kept in the repo (so historical pages and the Open Collective ledger remain consistent) but no longer referenced anywhere.

### After Day 30: public record

- The sponsor's entries on the [Open Collective ledger](https://opencollective.com/nano-collective) remain visible permanently. That ledger is the source of truth for financial history.
- Blog posts and announcements that named the sponsor stay live as historical records.
- The sponsor is welcome to re-enter the program at any tier at any time. We will not treat a returning sponsor differently from a new one.

## Bespoke partnerships

Bespoke partnerships follow the same lifecycle, with two additions:

- The end of a bespoke partnership is announced publicly on the `/sponsor` page when the dedicated named section is removed, so anyone looking for the partner's previous presence has context.
- Any joint content (co-authored posts, recorded conversations) stays published. We do not retract collaborative work that was published in good faith.

## Declining to continue

If NC declines to continue a sponsorship under the editorial line, we will:

1. Notify the sponsor in writing first, explaining the decision in plain terms.
2. Honour the 30-day logo removal window unless the situation specifically warrants faster removal.
3. Refund any prepaid amount that covers time beyond the immediate removal date, less any reasonable processing fees.

These decisions are made by the core team and are not appealable, but they are made carefully and rarely.

## Questions

For anything about how this process applies to a specific situation, reach out on [Discord](https://discord.gg/ktPDV6rekE) or to the core team directly. For changes to this playbook itself, open an issue or a PR on the [docs repository](https://github.com/Nano-Collective/docs).
