---
title: "Sentinel"
description: "A whitepaper for an installable, local-first workflow that runs continuous, configurable security and code audits across an organisation's repositories and files what it finds as issues."
sidebar_order: 9
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "Building"
---

# Sentinel

Security review does not scale with the number of repositories an organisation
has. A formal audit is expensive and periodic; static analysis catches the
classes it has rules for and nothing else; and the reviewing a maintainer does
by eye happens at the moment a pull request lands and never again.

This whitepaper proposes **Sentinel**: an installable workflow that audits every
repository in an organisation on a schedule, using rule packs the organisation
writes itself, and files what it finds as issues on the repository it found them
in. It runs on your own machine or your own runner, against a model you choose.

> **Note on process.** This whitepaper is published retrospectively, with status
> `Building` and no public review window. Sentinel was designed and largely
> built before the document existed, and running a 30-day review over a settled
> design would be theatre. It is published because the scope belongs somewhere
> citable — the repository's README and docs both referred readers to it — and
> because the collective has since decided Sentinel will check the org's own
> infrastructure for conformance, which makes its scope an operational concern
> rather than one project's business. The status flips to `Shipped` at v1.

## Problem

**Audits are snapshots; codebases are not.** A repository audited in March and
merged into forty times since has been audited once, in March. Nothing re-reads
it, and nothing notices when a pattern that was safe becomes unsafe because the
code around it moved.

**Static analysis only knows what it has rules for.** Semgrep and CodeQL are
good and should be run. But they encode general patterns, and most of what goes
wrong in a specific codebase is specific to it: a signer check the project
always does and forgot once, a convention the team agreed and drifted from, an
invariant that lives in three people's heads.

**The knowledge that would catch those things is not written down anywhere a
tool can read.** It is in review comments, in a maintainer's memory, in the
retro after the incident. There is no place to put "this is the mistake we keep
making" such that something checks for it tomorrow.

**And the tools that could help mostly want your code.** Sending an
organisation's entire source to a hosted service is a decision many teams cannot
make, and for some it is the reason they never adopt anything.

## Intended audience

Organisations with more repositories than reviewers. That includes the Nano
Collective itself, which is the first user: eleven public repositories and two
active maintainers.

It is aimed at the person who would otherwise be doing this by hand — a
maintainer, a security-minded engineer, a small team without a dedicated
security function.

## Proposal

Sentinel is a scheduled GitHub Actions workflow that, for each repository an
organisation names:

1. checks the repository out,
2. gathers the files each rule pack asks for,
3. runs each pack's instructions through a model, locally or through a provider
   the organisation configures,
4. validates what comes back against a strict findings schema,
5. and reconciles the surviving findings against the issues already open.

The design has four commitments.

### Rule packs belong to the organisation, not to Sentinel

A rule pack is a Markdown file: YAML frontmatter declaring what it applies to,
and a body written in prose describing what to look for. That is the whole
format. It is portable with a `cp`.

Sentinel ships **no** general-purpose rule packs as product. This is deliberate
and it is the point: a catalogue of packs would make Sentinel a rules vendor,
and the rules that matter are the ones only the team writing them knows. A pack
is where "we always check the signer" finally gets written down somewhere that
checks it.

Severity is the pack's to decide, not the model's. A pack declaring a rule
`critical` gets `critical` in the filed issue, whatever the model answered.

### Local-first, bring your own model

