---
title: "DocsForest (working title)"
description: "A working whitepaper for a Nanocoder driven workflow that runs weekly across the collective's repositories, checks the documentation in each repo against the actual functionality, and raises an issue on the repo when the two have drifted"
sidebar_order: 5
---

# DocsForest (working title)

Every project the collective ships has documentation. Every project the collective ships also evolves. Between the two, documentation drifts. A flag gets renamed, a default changes, a feature is quietly retired, a new option is added with no doc, an installation step that worked six months ago no longer does. None of it is malicious; all of it is normal. The doc reads correctly when it was written, then it slowly stops reading correctly, and nobody notices until a user opens an issue saying "I followed your docs and it did not work."

A careful reviewer would catch this if they read the docs alongside the code regularly. Nobody has time to do that for every repo every week. The work is real, the value is high, and it gets pushed to the bottom of the backlog forever.

This whitepaper proposes a project that fills that gap with a Nanocoder driven workflow shaped like [ContentForest](https://github.com/Nano-Collective/contentforest): a weekly GitHub Actions run, a templated prompt fed with the current docs and the current source, a validator on the output, and an issue filed on the affected repository when the agent finds drift worth a human looking at. [Sentinel](/collective/whitepapers/sentinel) is the close sibling on the project side; the shape (scheduled Nanocoder run, structured findings, dedup'd issue filing) is shared. The difference is what the prompt is checking: not security patterns, but agreement between what the docs claim and what the code does.

The document is published in working form so the collective can argue the shape of it before code lands. Naming, scope, and design decisions below are open.

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

A secondary path, parked as an open question, is the same Sentinel style installable shape: any GitHub organisation could install DocsForest into their own org, point it at their own repos, and get the same audit posture for their own docs. The mechanics are not very different from Sentinel's. Whether to ship the installable shape from v1, or to land internal first and consider installability after the prompt is known good, is open below.

The honest framing is that the internal NC use case is the one that justifies building it. Installability would be a useful generalisation if the value proves out, but it is not a v1 requirement. Building installable from the start risks over generalising before the prompt has been pressure tested on real codebases.

## Principles

The three values that govern every Nano Collective project apply, with two carrying particular weight for this project:

- **Privacy respecting.** DocsForest reads source code and prose alongside it. The default deployment must keep that material on infrastructure the organisation controls (the collective's own GitHub Actions runners, the collective's own configured model endpoint). Where a cloud model is used, the project must be honest about exactly which material is sent where, and must compose cleanly with the sibling [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) and [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) projects.
- **Local first.** Documentation auditing involves reasoning across reasonably sized chunks of prose and code at once. Local Nanocoder providers (Ollama, LM Studio, llama.cpp, MLX) must be a first class path. Cloud is allowed where capability requires it, and must be opt in rather than the default.
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
Mitigated by composing with the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) on any cloud model call. Same posture as Sentinel.

**The tool itself filing noisy issues that overwhelm the maintainer.**
In scope. Issue dedup, severity thresholds, and a clear path for the maintainer to suppress recurring false positives are part of the v1 surface, not polish items.

**The tool itself exfiltrating private docs or code.**
In scope as a project concern. The default deployment runs entirely inside the collective's GitHub Actions workspace. Cloud model calls are explicit configuration, not hidden behaviour.

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

Configuration lives in a single repository, separate from any audited repo. For the v1 NC internal install, this is DocsForest's own repository, the same way ContentForest's own repo holds its config. The configuration files declare:

- **Targets.** Which repositories to audit. NC's product repos by default.
- **Docs surface per target.** Which paths in the repo count as "the docs". Default is `docs/**` plus `README.md`; per repo overrides allowed.
- **Schedule.** Cron expression. Weekly by default.
- **Severity threshold.** Below what severity to suppress issue filing. Defaults are sensible; tuning is expected.
- **Model configuration.** Which Nanocoder provider and model to use. Local by default, cloud opt in.
- **Issue routing.** Which label to apply (default `docs-drift`), whether to assign anyone, whether to file in the audited repo (default) or aggregate to the configuration repo (option).

Configuration is plain files in plain Git. A change to who gets audited is a PR like any other.

### The audit prompt

The prompt is the centre of gravity for this project, the way the rule packs are for Sentinel and the brand voice document is for ContentForest. The prompt is published, versioned, and iterated in the open.

What the prompt asks the agent to do, sketched at the level a v1 needs:

- Read each docs file in scope.
- For each factual claim in the docs (a flag exists, a default is X, a command takes these arguments, an installation step does Y), confirm the claim against the source.
- Report any claim the source contradicts, any claim the source no longer supports, any documented step that no longer works as written, and any new functionality in the source that the docs do not mention.
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

