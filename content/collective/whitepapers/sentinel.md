---
title: "Sentinel (working title)"
description: "A working whitepaper for an installable Nanocoder driven workflow that runs security and code audits across a GitHub organisation's repositories, with configurable rule packs and automatic issue filing"
sidebar_order: 4
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "In public review"
review_opens: "2026-05-22"
review_closes: "2026-06-21"
---

# Sentinel (working title)

Most organisations on GitHub have more repositories than they have eyes to keep on them. Static analysis runs catch a fraction of what matters. Paid security platforms catch more, but they cost a lot, sit behind closed source, and tend to flatten every ecosystem into the same generic ruleset. A Solana program, a TypeScript web app, and a Rust CLI all get the same audit, which is rarely the audit any of them actually needs.

This whitepaper proposes a project that fills the gap with a Nanocoder driven workflow shaped like [ContentForest](https://github.com/Nano-Collective/contentforest), but pointed at security instead of release content, and distributed as an installable package rather than an internal collective tool. A user installs Sentinel into their own GitHub organisation, points it at the repositories they care about, configures the rule packs they want (a Solana program audit pack, a generic web app pack, a custom pack of their own), and the workflow runs against each repo on a schedule. When the agent finds something worth raising, an issue lands on the affected repository with the finding written up for a human reviewer.

ContentForest is the closest sibling. The shape is the same: a daily GitHub Action runs Nanocoder against a templated prompt, validates the output, and writes the result somewhere a human can act on it. The differences are who installs it (any organisation, not just the collective), where the output lands (issues on the audited repo, not PRs in the workflow's own repo), and what the prompts encode (security rules, not release content).

The document is published in working form so the collective can argue the shape of it before code lands. Naming, scope, and design decisions below are open.

## Problem

A GitHub organisation that takes security seriously today picks from a small set of options, none of which fit every shape of project:

1. **Hosted SAST and code scanning platforms.** GitHub Advanced Security, Snyk, Semgrep Cloud, others. Strong defaults for common languages and frameworks. Generally weak on emerging ecosystems (Solana, other Web3 stacks, niche language extensions). Closed source on the rule side or expensive on the seat side, sometimes both. The organisation cannot easily teach the platform about its own internal patterns.
2. **Self hosted SAST tools.** Semgrep CLI, CodeQL, language specific linters. Powerful, free at the floor, but the burden of writing, tuning, and maintaining the rules is on the organisation. The "I will write Semgrep rules for our codebase" project is a familiar item on a familiar backlog that rarely gets done.
3. **Paid manual audits.** Real auditors reading real code. The right answer for a launch or a release, far too expensive to apply continuously across every repo every week.
4. **One off LLM scripts.** "I asked Claude to read this contract and tell me what could go wrong." Works once, does not run continuously, does not standardise across repos, does not learn the organisation's context.

None of these gives an organisation a continuous, cheap, customisable security review across every repo it owns. ContentForest demonstrated that a Nanocoder workflow can take a templated prompt, a clear set of inputs, and a validation loop, and produce output worth shipping. The same shape can be turned against source code with a security framing and a different output target.

The need is sharper for the kind of users who already sit inside the collective's posture. Someone running repositories under their own GitHub organisation, who cares about privacy enough to prefer local models, and who wants their audit pass to know something specific about the kind of code they ship, is the user Sentinel is shaped around. That user spans many ecosystems; the project does not pick one.

## Intended audience

Sentinel is built for anyone running code under a GitHub organisation who wants a continuous, configurable, agent driven audit pass across their repositories. The audience is deliberately broad. What makes the project useful is not that it serves one ecosystem well; it is that it serves any ecosystem the user can describe in a rule pack.

The product is a generic code auditor. It ships with no rule packs of its own. What it ships is the workflow, the configuration shape, a documented rule pack format, and clear guidance on how to write a good pack. The installing organisation writes the packs that matter to them, either from scratch or by adapting community packs. Any team can write a pack for the patterns they care about: a Solana team writing about signer checks, account confusion, and PDA derivation; an EVM Solidity team writing about reentrancy and access control; a Rust embedded team writing about unsafe and panic patterns; a Python data engineering team writing about secret leakage in notebooks. The mechanism is the same for all of them. The project does not privilege one ecosystem over another at the product level; it makes specialisation cheap so any ecosystem can be served by whoever cares enough to write the pack.

The collective will use Sentinel on its own repositories and write its own internal packs for the projects it audits. Those packs are NC's internal artefacts, not part of the published package. They serve as dogfooding and as worked examples that the documentation can point to, without putting NC on the hook for maintaining a generic pack catalogue.

This framing trades the precision of a narrow first audience for the breadth that the configuration story already implies. Open questions remain about which specific user this project optimises hardest for in messaging and documentation, even though the product itself does not discriminate:

- **Web3 organisations** are the loudest case for the project because their stacks are the least well served by existing tooling. They are the natural first design partners and the natural authors of the first published community rule packs.
- **AI tooling collectives and other niche ecosystem teams** are the same shape of user with a different stack underneath.
- **Solo maintainers running multiple personal projects** care more about install ergonomics than about specialised packs. The `npx` install is for them as much as for organisations.
- **Larger engineering organisations** wanting SOC2 ready audit trails, ticketing integrations, and role based access are out of scope for v1 by a wide margin. A plausible downstream direction if the smaller installs land first.
- **Security researchers and auditors** are a likely downstream consumer rather than a target audience. Sentinel can serve them as a triage layer, but the project does not optimise for that path.

The work that remains is choosing where to point the documentation and the worked examples on day one, not narrowing the product itself. A v1 that documents "here is the generic shape, here is the rule pack format, here is how to write a good pack, here is one of NC's internal packs as a worked example" is honest to what the product actually is.

## Principles

The three values that govern every Nano Collective project apply, with two carrying particular weight for this project:

- **Privacy respecting.** Sentinel reads source code, which is often sensitive. The default deployment must keep that code on infrastructure the organisation controls (their own GitHub Actions runners, their own configured model endpoint). Where a cloud model is used, the project must be honest about exactly which code is sent where, and must compose cleanly with the sibling [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) and [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) projects.
- **Local first.** Audit work is one of the workloads where users are most exposed if they reach reflexively for a cloud model. Sentinel must make local Nanocoder providers (Ollama, LM Studio, llama.cpp, MLX) a first class path. Cloud is allowed where capability requires it, and must be opt in rather than the default.
- **Open for all.** Full source open. The rule pack format documented in enough detail that anyone can write a pack for the patterns they care about. Anyone can install Sentinel on their own organisation. Anyone can publish a community pack.

A fourth principle, specific to this project, is worth naming:

- **Honest about false positives.** Any LLM driven audit tool produces both false positives and false negatives. A tool that pretends otherwise trains its users to either click through every finding or stop reading them. Sentinel must surface its confidence honestly, provide a clear path for marking findings as accepted or dismissed, and avoid filing the same noisy issue twice.

## Threat model (open)

A continuous security audit tool is itself a security surface. Naming what it does and does not defend against, to be argued:

**Vulnerabilities and bug classes that a careful reviewer would catch but no one has time to look for.**
The thing Sentinel exists to find. In scope. The quality of finding depends on the quality of the rule pack and the underlying model.

**Ecosystem specific issues that generic SAST tools do not know about.**
In scope, and the project's main differentiator. A well written rule pack for any specific ecosystem encodes the patterns a careful reviewer in that ecosystem would already look for: account confusion and signer checks for a Solana program, reentrancy and access control for EVM Solidity, unsafe and panic patterns for Rust embedded, and so on for any stack with a published pack.

**Secrets accidentally committed to a repository.**
Partial. Sentinel can flag secrets it sees in the code it reads, but it is not a dedicated secret scanner and should not pretend to be one. GitHub's native secret scanning is the right tool for that. Sentinel composes alongside it.

**A malicious actor introducing a vulnerability deliberately in a PR.**
Partial in v1. If Sentinel runs only on a schedule, it sees the commit after it lands. PR triggered runs would close the gap; whether they ship in v1 is an open question below.

**The audit tool itself exfiltrating code.**
In scope as a project concern, not a code level threat. The default deployment runs entirely inside the organisation's own GitHub Actions workspace. Cloud model calls are explicit configuration, not hidden behaviour.

**The audit tool itself filing false issues at scale and overwhelming the maintainer.**
In scope. Issue dedup, severity thresholds, and a clear path for the maintainer to tune what gets filed are all part of the v1 surface, not polish items.

**A state level adversary subverting the rule packs themselves.**
Not a goal of v1. Rule packs ship as plain files in plain repositories; the supply chain shape is the same as any other open source dependency. Worth naming as out of scope until proven otherwise.

The threat model lives alongside the project once it ships and evolves as the design firms up.

## Proposed approach

Four primitives, all installable as one package.

### The workflow

The core of Sentinel is a GitHub Actions workflow, distributed as part of the installable package. On a schedule (daily by default, configurable), the workflow:

1. Reads the organisation level configuration to determine which repositories to audit and which rule packs apply to each.
2. For each target repository, clones it into the workspace.
3. For each rule pack assigned to that repository, runs Nanocoder against a templated prompt that includes the rule pack contents, the relevant source files, and any per repo context.
4. Collects the agent's findings in a structured output format.
5. Validates the findings against a small set of hard rules (well formed JSON, severity within the allowed set, every finding cites at least one file and line).
6. Files an issue on the audited repository for each finding that meets the configured severity threshold, or updates the existing issue if a matching finding has already been filed.

This is the ContentForest pattern with the inputs and the output target swapped. The orchestrator script, the prompt template substitution, the validation gate, the retry loop, and the auto fix step all carry over with adjustments.

### Configuration

Configuration lives in a single repository inside the installing organisation, separate from any audited repo. The installer creates this repository from a template (see "Distribution" below). The configuration files in this repo declare:

- **Targets.** Which repositories to audit. Patterns, allow lists, deny lists.
- **Rule packs per target.** Which rule packs apply to which repositories. A given repo might pull in a generic web app pack, a Node.js specific pack, and an organisation specific pack of internal patterns.
- **Triggers.** Schedule (cron expression), whether PR triggered runs are enabled, whether release triggered runs are enabled.
- **Severity threshold.** Below what severity to suppress issue filing. Defaults are sensible; tuning is expected.
- **Model configuration.** Which Nanocoder provider and model to use. Local by default, cloud opt in.
- **Issue routing.** Which label to apply, whether to assign anyone, whether to file in the audited repo (default) or aggregate to the configuration repo (option).

Configuration is plain files in plain Git. A change to who gets audited is a PR like any other.

### Rule packs

A rule pack is the unit of customisation that makes Sentinel useful across ecosystems. Concretely, a rule pack bundles:

- A markdown document describing what the pack audits for, written in a form the underlying LLM can use as instructions. Severity guidance, examples of true positives, examples of false positives the agent should suppress.
- An optional list of file patterns the pack applies to (a Solana pack might apply only to files matching `programs/**/*.rs`).
- An optional list of additional context files the agent should read (the project's `Anchor.toml`, the relevant program's `Cargo.toml`).
- A version, a name, and a short description.

A rule pack is a directory plus a manifest, living inside the installing organisation's configuration repo. The installing organisation writes its own packs. The package ships no rule packs of its own. This is a deliberate choice: shipping default packs would commit NC to a maintenance burden across every ecosystem the packs claim to cover, and would tempt users to install the defaults without reading them. The honest posture is that a good pack is opinionated about the codebase it audits, and the organisation that owns the codebase is the right author.

What the project ships instead is the documentation: the pack format specification, guidance on writing a pack the agent can act on (severity language, example shapes, false positive suppression patterns), and one or more of NC's own internal packs published as worked examples for readers to study.

The pack format is the natural unit for sharing. An ecosystem specific pack written by one organisation is a pack any other organisation can install with a `cp -r`. A community catalogue, when one exists, sits outside Sentinel itself; the project does not run, host, or curate one in v1.

### Issue filing

When the agent produces a finding that meets the configured severity threshold, the workflow files an issue on the affected repository. The issue body includes:

- A short summary of the finding.
- The affected file or files, with line ranges.
- The rule pack that produced the finding, linked to the pack's documentation.
- The severity, and the rationale for that severity.
- Suggested next steps. Not patches, not auto fixes, just the kind of next steps a human reviewer would write at the bottom of a code review comment.
- A footer that names Sentinel as the source, links to the installing organisation's configuration repo, and explains how to dismiss the finding if it is a false positive.

Dedup is enforced by a content hash over the finding's salient fields (rule pack, file, line range, finding type). A subsequent run that produces the same finding updates the existing issue's last seen timestamp instead of filing a duplicate. A finding that stops appearing across N consecutive runs is marked as resolved automatically.

The maintainer of the audited repo retains full control. Issues can be closed as `wontfix` or `false-positive`. A `false-positive` close is read back by the workflow and prevents the same finding from being refiled.

### Distribution

This is where Sentinel diverges most sharply from ContentForest. ContentForest is a single internal repository inside the collective's organisation. Sentinel is meant to be installable by any GitHub organisation in the world.

The v1 distribution shape, to be argued, looks like this:

- **A published npm package, runnable via `npx` or `pnpm dlx`.** The primary install path. From inside a fresh repo in the target organisation, the user runs:

  ```bash
  npx @nanocollective/sentinel init
  # or
  pnpm dlx @nanocollective/sentinel init
  ```

  The init command scaffolds the configuration files, the GitHub Actions workflow, an empty `rule-packs/` directory, and a short README pointing to the pack authoring documentation. It is interactive enough to ask the obvious questions (which model provider, which schedule, which repositories to start with) and non interactive friendly via flags for users who want to script the install. After init, the user reviews the generated files, writes their first rule pack (or copies one in from a community source), commits, and pushes. No external service touched, no token exchanged, no NC hosted anything in the path.
- **The same package is the runtime, not just the scaffolder.** The workflow generated by `init` invokes the same package at runtime (`pnpm dlx @nanocollective/sentinel run`, or the equivalent installed binary), which is what actually orchestrates Nanocoder, runs the validator, and files the issues. This means the install gets bug fixes by bumping a single version. Rule packs are not part of the package and are not affected by upgrades; they live in the configuration repo and are owned by the installing organisation.
- **A "from template" install path as a fallback.** For users who prefer not to run an npm command at all, the same configuration shape is also available as a GitHub template repository. The template is generated from the same source as the `init` output, so the two paths converge on the same configuration files.
- **No GitHub App.** A GitHub App shape is on the table (see "Alternatives considered") but adds significant install friction, requires NC to host an App, and complicates the privacy story. v1 stays as an `npx` install that produces a configuration repo plus a workflow.

The install flow is therefore: in a fresh repo in the target organisation, run `npx @nanocollective/sentinel init`, answer a few prompts, review the generated files, commit, push. The first scheduled run lands later that day, or the user dispatches the workflow manually. No external service to authenticate against. No third party platform involved.

### The execution model

A scheduled run flows like this:

1. The workflow triggers on its cron schedule.
2. It reads the configuration repo's manifest to determine which repos to audit this run.
3. For each target repository, it clones the repo at the default branch into a fresh workspace.
4. For each rule pack assigned to that target, it runs Nanocoder against the templated audit prompt with the rule pack's instructions, the relevant source files, and any per repo context.
5. Nanocoder produces a structured findings output. The validator checks the shape. On a hard failure, an auto fix step runs the agent again with the structured error report; on validation success, the orchestrator moves on.
6. For each finding that meets the severity threshold and is not already filed, the workflow opens an issue on the target repo. Findings that match an existing issue update its last seen timestamp.
7. A run summary lands in the configuration repo, with cross repo metrics aggregated for the maintainer.

This is not novel. The novel parts are the locality of the model layer, the openness of the rule packs, and the installability of the whole thing into any organisation. The substrate is the same whether the model is a local Llama running on the organisation's own runner, or a cloud model called through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) with the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) in front of it.

## A worked example: a Solana shop

The shape of the design lands better against a concrete arrangement than against the abstract primitives alone. The example below is a small Web3 organisation that ships several Solana programs and a handful of supporting TypeScript services.

### The arrangement

The organisation runs `npx @nanocollective/sentinel init` in a fresh repo in their GitHub organisation. The scaffolder lands the workflow, the configuration files, and an empty `rule-packs/` directory. They then write their own packs. Their resulting configuration repo declares:

- **Targets.** All public repos in the organisation, plus a named list of private ones.
- **Rule packs per target.**
  - The Solana programs (Rust, under `programs/`) get the team's own `solana-anchor` pack and `rust-general` pack, plus an internal `org-conventions` pack of patterns specific to their own code.
  - The TypeScript indexer service gets a `node-server` pack and the `org-conventions` pack.
  - The front end repo gets a `web-frontend` pack.
- **Schedule.** Daily at 06:00 UTC.
- **Severity threshold.** Medium and above file issues automatically. Low findings appear in the run summary but do not file.
- **Model configuration.** Local Ollama running on a self hosted runner, fronted by a small Llama variant for the cheaper passes and a larger model for the audit prompt itself. Cloud is configured as a fallback through the proxy, for cases where the local model demonstrably struggles.

The team wrote each of these packs themselves over a few weeks, using the published pack format documentation and the example pack NC publishes from one of its own audited repos as a starting point. Some patterns came straight from their own code review checklists; some came from public guidance the team had bookmarked over the years. Every pack lives in the configuration repo, versioned in Git like any other internal document. None of them is something NC ships or maintains.

### A run flowing through it

The schedule fires at 06:00. The workflow:

1. Reads the configuration. Determines that twelve repositories need auditing this run.
2. For the team's main Solana program, clones the repo, then runs three audit passes (one per assigned rule pack) using Nanocoder against the local model.
3. The `solana-anchor` pack catches a missing signer check on an instruction handler. The `rust-general` pack flags an `unwrap` in a function the pack judges hot. The `org-conventions` pack notices a PDA derivation that does not follow the team's documented seed convention.
4. The validator confirms the findings output is well formed. Each finding cites a file and a line range.
5. The workflow files three issues on the Solana program's repo, each labelled `sentinel`. The signer check issue is severity high; the unwrap is severity medium; the PDA derivation is severity medium with low confidence (the pack noted that some derivations are exempt).
6. For the other eleven repos, the same shape runs. Most produce nothing. The TypeScript indexer surfaces one finding about an unbounded query.
7. A summary lands in the configuration repo, with the day's findings linked, the per pack hit rates, and the aggregate model cost for the run (zero, in this configuration, because everything ran locally).

The team reviews the new issues in their normal flow. They fix the signer check immediately. They mark the unwrap as `wontfix` after discussion. They close the PDA finding as `false-positive` after confirming the exempt path was the one the agent flagged; the workflow reads the close and suppresses the finding on future runs.

### Why this shape is the point

A bespoke Semgrep configuration could catch the signer check, with effort. The unwrap finding could be a clippy rule. The PDA convention check could not be expressed in any existing tool without writing a custom checker from scratch. The combination of "ecosystem specific rule pack" plus "organisation specific rule pack" plus "general purpose rule pack", all sitting behind the same workflow with the same output format, is the part the existing tools do not do.

The arrangement also tests the project's principles. The model call is local. The code never leaves the organisation's runner. Rule packs are plain files the team can inspect, audit, and version. Cloud is an explicit fallback, not a hidden default. Removing Sentinel from the organisation is deleting the configuration repo; there is no external service to deauthorise.

## v1 scope

A deliberately narrow v1, shipped well.

- **An npm package, runnable via `npx` or `pnpm dlx`.** `npx @nanocollective/sentinel init` in a fresh repo scaffolds the configuration files and the GitHub Actions workflow. The same package is invoked by the workflow at run time, so upgrades are a version bump rather than a re scaffold.
- **A "from template" install path as a fallback.** Same configuration shape as the `init` output, for users who prefer not to run an npm command.
- **No shipped rule packs.** The installing organisation writes their own. The package does not bundle, vendor, or fetch any default rule packs.
- **Rule pack authoring documentation.** The pack format published as a stable v1, alongside guidance on writing a good pack: severity language, false positive suppression patterns, examples of what works and what does not.
- **A scheduled GitHub Actions workflow.** Daily by default. PR triggered runs deferred to phase 2 unless the design naturally accommodates them.
- **Issue filing with dedup.** Content hashed findings, no duplicate issues, `false-positive` closes respected.
- **Local model first.** Nanocoder configured for local providers as the default. Cloud documented and supported, explicitly opt in.

What v1 ships is "a workflow, a configuration shape, a stable rule pack format, and documentation on how to author packs." Not a full security platform. Not a pack catalogue. The starting point that grows, with the rule pack maintenance burden left where it belongs (with the people who own the code being audited).

## What it is not (in v1)

- **Not a replacement for formal security audits.** Sentinel surfaces candidate findings. A human reviewer still has to assess each one. A real audit by a real auditor is a different thing and Sentinel does not pretend otherwise.
- **Not a SAST replacement.** Generic SAST tools (Semgrep, CodeQL) are complementary. They catch what they catch; Sentinel catches a different set, especially in ecosystems they handle poorly. Running both is the realistic posture for most organisations.
- **Not a secret scanner.** GitHub's native secret scanning is the right tool. Sentinel notices secrets it happens to see, but does not specialise in finding them.
- **Not real time PR enforcement in v1.** Scheduled runs are the v1 surface. PR triggered runs are phase 2 if they ship at all.
- **Not a hosted service.** No NC hosted instance, no SaaS shape. The collective ships the package; the rule packs are the installing organisation's job; the installation runs entirely inside the installing organisation.
- **Not a rule pack catalogue.** The project ships no default packs, hosts no community catalogue, and does not curate community packs. The pack format is open and the documentation is published; what the community does with it is up to the community.
- **Not a fix it tool.** Sentinel files issues. It does not open PRs with patches. Auto fix is parked deliberately to keep the trust model simple in v1.
- **Not a compliance tool.** No audit trail certification, no SOC2 ready report shape, no formal evidence package. A larger organisation that needs those things needs a different tool.
- **Not a model.** Sentinel uses whichever Nanocoder configured providers the installer points it at. The collective does not train or ship a security tuned model of its own.

## Composition with other collective projects

Most collective projects compose with Sentinel through plain configuration. A few have a more specific integration shape worth naming:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder)** is the runtime under every audit pass. The workflow runs Nanocoder in non interactive mode against a templated prompt, the same shape ContentForest already uses.
- **The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber)** runs as middleware on any audit pass that uses a cloud model. Source code paths, internal identifiers, and any incidental secrets in the code are scrubbed before the prompt goes out.
- **The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy)** is the configured network path for cloud model calls. Sentinel never calls a cloud provider directly when the proxy is configured.
- **[NanoOS](/collective/whitepapers/nano-os)**, if and when it lands, is a natural place from which to invoke Sentinel runs as a sub agent. An organisation's oracle could be asked "what is the security posture of our repos this week" and delegate to a Sentinel run on demand, in addition to the scheduled passes.