Sentinel invokes [Nanocoder](https://github.com/Nano-Collective/nanocoder),
which speaks to Ollama, LM Studio, llama.cpp, or any OpenAI-compatible endpoint.
An organisation that cannot send its source anywhere runs a local model and
sends nothing. One that is happy with a cloud provider configures one.

There is no Sentinel service. There is nothing to sign up for, no account, no
telemetry, and no copy of your findings anywhere but your own repository.

### It files issues, and stops

Sentinel opens issues. It does not open pull requests, does not commit fixes,
and does not close anything a human opened. A tool that both finds problems and
changes code to fix them has to be trusted twice, and the second kind of trust
is much harder to give.

The output is triage, and triage is what an over-stretched team is short of.

### An audit that repeats must not nag

A tool that refiles the same finding every night is one people mute. So dedup is
not an afterthought:

- Every finding gets a content hash over rule, file and category — deliberately
  **not** the line range, which models report inconsistently between runs and
  which would otherwise refile the same issue after an unrelated edit.
- A finding that recurs **touches** its existing issue rather than creating one.
- A finding that stops recurring ages out over several runs and is then
  auto-resolved, so a fixed problem closes itself.
- A finding a human dismissed stays dismissed: closing an issue with
  `sentinel:false-positive`, `sentinel:wontfix` or `sentinel:accepted` suppresses
  that finding permanently.
- A per-repository `sentinel.yaml` can suppress paths and raise the severity
  threshold locally, so vendored or generated code stops being reported without
  weakening the pack for everyone else.

## What Sentinel is not

Stating this precisely matters more than the feature list, because the failure
mode of an audit tool is being trusted for something it does not do.

- **Not a replacement for a formal security audit.** It is a triage layer. It
  finds candidates; people judge them.
- **Not a SAST replacement.** Run Semgrep and CodeQL alongside it. They catch
  different things, more cheaply and more deterministically.
- **Not a secret scanner.** Use a dedicated one; the problem is well solved.
- **Not a hosted service.** There is no server and no plan for one.
- **Not a rule pack catalogue.** See above.
- **Not a fix-it tool.** It does not open pull requests.

A model can be wrong, and Sentinel's output is a model's opinion validated
against a schema — not a proof. Confidence is reported on every finding for that
reason, and the severity threshold exists so an organisation can decide how much
noise it will accept.

## The property v1 must have

An auditing tool that fails quietly is worse than no auditing tool, because a
tool gets trusted. If a pack fails to parse, a repository fails to check out, or
an error is swallowed somewhere in the middle, the run must not report a clean
estate.

That is a structural requirement rather than a nice-to-have, and it is why
"errors are surfaced rather than swallowed" was treated as release-blocking work
rather than tidying. Every run also writes a durable record, committed to the
configuration repository, so a finding count of zero can be read afterwards as
*nothing found* or *nothing ran* — the two are not the same and must never look
the same.

## Scope of v1

**In:** the scheduled workflow and `sentinel init` scaffolding; the rule pack
format, including `depends_on` and per-pack severity weighting; file gathering
scoped by `applies_to`; strict findings validation with a bounded auto-fix
retry; issue filing with dedup, ageing, auto-resolution and the suppression
layers above; per-repository overrides; a dry-run mode that reports what a live
run would do without touching anything; run records and a static dashboard
generated from them; and cost estimation ahead of a run.

**Out, for now:** commenting on pull requests, opening pull requests, auditing
anything other than a git repository's files, and any hosted component.

## Beyond v1

Two extensions are already known, and both are natural rather than speculative.

**Conformance auditing.** A rule pack that reads repository *configuration*
rather than source — required checks, branch rules, code owners, release
automation — and reports where an organisation's own standards have drifted.
This is why the collective decided Sentinel would be the tool that checks its
infrastructure rather than standing up a separate checker: it is the same
mechanism pointed at a different kind of input.

**Pull request commentary.** Allowing a pack to target an open pull request's
diff and post a structured review instead of filing an issue. The rubric would
be process-focused — deliberately excluding anything the required status checks
already cover — and it would never merge. Labelling and commentary only.

Both are v1.1. Neither changes the commitments above.

## Open questions

**How incremental scanning detects change.** Re-auditing an entire repository
when a handful of files moved is the dominant cost as this scales. Comparing
against a recorded commit is cheapest but assumes git history is present, which
a shallow clone or a `--no-clone` run does not guarantee. Content hashing works
everywhere but reads every file. A hybrid is probably right, at the cost of the
cache carrying two shapes of provenance.

**And the trap underneath it.** Reconciliation cannot currently distinguish *the
finding is gone* from *the file was not scanned*. Skipping unchanged files would
therefore age out and auto-close real, unfixed findings — the tool quietly
reporting a vulnerability as fixed because it stopped looking. The scanned scope
has to reach the reconciler in the same change that introduces the cache, not
after it. This is tracked as
[sentinel#17](https://github.com/Nano-Collective/sentinel/issues/17).

## Related

- [Sentinel on GitHub](https://github.com/Nano-Collective/sentinel)
- [Sentinel documentation](/sentinel/docs)
- [Nanocoder](https://github.com/Nano-Collective/nanocoder), the agent Sentinel
  invokes
