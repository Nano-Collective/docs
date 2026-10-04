---
title: "DocsForest"
description: "A working whitepaper for a Nanocoder driven workflow that runs weekly across the collective's repositories, checks the documentation in each repo against the actual functionality, and raises an issue on the repo when the two have drifted"
sidebar_order: 5
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "Paused"
review_opens: "2026-05-22"
review_closes: "2026-06-21"
status_changed_on: "2026-10-04"
---

# DocsForest

> **Paused, 4 October 2026.** DocsForest is on hold. It can be picked up again by anyone willing to drive it.

Every project the collective ships has documentation. Every project the collective ships also evolves. Between the two, documentation drifts. A flag gets renamed, a default changes, a feature is quietly retired, a new option is added with no doc, an installation step that worked six months ago no longer does. None of it is malicious; all of it is normal. The doc reads correctly when it was written, then it slowly stops reading correctly, and nobody notices until a user opens an issue saying "I followed your docs and it did not work."

A careful reviewer would catch this if they read the docs alongside the code regularly. Nobody has time to do that for every repo every week. The work is real, the value is high, and it gets pushed to the bottom of the backlog forever.

This whitepaper proposes a project that fills that gap with a Nanocoder driven workflow shaped like [ContentForest](https://github.com/Nano-Collective/contentforest): a weekly GitHub Actions run, a templated prompt fed with the current docs and the current source, a validator on the output, and an issue filed on the affected repository when the agent finds drift worth a human looking at. [Sentinel](https://github.com/Nano-Collective/sentinel) is the close sibling on the project side; the shape (scheduled Nanocoder run, structured findings, dedup'd issue filing) is shared. The difference is what the prompt is checking: not security patterns, but agreement between what the docs claim and what the code does.

The document is published in working form so the collective can argue the shape of it before code lands. The naming and several design decisions have been settled during review (recorded below); the remaining scope and design decisions are still open.

## Problem

Documentation drift is a quiet failure mode. The docs do not throw an error when they go out of date. CI does not fail. Tests pass. The only signal is a user who tries to follow the docs and finds that something does not behave the way the document said it would, and most of those users never report it; they just stop using the project.

The existing toolbox around this problem catches a narrow slice:

1. **Link checkers and spell checkers.** Catch broken links and typos. Do nothing about semantic drift.
2. **Doctest style frameworks (Python's `doctest`, Rust's docstring examples).** Catch drift in code samples that are runnable, by running them. Do nothing about prose claims, conceptual descriptions, or steps that are not literally executable in a test harness.
3. **Manual review during PRs.** The reviewer's eyes catch what the reviewer happens to remember. A PR that renames a flag in code without touching the docs sails through if the reviewer does not happen to think of every place the flag is mentioned.
4. **User reports.** Reactive. Only surfaces drift that has already hurt someone.

The gap is a tool that reads the docs as a careful user would, reads the code as the maintainer does, and flags the places where the two disagree. That is the kind of work an LLM agent can do reasonably well, and it composes naturally onto the same pattern ContentForest already runs successfully for content generation.

The need is particularly real for the collective. NC ships several products under the same organisation. Each has its own docs. Each evolves on its own cadence. The docs site at [docs.nanocollective.org](https://docs.nanocollective.org) is the public face of those products, and it is the surface where drift hurts most.

## Intended audience

The primary user, at least in v1, is the collective itself.

DocsForest is shaped as an internal NC tool first, the same way ContentForest is. It runs across the collective's own product repositories (nanocoder, nanotune, get-md, json-up, and any future additions), watches the docs for drift, and files issues on the affected repo for the project's maintainers to triage. The audience is small, well known, and on hand to tune the prompt and the workflow as it lands.

A second path, now committed for v1, is the same Sentinel style installable shape: any GitHub organisation can install DocsForest into their own org with `npx @nanocollective/docsforest init`, point it at their own repos, and get the same audit posture for their own docs. The mechanics are not very different from Sentinel's. The over generalisation risk, shipping an uncalibrated prompt to external orgs before it is proven, is handled by the dry run mode: a fresh install defaults to dry run, so an external org sees a markdown preview of what would file and calibrates the prompt before it ever switches to live and files a single issue.

The internal NC use case is still the one that justifies building it, and it remains the primary v1 target. Installability ships alongside it rather than waiting for phase 2, because the hosted runner plus configured endpoint posture (the same as ContentForest) makes an external install cheap: an org needs a model API key and the installer, not self hosted infrastructure.

## Principles

The three values that govern every Nano Collective project apply, with two carrying particular weight for this project:

- **Privacy respecting.** The privacy guarantee rests on three things the operator can verify and control, not on a claim that data never moves. DocsForest is fully open source, so what the agent reads and what it sends is auditable in the open. It is completely operator controlled: the operator chooses the model endpoint, holds the API key, and can read every line of the workflow before running it. And it has first class support for fully local operation: point a self hosted runner at a local model and nothing leaves hardware the operator owns. The honest default, mirroring ContentForest, is a GitHub hosted runner calling a configured cloud endpoint, in which case the docs and code do leave the runner; that path is explicit configuration, never hidden behaviour. The project is honest about exactly which material is sent where, and never pretends to a locality it does not have.
- **Local first.** This is a core collective value, and DocsForest keeps local a fully supported first class path: any local Nanocoder provider (Ollama, LM Studio, llama.cpp, MLX) can be configured, and an operator who stands up a self hosted runner can keep every call on hardware they own. The honest caveat specific to this project is that the default deployment runs on GitHub hosted runners, which cannot run a useful local model, so the practical out of the box default is a configured cloud endpoint. Local is first class and recommended wherever the operator can run it; it is not the zero configuration default on hosted runners.
- **Open for all.** Full source open. The prompt published. The workflow public. Anyone can read what the agent is told to look for, fork the workflow, and adapt it to their own posture.

A fourth principle, specific to this project, is worth naming:

- **Honest about LLM judgement.** Documentation drift is not a binary state. "The docs say X, the code does Y" is sometimes drift, sometimes aspirational documentation, sometimes a deliberate simplification for the reader. The agent will be wrong about which is which a non trivial fraction of the time. The tool must surface its reasoning, must make dismissal cheap, and must not pretend the verdicts are authoritative.

## Threat model (open)

DocsForest is closer to a quality tool than a security tool, so the threat model is lighter than Sentinel's. Naming what it does and does not address, to be argued:

**Documentation drift that a careful reader would catch.**
The thing the project exists to find. In scope. Quality depends on the prompt and the underlying model.

**Aspirational documentation deliberately ahead of the code.**
Partial. A README that describes a feature still in development is technically "drift" by the agent's reading. The prompt has to acknowledge this and either suppress findings the maintainer marks as aspirational, or accept that those findings get triaged and closed as `wontfix`. Either way is honest if the docs are clear.

**Docs that are wrong in a way no automated tool can detect.**
Out of scope. If the docs describe behaviour that matches the code but is itself the wrong behaviour, neither DocsForest nor any other docs auditor can help. That is a design review problem.

**Secrets accidentally included in either docs or code paths the agent reads.**
The responsibility sits with the operator. The configured cloud model endpoint is operator-controlled; an operator who needs pre-send scrubbing composes the workflow with whatever content-layer tool fits their threat model. DocsForest itself does not provide that layer.

**The tool itself filing noisy issues that overwhelm the maintainer.**
In scope. Issue dedup, severity thresholds, and a clear path for the maintainer to suppress recurring false positives are part of the v1 surface, not polish items.

**The tool itself exfiltrating private docs or code.**
In scope as a project concern. The workflow runs inside the collective's GitHub Actions workspace, but the default deployment sends docs and code to a configured cloud model endpoint, so the material does leave the runner. That path is explicit configuration, never hidden behaviour. An operator who wants nothing to leave their own hardware configures a local model on a self hosted runner.

## Proposed approach

Four primitives. The shape mirrors ContentForest and Sentinel closely; only the prompt and the output target are different.

### The workflow

A GitHub Actions workflow, scheduled weekly. On its cron trigger, the workflow:

1. Reads the configuration to determine which repositories to audit this run.
2. For each target repository, clones the repository's main branch into the workspace.
3. Identifies the docs surface for that repo. This is normally the `docs/` directory plus the README, but the configuration can override per repo.
4. Runs Nanocoder against a templated prompt that gives the agent the docs files, a manifest of the source tree, and access to read source files on demand. The prompt asks the agent to identify places where the docs and the code disagree.
5. Collects the agent's findings in a structured output format.
6. Validates the findings against a small set of hard rules (well formed JSON, every finding cites at least one docs file and one source file, severity within the allowed set).
7. Files an issue on the audited repository for each finding that meets the configured severity threshold, or updates the existing issue if a matching finding has already been filed.

This is the ContentForest pattern with the inputs and the output target swapped, and the prompt rewritten for the docs auditing job. The orchestrator script, the prompt template substitution, the validation gate, the retry loop, and the auto fix step all carry over with adjustments.

### Configuration

Configuration lives in a single repository, separate from any audited repo. For the v1 NC internal install, this is DocsForest's own repository, the same way ContentForest's own repo holds its config. For an external install, `npx @nanocollective/docsforest init` scaffolds the same files into the organisation's chosen hub repository. The configuration files declare:

- **Targets.** Which repositories to audit. NC's product repos by default.
- **Docs surface per target.** Which paths in the repo count as "the docs". Default is `docs/**` plus `README.md`; per repo overrides allowed.
- **Schedule.** Cron expression. Weekly by default.
- **Severity threshold.** Below what severity to suppress issue filing. Defaults are sensible; tuning is expected.
- **Model configuration.** Which Nanocoder provider and model to use. Local by default, cloud opt in.
- **Issue routing.** Which label to apply (default `docs-drift`), whether to assign anyone, whether to file in the audited repo (default) or aggregate to the configuration repo (option).
- **Run mode.** Live (default) files issues. Dry run files nothing and instead renders every candidate finding to a markdown preview, for calibrating the prompt before going live. Detailed below under issue filing.

Configuration is plain files in plain Git. A change to who gets audited is a PR like any other.

### The audit prompt

The prompt is the centre of gravity for this project, the way the rule packs are for Sentinel and the brand voice document is for ContentForest. The prompt is published, versioned, and iterated in the open.

What the prompt asks the agent to do, sketched at the level a v1 needs:

- Read each docs file in scope.
- For each factual claim in the docs (a flag exists, a default is X, a command takes these arguments, an installation step does Y), confirm the claim against the source.
- Report any claim the source contradicts, any claim the source no longer supports, and any documented step that no longer works as written.
- On a best effort basis, while reading the source to verify the above, also flag user facing surface the docs do not mention: new commands, flags, config keys, environment variables, public API. Report these at low confidence. This pass is opportunistic, not exhaustive, so the absence of such a finding is not proof the docs are complete. Private internals, helpers, and code the user never touches are explicitly out of scope for this check. (See resolved item 8 under "Resolved in review".)
- Distinguish, where possible, between confident findings and uncertain ones. A flag renamed in code with the old name still in the docs is high confidence. A doc paragraph that "feels stale" without a clear contradiction is low confidence and should be reported with that framing or omitted.
- Cite, for each finding, the specific docs file and line, the specific source file and line, and a short rationale.

The prompt also explicitly tells the agent what *not* to do: not to rewrite the docs, not to open PRs, not to flag stylistic preferences, not to flag aspirational documentation as drift when the docs clearly signal something as planned or upcoming. The list of "do not"s is as load bearing as the list of "do"s, for the same reason it is on Sentinel: an over eager agent files noise; a calibrated agent files signal.

### Issue filing

When the agent produces a finding that meets the configured severity threshold, the workflow files an issue on the affected repository. The issue body includes:

- A short summary of the drift.
- The docs file and the source file involved, with line ranges.
- The agent's rationale.
- The confidence level (high / medium / low).
- Suggested next step ("update the docs", "the docs are right and the code is wrong", "this is intentional, suppress this finding").
- A footer that names DocsForest as the source, links to the configuration repo, and explains how to dismiss the finding if it is a false positive.

Dedup is enforced by a content hash over the finding's salient fields (docs file, source file, claim being checked). A subsequent run that produces the same finding updates the existing issue's last seen timestamp instead of filing a duplicate. A finding that stops appearing across N consecutive runs is marked as resolved automatically.

The maintainer of the audited repo retains full control. Beyond closing an issue, three suppression states are recognised: `wontfix`, `false-positive`, and `aspirational` (a state specific to this project, recognising that some apparent drift is intentional). Because GitHub's API offers only two native close reasons (`completed` and `not planned`), these three states are encoded as a **label convention** rather than as native close reasons: the maintainer applies a label such as `docs-drift:false-positive` or `docs-drift:aspirational` when closing the issue, and the workflow reads the labels on closed issues. A `false-positive` or `aspirational` label is read back by the workflow and prevents the same finding from being refiled. The label convention keeps the maintainer's action on the issue they are already closing, with no parallel datastore to keep in sync.

A **dry run mode** sits in front of all of this. When the run mode is dry run, the workflow does everything up to the point of filing: it audits, validates, applies the severity threshold, and computes dedup, then files nothing. Instead it renders every candidate finding to a markdown preview, grouped into what would be filed as new, what dedup would have matched to an existing issue, and what falls below the threshold. The preview mirrors the real issue body field for field (summary, docs file and source file with line ranges, rationale, confidence, suggested next step) so it is a true preview, not a different artefact. The preview is written to the GitHub Actions job step summary and uploaded as a run artefact: ephemeral, no commits, gone after the run. Dry run is the calibration path. Run it, read the markdown, tune the prompt, then switch to live. It is a mode of the same workflow, not a separate first run behaviour, so the decision that live runs always file all qualifying issues stays intact.

### Distribution (v1)

For v1, DocsForest is an NC repository under the [Nano-Collective](https://github.com/Nano-Collective) organisation. The shape is the same as ContentForest's: one repo holds the workflow, the config, the prompt, the orchestrator script. The workflow runs on NC's schedule against NC's repos, on GitHub hosted runners.

v1 also ships the installable shape, the same pattern as Sentinel's `npx @nanocollective/docsforest init`. The shape is a hub, not a per repo install: an organisation runs `init` once inside a single repository (a dedicated DocsForest repo, or an existing ops repo), and the installer scaffolds the scheduled workflow, the configuration file, and a starting copy of the audit prompt into it. The operator then lists their target repos in the configuration, sets their model API key as a GitHub Actions secret, and commits. The workflow audits every listed repo and files issues on each. DocsForest is invoked by the workflow as a CI tool through `npx`; it is not a runtime dependency added to any audited project.

The non secret configuration (targets, docs surface, schedule, severity, model endpoint, run mode) is a plain file in that hub repository, versioned in Git like any other. The only thing not committed is the model API key, which lives in GitHub Actions secrets. To contain the risk of an uncalibrated prompt landing on a stranger's repos, a fresh install defaults to dry run mode: it previews findings as markdown and files nothing until the operator explicitly switches to live.

The audit prompt is copied into the install at `init` time and owned by the operator from then on. They edit it in their own repo, validate changes in dry run, and go live when satisfied. There is no live prompt fetch from NC, and so no central prompt version to manage; pulling later improvements from NC's reference prompt is a manual copy, or a phase 2 `update` convenience, not a v1 mechanism.

### The execution model

A weekly run flows like this:

1. The workflow triggers on its cron schedule (default: Mondays at 08:00 UTC, late enough to land after the weekend, early enough that any findings have the full week to triage).
2. It reads the configuration to determine which repositories to audit this run.
3. For each target repository, it clones the repo at the default branch.
4. It identifies the docs surface and the source tree.
5. It runs Nanocoder against the templated prompt with the docs and a source tree manifest. The agent reads further source files on demand via Nanocoder's filesystem tools.
6. Nanocoder produces a structured findings output. The validator checks the shape. On a hard failure, an auto fix step runs the agent again with the structured error report; on validation success, the orchestrator moves on.
7. For each finding that meets the severity threshold and is not already filed, the workflow opens an issue on the target repo. Findings that match an existing issue update its last seen timestamp.
8. A run summary lands in the configuration repo, with cross repo metrics aggregated for the maintainer.

The substrate is the same whichever model is configured. The default is a cloud model on a GitHub hosted runner, called through a configured model endpoint; an operator who runs a self hosted runner can point the same workflow at a local model instead.

## A worked example: the collective's own repos

Picture the v1 internal install running against NC's product repos. The configuration declares:

- **Targets.** `nanocoder`, `nanotune`, `get-md`, `json-up`.
- **Docs surface per target.** `docs/**` plus `README.md` for each.
- **Schedule.** Mondays at 08:00 UTC.
- **Severity threshold.** Medium and above file issues automatically. Low confidence findings appear in the run summary but do not file.
- **Model configuration.** A configured cloud model on a GitHub hosted runner, the same posture ContentForest runs (ContentForest uses MiniMax). An operator who prefers local points the same configuration at a local provider on a self hosted runner.

The schedule fires on a Monday morning. The workflow:

1. Reads the configuration. Four target repositories.
2. For `nanocoder`, clones the repo and identifies the docs under `docs/` and the README. Reads them. Reads the source tree manifest.
3. The agent notices that `docs/configuration/providers.md` describes the `OPENAI_API_KEY` environment variable as the only way to configure OpenAI, but the source now also reads `OPENAI_BASE_URL`. The doc is missing the new variable. Severity medium, confidence high.
4. The agent notices that `docs/features/checkpointing.md` describes a `/checkpoint save` command, but `src/commands/checkpoint.ts` no longer registers `save` as a subcommand; the API is now `/checkpoint write`. Severity high, confidence high.
5. The agent notices that the README still describes the project as supporting "Ollama, LM Studio, and OpenRouter", but the providers list in source now also includes MLX and llama.cpp. Severity low, confidence medium.
6. The validator confirms the output. Two findings meet the threshold; one is suppressed to the run summary.
7. The workflow files two issues on `nanocoder`, each labelled `docs-drift`. For the other three repos, the same shape runs. `nanotune` produces nothing. `get-md` produces one finding about a flag default that changed. `json-up` produces nothing.
8. The Monday morning issue queue, for the maintainers who watch it, contains three new docs drift issues across the four repos. They triage in the normal flow. The `nanocoder` checkpoint command finding becomes a PR within the day. The `OPENAI_BASE_URL` finding becomes a smaller doc patch. The `get-md` finding is closed as `false-positive` after the maintainer confirms the docs deliberately describe the previous default for backward compatibility, and the workflow reads the close and suppresses the finding on future runs.

The arrangement also tests the project's principles honestly. The model call goes to a configured cloud endpoint, so the code and docs are sent off the runner rather than kept local. The privacy story is the operator's control over that endpoint, not a claim that nothing leaves the runner. The prompt is published and inspectable. The local path stays available for an operator who runs a self hosted runner. Disabling DocsForest is disabling the workflow file; there is no NC hosted service in the loop.

## v1 scope

A deliberately narrow v1, shipped well.

- **An NC repository.** Same shape as ContentForest. Holds the workflow, the prompt, the orchestrator script, the configuration.
- **A weekly GitHub Actions workflow on hosted runners.** `ubuntu-latest`, Mondays at 08:00 UTC by default, with per repo cadence overrides. PR triggered runs deferred to phase 2.
- **A published audit prompt.** The prompt itself lives in the repo, versioned, with PRs against it like any other artefact.
- **Issue filing with dedup.** Content hashed findings, no duplicate issues, `false-positive` and `aspirational` closes respected via a label convention.
- **A dry run mode.** Live mode files issues; dry run previews every candidate finding as markdown without filing, for calibrating the prompt before going live.
- **An installable shape.** `npx @nanocollective/docsforest init` for any GitHub org, alongside the internal NC install. Fresh installs default to dry run.
- **A configured model endpoint, cloud by default.** Local first is a fully supported path on a self hosted runner; the out of the box default on hosted runners is a configured cloud model. The project ships no model recommendation.
- **The collective's own product repos as the v1 target set.** Four repos at the time of writing.

What v1 ships is "a workflow, a prompt, a small set of NC repos to watch, a clear surface for adding more." Not a docs platform. Not a docs generator. The starting point that grows.

## What it is not (in v1)

- **Not a docs generator.** DocsForest finds drift; it does not write or rewrite the docs. The maintainer fixes what gets flagged. Auto fix PRs are a plausible phase 2 surface, not a v1 commitment.
- **Not an exhaustive coverage checker for undocumented features.** v1 makes a best effort, opportunistic pass at user facing surface the docs omit, flagged low confidence, but it does not guarantee finding every undocumented feature; that would require comprehensive source reading v1 does not do. A clean run means "no drift found in what was checked", not "the docs are provably complete" (resolved item 8 under "Resolved in review").
- **Not a linter.** Stylistic preferences, grammar, tone are out of scope. The agent is told to ignore them. Existing tools handle that better.
- **Not a link or spell checker.** Existing tools handle that better. DocsForest does not duplicate them.
- **Not a replacement for human review of docs.** Drift is one failure mode among many. A doc that is technically correct but unclear, misleading, or organised badly still needs a human to fix it. DocsForest does not pretend to do that work.
- **Not a hosted service.** No NC hosted instance, no SaaS shape. Every deployment, internal or installed, runs in the operator's own GitHub Actions workspace against their own configured model endpoint. Installable does not mean NC runs it for you.
- **Not a security tool.** That is [Sentinel](https://github.com/Nano-Collective/sentinel)'s job. The two are siblings; running both on the same repo set is the natural posture.
- **Not a model.** DocsForest uses whichever Nanocoder configured providers the operator points it at. The collective does not train or ship a docs tuned model.

## Composition with other collective projects

Most collective projects compose with DocsForest through plain configuration. A few have a more specific integration shape worth naming:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder)** is the runtime under every audit pass. The workflow runs Nanocoder in non interactive mode against a templated prompt, the same shape ContentForest already uses.
- **[ContentForest](https://github.com/Nano-Collective/contentforest)** is the closest sibling. The two share enough of their orchestration shape (cron driven Nanocoder run, prompt template substitution, validator with auto fix, structured output, dedup'd downstream action) that DocsForest takes from ContentForest's playbook freely. The two stay as independent projects on independent release cadences; the shared shape is a pattern, not a library.
- **[Sentinel](https://github.com/Nano-Collective/sentinel)** is the other sibling. Both watch repos on a schedule and file issues against findings. Running both on the same repo set is the natural posture; the two will produce issues with different labels and the maintainer triages each on its own terms.
- **[NanoOS](/collective/whitepapers/nano-os)**, if and when it lands, is a natural place from which to invoke DocsForest runs as a sub agent on demand, alongside the scheduled passes.

## Alternatives considered

- **Doctests and runnable code samples in the docs.** Strong where they apply. Cover only a sliver of what docs say. A README that explains, in prose, that "the `--mode yolo` flag bypasses all confirmation prompts" is not a doctest target; the agent based check is.
- **Auto generated docs from source.** Solves drift by definition (the docs are the source). Loses everything that makes the docs useful as a user facing artefact: the prose explanations, the design framing, the worked examples. Not the right answer for any of NC's product docs.
- **A custom static analysis tool that checks specific claim shapes.** Possible for some claims (a documented CLI flag must exist in the source's argument parser). Brittle and high effort, and only covers structured claims. The LLM approach generalises across claim shapes at the cost of probabilistic verdicts.
- **Lean on PR review to catch drift at write time.** This is what the collective does today, and the gap this project exists to close. PR review catches some drift; it does not catch drift accumulated over months from PRs that did not happen to touch the relevant docs.
- **Build this into ContentForest as another mode.** ContentForest's job is release content generation. Adding a docs audit mode would muddy that scope and make the ContentForest prompt heavier than it needs to be. A separate project that copies the orchestration patterns it needs is the cleaner shape. The shared shape across the two stays a pattern, not a library.
- **Build this into Sentinel.** Tempting, since both file issues on a schedule. The prompts and the finding categories are different enough that they would diverge inside Sentinel anyway. Two projects with shared mechanics is honest; one project with two modes is the design trap.

## Open risks

These are the concerns that could kill the project or force it into a different shape.

1. **False positives at install time are loud.** The first weekly run across four NC repos will land however many findings the prompt produces, regardless of whether the prompt is calibrated. A flood of low quality issues on day one could train the maintainers to ignore the label. The decision taken in review is to keep the mechanism simple: the first run files all qualifying issues at once, the same as every subsequent run, with no summary only staging. The accepted trade-off is that an uncalibrated first run is the maintainers' signal to tune the prompt, and the v1 audience is the collective's own maintainers, who are on hand to do exactly that. The residual risk is real, and the mitigation lives in the prompt's calibration and the severity threshold rather than in a special first run mode. The dry run mode is the concrete tool for that calibration: run the audit in dry run, read the markdown preview of what would file, tune the prompt, then switch to live. The first live run still files everything, but nobody is forced to take a blind first live run.

2. **Aspirational documentation is a real category and the prompt has to acknowledge it.** Some of NC's docs deliberately describe behaviour that is on the roadmap. A prompt that flags every gap as drift creates noise. A prompt that ignores all aspirational sounding language misses real drift. The line is in the prompt and it is design work, not implementation work.

3. **The prompt is the centre of gravity.** Same risk as ContentForest's prompt. A weak prompt produces noise; a strong prompt produces signal. The first version will be wrong about something; the prompt has to be easy to iterate, the changes have to be small, and the feedback loop has to be tight.

4. **Cost compounds with repo count and docs surface size.** Reading a full docs site plus a relevant source surface for every repo, every week, adds up, and because the default is now a cloud model on hosted runners, that cost is real spend rather than just local compute. The mitigations are a tight severity threshold, scoping the docs and source surface narrowly, weekly rather than daily cadence, and the standing option to point a self hosted runner at a local model where an operator would rather trade infrastructure for token cost. The cost story has to be honest in the docs, not buried.

5. **The maintainer rage path is real.** Even with dedup and severity thresholds, a busy repo with many findings is a chore to triage. The project has to make triage easy (labels, close states, suppression patterns) or maintainers will silence the label and the project effectively dies.

6. **The line between "drift" and "the docs are simplifying for the reader" is judgement.** A doc that says "Nanocoder supports local models" when the source supports "local models, plus cloud models, plus MCP servers" is technically incomplete but not wrong, and might be a deliberate simplification for an introductory paragraph. The agent will get this category wrong sometimes. The suppression UX has to absorb that.

7. **Source size limits.** Some repos are bigger than any reasonable model context window. The prompt's strategy for navigating a large source tree (manifest plus on demand reads, scoped sub passes per docs section, summarisation) is design work that has to land in v1, not be discovered when the first large repo arrives.

## Resolved in review

These questions were open when the whitepaper was published and were settled during the public review window. They are recorded here as the design history.

1. **Naming.** Settled: **DocsForest**. The working title becomes the name. It keeps the deliberate ContentForest sibling framing and signals the shared orchestration shape, without colliding with Sentinel the way an "AuditForest" would.
2. **First run behaviour.** Settled: the first run **files all qualifying issues at once**, identical to every later run. No summary only first pass, no per repo staging. Keeping the mechanism simple is the priority; a noisy first run is the maintainers' cue to tune the prompt, and the v1 audience can absorb that. See open risk 1 for the accepted trade-off.
3. **Docs surface detection.** Settled: **configurable per target**. The operator passes a repo and the paths where its docs live. The default is `docs/**` plus `README.md`, fully overridable per repo, both to widen the surface (add `CHANGELOG.md`, a `website/` directory) and to narrow it. There is no hard coded docs location.
4. **Source surface navigation.** Settled: the agent is handed the **docs in scope** and uses **Nanocoder's filesystem and search tools to read and grep the source on demand**, deciding per claim whether the code supports it. There is no whole tree preload. This is the lightest shape that scales past a single context window and is the same posture ContentForest already runs. The asymmetry it introduces (verifying a doc claim is a targeted search, but discovering undocumented functionality is not) is addressed in resolved item 8 below.
5. **Central docs site.** Settled: **out of scope**. DocsForest audits each product repo against that repo's own docs only. It does **not** audit the central docs site at docs.nanocollective.org against the product repos. If that audit is wanted later it is a separate project with its own configuration, not a DocsForest mode.
6. **The v1 audit prompt.** Settled: writing and pressure testing the prompt is **build time work**, not a whitepaper graduation gate. It will be scoped, implemented, and tested when the project is built. The whitepaper's job is to argue the shape; the prompt is the first build task inside that shape.
7. **Severity model and close state encoding.** Settled in two parts. Severity is a simple **low / medium / high** scale, plus a separate **confidence** value, plus a **category** (the same answer as Sentinel; CVSS style scoring is irrelevant here). The `aspirational` close state is encoded as a **label convention**: since GitHub's API offers only two native close reasons (`completed`, `not planned`), the maintainer applies a label such as `docs-drift:aspirational` or `docs-drift:false-positive` when closing, and the workflow reads labels on closed issues. No external mapping table. See the issue filing section above.
8. **Discovering undocumented functionality.** Settled: **scoped best effort in v1**, not deferred. While the agent is already in the source verifying claims, it also flags user facing surface it happens to encounter that the docs omit: new commands, flags, config keys, environment variables, public API. These findings are reported at low confidence, and the proposal is honest that coverage here is best effort and not exhaustive, since finding every undocumented feature would require comprehensive source reading the on demand model does not do. Scoping the check to user facing surface is what keeps it from drowning the maintainer in findings about private internals that user docs were never meant to cover. The prompt's "do" list and "what it is not" section reflect this.
9. **Dry run mode.** Settled: the workflow has a **dry run mode** alongside the default live mode. Dry run does the full audit but files nothing, rendering every candidate finding to a markdown preview (grouped into what would file as new, what dedup would have matched, and what falls below the threshold) written to the Actions step summary and a run artefact, ephemeral and commit free. It is the calibration path for the prompt and does not change the live first run behaviour settled in item 2. See the issue filing section above.
10. **Per repo cadence.** Settled: **configurable in v1**. Weekly is the default, and per repo overrides ship from v1 (a fast moving repo on daily, a stable one on monthly), set in the same configuration that declares the targets.
11. **Model defaults.** Settled: **no shipped recommendation**. DocsForest ships neither a recommended local model floor nor a recommended cloud fallback. The model is configured per repo, and the operator chooses. The local first principle still sets the default posture, but the project takes no position on which specific model an operator should run.
12. **Auto fix PRs.** Settled: **phase 2**, with the door left open in v1. v1 does not open PRs. The v1 finding output is designed so a later auto fix surface can consume it directly: each finding already carries the docs file, the source file, line ranges, and a suggested next step, so adding auto fix in phase 2 does not require reshaping the output.
13. **Stack.** Settled: **TypeScript**, matching ContentForest and the rest of the collective.
14. **Relationship to ContentForest and Sentinel.** Settled: **stay separate for now**. The three projects share a "cron, Nanocoder, prompt, validator, structured output, dedup'd downstream action" shape but remain independent projects on independent release cadences. The jobs differ (content generation, security findings, docs drift), the prompts differ, the output targets differ, and the surface that looks shared at the orchestrator level diverges quickly once each handles its real world edges. A shared library would couple their cadences and add an abstraction none of them needs. Each copies what it needs from the others. They will be unified only if a concrete need appears; until then the only shared code is the kind of tiny standalone utility (frontmatter parsing, finding hash computation) that NC already ships as its own package, the way `get-md` and `json-up` exist. No shared "forest framework" under the three.
15. **Runner and model posture.** Settled: **match ContentForest**. DocsForest runs on GitHub hosted runners (`ubuntu-latest`) calling a configured model endpoint, which in practice is a cloud model the way ContentForest uses MiniMax. Local stays a fully supported first class path for operators who stand up a self hosted runner, but it is not the out of the box default, because hosted runners cannot run a useful local model. The principles, threat model, and worked example were rewritten to state this honestly rather than claim the material never leaves the runner. The Prompt Scrubber and Private Inference Proxy are separate projects and are not part of DocsForest's v1 composition story; the v1 posture is "operator-chosen configured cloud endpoint, with full local support on self-hosted runners."
16. **Installable shape.** Settled: **ships in v1**. `npx @nanocollective/docsforest init` for any GitHub org, alongside the internal NC install. A fresh install defaults to dry run mode so an external org calibrates the prompt before filing anything. The hosted runner plus configured endpoint posture makes the external install cheap: a model API key and the installer, no self hosted infrastructure required.
17. **Observability and run history.** Settled: **lightweight, reusing existing primitives**. v1 ships a per run summary (repos audited, findings by severity and confidence, filed versus deduped versus suppressed, duration, model, run mode) written to the Actions step summary and committed to the configuration repo; the dry run markdown artefact doubles as the detailed per finding trace; the filed issues are the durable per finding record. Cross run history is the sequence of committed run summaries in Git. No database, no dashboard; richer history is phase 2.
18. **Installable configuration and secrets.** Settled: the installable shape is a **hub install**, not per repo. `npx @nanocollective/docsforest init` run once in a single repository scaffolds the workflow, the configuration file, and a starting prompt. The operator lists target repos in the config, sets the model API key as a GitHub Actions secret, and commits. All non secret configuration is a plain file in that hub repo; only the API key lives in Actions secrets. DocsForest runs as a CI tool through `npx`, not as a runtime dependency of any audited project. See the distribution section above.
19. **Prompt versioning for installs.** Settled: **no versioning mechanism in v1**, judged over engineering. The prompt is copied into the install at `init` time and owned by the operator, who edits it repo side and validates changes in dry run. There is no live prompt fetch from NC, so there is no central version to pin or push. Pulling later improvements from NC's reference prompt is a manual copy, or a phase 2 `update` convenience.
20. **Privacy posture.** Settled: the privacy philosophy rests on **open source, complete operator control, and first class local support**, not on a claim that data never leaves the runner. The configured cloud endpoint is operator-controlled and operator-chosen; an operator who needs pre-send scrubbing composes the workflow with whatever content-layer tool fits their threat model. The principles section was rewritten to lead with these three pillars.

## Open questions

All questions raised during the review window have been resolved and recorded above. None remain open at the time of writing. New concerns can still be raised as issues against the docs repo during the review window (it closes 2026-06-21); if a fundamental one surfaces, it gets added here and argued.

## Next steps

For this whitepaper to graduate into docs:

- [x] Resolve the naming question. Settled: DocsForest.
- [x] Decide the first run behaviour. Settled: file all qualifying issues at once, no summary only staging.
- [x] Lock the docs surface detection defaults and the configuration override shape. Settled: configurable per target, default `docs/**` plus `README.md`, overridable.
- [x] Settle the source surface navigation strategy. Settled: docs in scope handed to the agent, source read and grepped on demand via Nanocoder's tools.
- [x] Decide whether DocsForest also audits the central docs site against the product repos. Settled: no, out of scope.
- [x] Decide on the severity model and the close state conventions. Settled: low / medium / high plus confidence plus category; `aspirational` and `false-positive` encoded as a label convention.
- [x] Decide whether v1 attempts to find undocumented functionality. Settled: scoped best effort; the agent opportunistically flags undocumented user facing surface at low confidence, honest that coverage is not exhaustive.
- [x] Decide the run modes. Settled: live (default) plus a dry run mode that previews findings as markdown without filing, for prompt calibration.

The v1 audit prompt is deliberately not a graduation gate: it is scoped, implemented, and tested at build time, as the first task inside the shape this whitepaper argues.

With the graduation checklist settled, this document is ready to become the foundation of the project's README and design notes. The remaining open questions above are second order design choices that do not block the build. On a yes decision, the repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.