The maintainer of the audited repo retains full control. Issues can be closed as `wontfix`, `false-positive`, or `aspirational` (a new state specific to this project, recognising that some apparent drift is intentional). A `false-positive` or `aspirational` close is read back by the workflow and prevents the same finding from being refiled.

### Distribution (v1)

For v1, DocsForest is an NC internal repository under the [Nano-Collective](https://github.com/Nano-Collective) organisation. The shape is the same as ContentForest's: one repo holds the workflow, the config, the prompt, the orchestrator script. The workflow runs on NC's schedule against NC's repos.

The installable shape (the same pattern as Sentinel's `npx @nanocollective/docsforest init`) is parked as an open question. The mechanics are similar enough that the path is open if the v1 internal use proves valuable, but committing to installability before the prompt is known good would generalise too early.

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

The substrate is the same whether the model is a local Llama running on a self hosted runner, or a cloud model called through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) with the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) in front of it.

## A worked example: the collective's own repos

Picture the v1 internal install running against NC's product repos. The configuration declares:

- **Targets.** `nanocoder`, `nanotune`, `get-md`, `json-up`.
- **Docs surface per target.** `docs/**` plus `README.md` for each.
- **Schedule.** Mondays at 08:00 UTC.
- **Severity threshold.** Medium and above file issues automatically. Low confidence findings appear in the run summary but do not file.
- **Model configuration.** Local Ollama running on the same self hosted runner ContentForest uses. Cloud configured as a fallback through the proxy.

The schedule fires on a Monday morning. The workflow:

1. Reads the configuration. Four target repositories.
2. For `nanocoder`, clones the repo and identifies the docs under `docs/` and the README. Reads them. Reads the source tree manifest.
3. The agent notices that `docs/configuration/providers.md` describes the `OPENAI_API_KEY` environment variable as the only way to configure OpenAI, but the source now also reads `OPENAI_BASE_URL`. The doc is missing the new variable. Severity medium, confidence high.
4. The agent notices that `docs/features/checkpointing.md` describes a `/checkpoint save` command, but `src/commands/checkpoint.ts` no longer registers `save` as a subcommand; the API is now `/checkpoint write`. Severity high, confidence high.
5. The agent notices that the README still describes the project as supporting "Ollama, LM Studio, and OpenRouter", but the providers list in source now also includes MLX and llama.cpp. Severity low, confidence medium.
6. The validator confirms the output. Two findings meet the threshold; one is suppressed to the run summary.
7. The workflow files two issues on `nanocoder`, each labelled `docs-drift`. For the other three repos, the same shape runs. `nanotune` produces nothing. `get-md` produces one finding about a flag default that changed. `json-up` produces nothing.
8. The Monday morning issue queue, for the maintainers who watch it, contains three new docs drift issues across the four repos. They triage in the normal flow. The `nanocoder` checkpoint command finding becomes a PR within the day. The `OPENAI_BASE_URL` finding becomes a smaller doc patch. The `get-md` finding is closed as `false-positive` after the maintainer confirms the docs deliberately describe the previous default for backward compatibility, and the workflow reads the close and suppresses the finding on future runs.

The arrangement also tests the project's principles. The model call is local. The code and docs never leave the collective's runner. The prompt is published and inspectable. Cloud is an explicit fallback, not a hidden default. Disabling DocsForest is disabling the workflow file; there is no external service involved.

## v1 scope

A deliberately narrow v1, shipped well.

- **An NC internal repository.** Same shape as ContentForest. Holds the workflow, the prompt, the orchestrator script, the configuration.
- **A weekly GitHub Actions workflow.** Mondays at 08:00 UTC by default. PR triggered runs deferred to phase 2.
- **A published audit prompt.** The prompt itself lives in the repo, versioned, with PRs against it like any other artefact.
- **Issue filing with dedup.** Content hashed findings, no duplicate issues, `false-positive` and `aspirational` closes respected.
- **Local model first.** Nanocoder configured for local providers as the default. Cloud documented and supported, explicitly opt in.
- **The collective's own product repos as the v1 target set.** Four repos at the time of writing.

What v1 ships is "a workflow, a prompt, a small set of NC repos to watch, a clear surface for adding more." Not a docs platform. Not a docs generator. The starting point that grows.

## What it is not (in v1)

- **Not a docs generator.** DocsForest finds drift; it does not write or rewrite the docs. The maintainer fixes what gets flagged. Auto fix PRs are a plausible phase 2 surface, not a v1 commitment.
- **Not a linter.** Stylistic preferences, grammar, tone are out of scope. The agent is told to ignore them. Existing tools handle that better.
- **Not a link or spell checker.** Existing tools handle that better. DocsForest does not duplicate them.
- **Not a replacement for human review of docs.** Drift is one failure mode among many. A doc that is technically correct but unclear, misleading, or organised badly still needs a human to fix it. DocsForest does not pretend to do that work.
- **Not a hosted service.** No NC hosted instance, no SaaS shape. v1 runs inside the collective's own GitHub Actions workspace.
- **Not installable in v1.** The installable shape is parked as an open question; the v1 deployment is internal to NC.
- **Not a security tool.** That is [Sentinel](/collective/whitepapers/sentinel)'s job. The two are siblings; running both on the same repo set is the natural posture.
- **Not a model.** DocsForest uses whichever Nanocoder configured providers the operator points it at. The collective does not train or ship a docs tuned model.