This is the long picture from the collective's introduction page expressed as another product on the same stack: local first models, ecosystem specific rule packs anyone can write, and privacy preserving paths to external capability when the task genuinely requires it. Sentinel is the security shaped instance of the same pattern ContentForest demonstrates for release content.

## Alternatives considered

- **A GitHub App.** A native GitHub App could install once at the org level, post check runs directly on PRs, and avoid the template repo step entirely. Real strengths. It also requires NC to host the App, introduces a third party in the trust path, and complicates the local first story. The template repo approach keeps everything inside the installing organisation. A GitHub App is a plausible phase 2 surface, not the v1 default.
- **A workflow that lives in each audited repo individually.** Smaller install surface per repo, but it means each audited repo has to vendor the workflow, and updates have to land per repo. A single configuration repo per organisation is the cleaner shape.
- **Auto opening PRs with proposed fixes.** Powerful, and an obvious extension. It also raises the trust bar significantly. v1 files issues, not PRs, and leaves the fix work to the human. Auto fix PRs are a plausible phase 2 surface once the false positive rate is known and trusted.
- **Aggregating findings into a dashboard instead of filing issues.** A dashboard sits outside the developer's normal workflow. Issues are where developers already look. The dashboard option is not foreclosed (the run summary in the configuration repo is a small dashboard already), but the primary surface is the issue tracker.
- **Building on a non Nanocoder agent runtime.** Anything that satisfies "non interactive agent driven by a templated prompt, with tool access to the filesystem" could power this in principle. Nanocoder is the natural choice because it is the collective's own runtime, it is what ContentForest already uses, and using it pressure tests Nanocoder on a real internal workload. Alternatives are not foreclosed, but the default is Nanocoder.
- **Pricing the package as a hosted service to fund the collective.** Out of scope. Sentinel is open source and installed by the user into their own org. The collective's posture is the [Economics Charter](/collective/organisation/economics-charter), not a SaaS shape on top of this project.

## Open risks

These are the concerns that could kill the project or force it into a different shape.

1. **False positives are inherent and the issue flow is the gate.** Any LLM driven audit produces false positives. Sentinel does not try to eliminate them before release; it makes them cheap to dismiss. The maintainer closes an issue as `false-positive` and the workflow stops refiling it, the same way a human reviewer marks a comment resolved. What v1 needs to get right is the suppression path and the dedup, not a pre release measurement campaign. The risk that remains is the suppression UX itself: if dismissing a finding is heavier than the finding is worth, the tool reads as noisy regardless of the underlying signal quality.

2. **Issue spam at install time.** A new install hitting twelve repos with three rule packs each could produce dozens or hundreds of issues on day one. The maintainer rage path is real. The install flow has to either default to a "first run, summary only, no issues filed" mode, or stage the first pass per repo, or otherwise prevent the initial flood.

3. **Cost compounds with repo count and rule pack count.** A run over twenty repos with four packs each is eighty model calls, every day. Local models keep the cost story honest. Cloud models do not. The default configuration has to be sensible, and the docs have to be honest about the cost shape.

4. **Empty out of the box.** A user runs `npx @nanocollective/sentinel init` and lands in a configuration with no rule packs and no findings. Without a pack, Sentinel does nothing. This is a deliberate design choice, but it also raises the activation cost: the project's value depends on the user writing their first pack soon after install. The pack authoring documentation has to be excellent or the install reads as a dead end. The risk is that users install, find the empty state intimidating, and walk away without writing the pack that would have shown them the value.