## Composition with other collective projects

Most collective projects compose with DocsForest through plain configuration. A few have a more specific integration shape worth naming:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder)** is the runtime under every audit pass. The workflow runs Nanocoder in non interactive mode against a templated prompt, the same shape ContentForest already uses.
- **[ContentForest](https://github.com/Nano-Collective/contentforest)** is the closest sibling. The two share enough of their orchestration shape (cron driven Nanocoder run, prompt template substitution, validator with auto fix, structured output, dedup'd downstream action) that a shared library extraction is plausible. Whether to do that now or let DocsForest copy first is open.
- **[Sentinel](/collective/whitepapers/sentinel)** is the other sibling. Both watch repos on a schedule and file issues against findings. Running both on the same repo set is the natural posture; the two will produce issues with different labels and the maintainer triages each on its own terms.
- **The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber)** runs as middleware on any audit pass that uses a cloud model. Internal identifiers, paths, and any incidental secrets in the code or docs are scrubbed before the prompt goes out.
- **The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy)** is the configured network path for cloud model calls. DocsForest never calls a cloud provider directly when the proxy is configured.
- **[NanoOS](/collective/whitepapers/nano-os)**, if and when it lands, is a natural place from which to invoke DocsForest runs as a sub agent on demand, alongside the scheduled passes.

## Alternatives considered