5. **A security tool reading source is a security surface itself.** If the workflow ships with bugs, those bugs land in every install. The supply chain story for Sentinel itself (signing, pinning, version disclosure) has to be tighter than for ContentForest, because the consequences of a compromised install are larger.

6. **Provider terms of service.** Cloud LLM providers' terms vary on what kinds of inputs they will accept and what they will retain. Some explicitly prohibit certain sensitive content classes. The project has to be honest about which cloud providers are safe to use for audit work, and the default has to remain local.

7. **The "specialised rules" claim depends on rule pack authors actually appearing.** The differentiator over generic SAST is ecosystem specific packs, and the project ships none of its own. If users do not write packs (or write thin ones), Sentinel reads as a curiosity. NC's own dogfooding produces some public worked examples, but the broader ecosystem of packs depends on people the project does not employ. Community pack authorship is a real risk, not a guaranteed outcome.

8. **Maintainer fatigue at the audited repo.** Even with dedup and severity thresholds, a busy repo with many findings is a chore to triage. The project has to make triage easy (labels, close states, suppression patterns) or maintainers will install Sentinel, find it noisy, and uninstall it.

9. **Hosting model dictates trust.** If the user accepts the GitHub App alternative later, they accept NC into their trust path. The current shape keeps NC out of the trust path entirely, which is the right v1 posture but limits some ergonomic gains.