- **Doctests and runnable code samples in the docs.** Strong where they apply. Cover only a sliver of what docs say. A README that explains, in prose, that "the `--mode yolo` flag bypasses all confirmation prompts" is not a doctest target; the agent based check is.
- **Auto generated docs from source.** Solves drift by definition (the docs are the source). Loses everything that makes the docs useful as a user facing artefact: the prose explanations, the design framing, the worked examples. Not the right answer for any of NC's product docs.
- **A custom static analysis tool that checks specific claim shapes.** Possible for some claims (a documented CLI flag must exist in the source's argument parser). Brittle and high effort, and only covers structured claims. The LLM approach generalises across claim shapes at the cost of probabilistic verdicts.
- **Lean on PR review to catch drift at write time.** This is what the collective does today, and the gap this project exists to close. PR review catches some drift; it does not catch drift accumulated over months from PRs that did not happen to touch the relevant docs.
- **Build this into ContentForest as another mode.** ContentForest's job is release content generation. Adding a docs audit mode would muddy that scope and make the ContentForest prompt heavier than it needs to be. A separate project that shares orchestration patterns is the cleaner shape, with extraction of shared code possible once both have shipped.
- **Build this into Sentinel.** Tempting, since both file issues on a schedule. The prompts and the finding categories are different enough that they would diverge inside Sentinel anyway. Two projects with shared mechanics is honest; one project with two modes is the design trap.

## Open risks

These are the concerns that could kill the project or force it into a different shape.

1. **False positives at install time are loud.** The first weekly run across four NC repos will land however many findings the prompt produces, regardless of whether the prompt is calibrated. A flood of low quality issues on day one would train the maintainers to ignore the label. The first run behaviour has to be considered: a "summary only, no issues filed" mode for the first pass, or a manual review of the first run's findings before they become issues, is probably the right shape.

2. **Aspirational documentation is a real category and the prompt has to acknowledge it.** Some of NC's docs deliberately describe behaviour that is on the roadmap. A prompt that flags every gap as drift creates noise. A prompt that ignores all aspirational sounding language misses real drift. The line is in the prompt and it is design work, not implementation work.

3. **The prompt is the centre of gravity.** Same risk as ContentForest's prompt. A weak prompt produces noise; a strong prompt produces signal. The first version will be wrong about something; the prompt has to be easy to iterate, the changes have to be small, and the feedback loop has to be tight.

4. **Cost compounds with repo count and docs surface size.** Reading a full docs site plus a relevant source surface for every repo, every week, adds up. Local models keep the cost story honest. Cloud models do not. The default has to remain local.

5. **The maintainer rage path is real.** Even with dedup and severity thresholds, a busy repo with many findings is a chore to triage. The project has to make triage easy (labels, close states, suppression patterns) or maintainers will silence the label and the project effectively dies.

6. **The line between "drift" and "the docs are simplifying for the reader" is judgement.** A doc that says "Nanocoder supports local models" when the source supports "local models, plus cloud models, plus MCP servers" is technically incomplete but not wrong, and might be a deliberate simplification for an introductory paragraph. The agent will get this category wrong sometimes. The suppression UX has to absorb that.

7. **Source size limits.** Some repos are bigger than any reasonable model context window. The prompt's strategy for navigating a large source tree (manifest plus on demand reads, scoped sub passes per docs section, summarisation) is design work that has to land in v1, not be discovered when the first large repo arrives.

## Open questions

These are the questions the whitepaper exists to argue.

1. **Naming.** "DocsForest" is the working title, picked to emphasise the ContentForest sibling shape. Alternatives in the "Forest" family lean further into that ("AuditForest" would muddy with Sentinel, "DriftForest" is a candidate). Alternatives in the lowercase hyphenated utility family ("docs-drift", "doc-check") would emphasise the function. The Sentinel style noun ("Beacon", "Canary", "Lighthouse") is also on the table. Worth resolving early.
2. **Installable shape.** v1 is internal to NC. Whether to ship the same `npx @nanocollective/docsforest init` style installer Sentinel plans, either in v1 or as a phase 2 milestone once the prompt has been pressure tested on NC's own repos. Likely answer: phase 2.
3. **Weekly cadence.** Weekly is the natural default. Whether to support per repo overrides (a fast moving repo on daily, a stable one on monthly) in v1 or later is open.
4. **First run behaviour.** Whether the first run on a new install files issues immediately, files a summary only, or stages findings one repo at a time. The risk above makes the summary only first run the likely answer; the design needs to lock it in.
5. **Severity model.** A simple low/medium/high scale, or finer grained. CVSS style scoring is irrelevant here. "The prompt author's intuition, plus a confidence value, plus a category" is probably the right shape, the same answer as Sentinel.
6. **The `aspirational` close state.** Adding a new close reason beyond `wontfix` and `false-positive` reads cleanly but requires either a label convention or an external mapping table (since GitHub does not allow custom close reasons at the API). How to encode it without inventing new GitHub primitives is open.
7. **Docs surface detection.** Default of `docs/**` plus `README.md` covers most NC repos. Whether to also include `CHANGELOG.md`, `CONTRIBUTING.md`, or in repo docs site directories (`website/`, `docs-site/`) is repo by repo. The configuration shape needs to make this easy.
8. **Source surface navigation strategy.** How the agent navigates a source tree larger than its context. Manifest plus on demand reads is one shape; sub passes per docs section is another; chunking the source by feature area is a third. Worth designing in its own right.
9. **Cross repo claims.** Some docs claims live in this docs site (docs.nanocollective.org), not in the product repo's own `docs/` directory. Whether DocsForest also audits the central docs site against the product repos, or that gets its own pass, is open. The mechanics are the same; the configuration shape changes.
10. **Cloud model defaults.** Local first says local by default. Reading large docs sites plus source manifests strains local hardware. Whether the project ships with a recommended local model floor, a recommended cloud fallback, or neither, is open.
11. **Self hosted runners.** Whether the project assumes the same self hosted runner ContentForest already uses, or works acceptably on standard GitHub hosted runners for smaller NC repos. Probably the same answer as ContentForest.
12. **Auto fix PRs.** A natural phase 2 surface, especially for tight, low risk fixes (renaming a flag in a doc to match the source). Whether to leave the door open in the v1 design (output shape, finding format) is worth arguing now.
13. **Observability and run history.** Same question as Sentinel and ContentForest. A run that produced surprising findings deserves a trace the maintainer can read. What v1 ships for run summaries, per repo history, and cross run comparison is part of the user experience.
14. **Stack.** TypeScript follows the rest of the collective and matches ContentForest's choice. Same default as Sentinel.
15. **Relationship to ContentForest and Sentinel.** Three projects now share the "cron, Nanocoder, prompt, validator, structured output, dedup'd downstream action" shape. Whether to extract a shared library now, after two of them ship, or only when patterns are clearly stable, is open. Premature shared library is worse than a small amount of duplication.

## Next steps

For this whitepaper to graduate into docs:

- [ ] Resolve the naming question.
- [ ] Write the v1 audit prompt and pressure test it on one NC repo end to end before locking the shape.
- [ ] Decide the first run behaviour (summary only by default looks likely).
- [ ] Decide on the severity model and the close state conventions, including how to encode `aspirational` cleanly.
- [ ] Lock the docs surface detection defaults and the configuration override shape.
- [ ] Sketch the source surface navigation strategy in enough detail that large repos are not a launch day surprise.
- [ ] Decide whether DocsForest also audits the central docs site against the product repos, or that gets its own pass.
- [ ] Decide whether to extract a shared library with ContentForest (and now Sentinel) up front, or let DocsForest copy first.

When those are settled, this document becomes the foundation of the project's README and design notes. The repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.