## Open questions

These are the questions the whitepaper exists to argue.

1. **Naming.** "Sentinel" is the working title. It is descriptive, it is short, it does not collide with any existing collective project, and it has a clean noun shape. Alternatives in the "Forest" family ("AuditForest", "SecurityForest") would emphasise the ContentForest sibling relationship. Alternatives in the lowercase hyphenated utility family ("code-sentinel", "nanosentry") would emphasise the package shape. Worth resolving early.
2. **NC's own published packs.** The collective will write internal packs for its own audited repos. Some subset of those could be published alongside the documentation as worked examples, both to make pack authoring concrete for new users and to surface useful patterns. Which packs to publish, how to scope them, and how clearly to mark them as "examples, not maintained for general use" is open.
3. **PR triggered runs in v1.** Scheduled runs are simpler and the right default. PR triggered runs are higher value but add complexity (rate limiting, comment vs check vs issue, race conditions on closing PRs with open findings). Whether to ship PR triggered runs in v1 or as phase 2 is open.
4. **Issue routing.** All findings on the audited repo (default) versus aggregated into the configuration repo (option) versus both. The default matters more than the option, since most installs will accept the default.
5. **Severity model.** A simple low/medium/high/critical scale, or finer grained. CVSS style scoring is overkill for an LLM driven tool; "the rule pack author's intuition, plus a confidence value, plus a category" is probably the right shape. To be argued.
6. **Rule pack manifest format.** A markdown body plus a small YAML or JSON header is the obvious shape. The exact fields (applies to, depends on, version, severity weighting) need to be designed in their own right rather than borrowed wholesale. Cross project alignment with the [NanoOS](/collective/whitepapers/nano-os) skill manifest is a nice to have, not a requirement; the two are aimed at different jobs.
7. **Activation aids.** The empty out of the box state is a real risk. Whether the `init` command also generates a starter pack template (the manifest, an empty markdown body with the section headings filled in, a few comments pointing to the docs) is open. The line between "scaffold that helps" and "default pack we are now on the hook to maintain" is the design question.
8. **Per finding suppression.** A `false-positive` close on an issue is the obvious suppression signal. A repo level config file that suppresses specific finding shapes is a richer option. Whether to ship the file format in v1 is open.
9. **Configuration shape.** A single configuration repo per installing organisation, holding everything. Whether to support multiple named configurations (different schedules for different repo groups) in v1 or later. Default is single configuration; complexity is opt in.
10. **First run behaviour.** Whether the first run on a new install files issues immediately, files a summary only, or stages findings one repo at a time. This is a real product decision; the install experience hinges on it.
11. **Cloud model defaults.** The local first principle says local by default. Audit work involves models reasoning over potentially large codebases, which strains local hardware. Whether the project ships with a recommended local model floor, a recommended cloud fallback, or neither, is open.
12. **Self hosted runners.** Whether the project assumes self hosted runners are available (the right answer for sensitive private repos) or works acceptably on standard GitHub hosted runners. Documentation has to address both.
13. **Auto fix PRs.** A natural phase 2 surface. Whether to leave the door open in the v1 design (output shape, finding format) is worth arguing now, even if the feature ships later.
14. **Observability and run history.** A run that produced surprising findings deserves a trace the maintainer can read. What v1 ships for run summaries, per repo history, and cross run comparison is part of the user experience, not a power user feature.
15. **Stack.** TypeScript follows the rest of the collective and matches ContentForest's choice. A case for a different stack would have to be made explicitly. Default is TS unless argued otherwise.
16. **The package shape.** v1 plans an npm package as the primary install surface (`npx @nanocollective/sentinel init` to scaffold, same package invoked at run time by the generated workflow). Open: whether the same package binary is also runnable locally for off cycle audits (`npx @nanocollective/sentinel run --rule-pack ... --repo ...`) outside of GitHub Actions, and whether that path is in v1 or phase 2.
17. **Relationship to ContentForest.** ContentForest and Sentinel share orchestration shape but not jobs. The collective's posture is that they stay as independent projects; no shared "forest framework" library sits underneath them. Sentinel copies what it needs from ContentForest's playbook and evolves on its own cadence. The open part is at the implementation level only: if a small utility (frontmatter parsing, finding hash computation) genuinely makes sense in two places, it can be lifted into a tiny standalone package the way `get-md` and `json-up` already exist as standalone NC utilities.

## Next steps

For this whitepaper to graduate into docs:

- [ ] Resolve the naming question.
- [ ] Lock the rule pack manifest format and document the contract.
- [ ] Write the pack authoring guide. The empty out of the box state lives or dies on this document.
- [ ] Decide which of NC's own internal packs (once written) are published alongside the documentation as worked examples, and how clearly they are marked as illustrative rather than maintained.
- [ ] Decide whether `init` scaffolds a starter pack template alongside the empty `rule-packs/` directory, and what that scaffold looks like.
- [ ] Decide whether PR triggered runs ship in v1 or phase 2.
- [ ] Sketch the first run experience in enough detail that the install can be argued, not just stated.
- [ ] Decide whether the published npm package is also runnable locally for off cycle audits, or stays scoped to the scaffolder plus the workflow runtime.

When those are settled, this document becomes the foundation of the project's README and design notes. The repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.
