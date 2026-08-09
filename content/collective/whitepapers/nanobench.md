---
title: "NanoBench"
description: "A provider-neutral benchmark for evaluating AI coding agents on real-world software engineering tasks."
sidebar_order: 1
proposer: "Ronak Raj"
proposer_github: "RONAK-AI647"
status: "review closed"
review_opens: "2026-07-05"
review_closes: "2026-08-04"
---

# NanoBench
> A provider-neutral benchmark for evaluating `AI coding agents` on real-world engineering tasks.

NanoBench is a standalone, provider-neutral evaluation suite for Nanocoder — the open coding agent built by the Nano Collective. It measures whether Nanocoder, running on any supported model or provider, can solve real engineering problems in large, production-grade repositories, and it classifies exactly why it fails when it cannot.

Unlike existing benchmarks (SWE-bench and its variants), NanoBench is not a dataset of single-file bug fixes on isolated repositories. It is a stress-test built from real merged pull requests in high-complexity, multi-language codebases — tasks that require genuine architectural reasoning, not keyword-searchable surface changes. And unlike any benchmark designed for a single-vendor CLI, NanoBench evaluates across every provider Nanocoder supports: Ollama, OpenRouter, Anthropic, Gemini, and local models. The same task, the same scoring, across every model.

This is the benchmark the agent benchmarking space does not have. In May 2026, Artificial Analysis launched the first public Coding Agent Index — the first benchmark measuring full agent stacks (model + harness pairs). NanoBench does the same thing, purpose-built for Nanocoder, with the failure taxonomy depth that no existing public benchmark offers.

The project is proposed as a separate repository under the Nano Collective (`Nano-Collective/nanobench`). The evaluation core's orchestration language is left to the maintainer's discretion, with Nanocoder as the first and initially only harness, and a maintainer-owned roadmap...

---

## 2. Introduction

### Why NanoBench?

Nanocoder ships changes regularly — to its prompt builder, tool-calling logic, planning mode, context compression, and provider integrations. Currently, there is no systematic way to answer the question every release implicitly asks: *did this change make the agent better?*

The problem compounds with every new provider Nanocoder adds. When a user switches from Claude Sonnet to a local Qwen model, they have no way to know which one performs better on the class of engineering task they actually care about. And when a maintainer improves the prompt builder, they cannot tell whether the improvement holds across providers or only benefits one.

NanoBench answers both questions with the same infrastructure: a fixed set of expert-curated tasks, a reproducible evaluation pipeline, and a scoring model that tells maintainers not just *what* changed but *why*.

### Background and Motivation

The core motivation stems from a direct empirical observation of how current agent harnesses handle highly complex, enterprise-grade architectures. When evaluating a real-world, multi-file engineering task—such as a strictly functional data flow refactor in a scientific computing repository (e.g., `google-deepmind/torax`)—standard agents frequently exhibit a fundamental breakdown in codebase reasoning:

- `Context Explosion`: Reading dozens of irrelevant files instead of isolating the exact components needed for the fix.

- `Architectural Blindness`: Making surface-level edits that completely break underlying system paradigms (like mutating variables in a strictly functional codebase).

- `API Hallucination`: When faced with complex or unfamiliar abstractions, agents frequently hallucinate non-existent methods rather than successfully navigating the actual class hierarchy.

- `Resource Exhaustion`: This undirected search strategy results in massive token consumption and rate-limit failures long before a meaningful solution is formulated.

When an agent fails a task of this complexity on a standard benchmark, the output is simply a binary FAILED. There is zero diagnostic signal explaining why the agent failed—whether it was a hallucinated API, an exceeded context window, or an abstraction mismatch. Existing benchmarks cannot capture these nuances because their tasks are too simple to expose them

This is the gap NanoBench fills.

---

## 3. The Problem

### Limitations of Existing Benchmarks

The agent benchmarking space is saturated and structurally limited. While current standards have driven rapid progress, they fail to test real-world engineering constraints. Existing benchmarks suffer from five core flaws:

- **Single-language bias**: the majority of SWE-bench tasks are Python-only, with no polyglot engineering tasks.
- **Overly localized fixes**: most tasks require changes to 1-2 files. Real engineering problems span architectural layers.
- **Confounded scaffold-model effects**: SWE-bench scores vary significantly depending on which agent scaffold is used, making it impossible to attribute performance to the model or the harness independently.
- **Contamination**: a significant portion of resolved issues were incorrectly marked as resolved due to weak test cases that did not verify patch correctness. When properly filtered, resolution rates drop from ~42% to ~22% on average.
- **Data contamination**: most tasks predate significant LLM knowledge cutoffs, meaning agents can solve them from memory rather than reasoning.

While newer benchmark variants attempt to patch these individual issues, none of them solve the core problem: there is currently no benchmark designed to evaluate a specific agent harness across multiple model providers.

### The Gap in Real-World Agent Evaluation

The benchmarking community has recently recognized a deeper structural gap. In May 2026, Artificial Analysis launched the Coding Agent Index — the first benchmark evaluating full agent stacks (model + harness pairs) rather than models in isolation. The finding: the same model scores differently in different harnesses, which means the wrapper matters as much as the model.

Nanocoder is a harness. Its prompt builder, tool-calling logic, planning mode, context compression, and AGENTS.md injection all shape how an underlying model performs. None of that is measured by any existing benchmark.

NanoBench closes this gap. It holds the harness constant (Nanocoder) and varies the model — producing a `Provider → Model → Task → Score → Failure taxonomy` matrix that answers the questions existing benchmarks cannot:

1. *Which model performs best through Nanocoder on real engineering tasks?*
2. *Did our last change to Nanocoder's prompt builder actually improve agent performance across providers, or just on one?*
3. *Where exactly does the agent fail — and is that failure caused by the model or the harness?*

---

## 4. Design Principles

### Provider Neutrality

Every design decision in NanoBench must work across all providers Nanocoder supports: Ollama (local), OpenRouter, Anthropic, Gemini, and any OpenAI-compatible API. No task, no scoring mechanism, and no infrastructure component may depend on a specific provider's API, rate limit structure, or authentication method.

The evaluation invocation is:
```bash
nanocoder --provider <provider> --model <model> --mode yolo run "<task_prompt>"
```

This is a first-class Nanocoder CLI invocation. Any provider that Nanocoder supports is automatically supported by NanoBench.

### Reproducibility

Every evaluation task is anchored to a specific, immutable repository state (e.g., a locked commit SHA). The orchestrator resets the environment to this exact state before invoking the agent. This ensures that benchmark results remain perfectly reproducible over time, completely insulated from any upstream codebase changes.

### Real Engineering Tasks

All tasks are sourced from real merged pull requests in real production repositories. No synthetic tasks. No LLM-generated task descriptions. The "Curation Paradox" is a guiding principle: **we cannot rely on an LLM to select the tasks we use to benchmark an LLM.** If an agent already possessed the architectural depth to distinguish a syntax fix from a multi-component reasoning bottleneck, this dataset would already be obsolete. Curation must be expert-led.

### The Grading Paradox

The same reasoning that governs task curation governs scoring. **If a model cannot be trusted to decide which tasks belong in the benchmark, it cannot be trusted to decide whether a run of that benchmark succeeded**. For this reason, every terminal state in NanoBench — pass, partial
pass, or failure category — is assigned by a deterministic rule engine reading structured telemetry, never by a model reading logs and rendering a judgment.
**Section 9.1 defines this mechanism in full.**

### Transparency

Every structural decision—from repository selection to the final scoring rationale—is fully auditable. Instead of black-box curation, a transparent engine scores and ranks repositories based on objective complexity metrics. Furthermore, every evaluation task exposes its complete metadata to the community, including the original issue context, the expert-verified golden patch, and the exact verification commands.

### Extensibility

NanoBench is designed to grow. The task schema, repository registry, and scoring logic are all versioned. Community contributors can submit new tasks through a defined validation pipeline. Future versions can add new harnesses beyond Nanocoder, new failure categories, and new scoring dimensions without breaking existing task definitions.

---

## 5. Project Vision

### What NanoBench Aims to Achieve

NanoBench aims to become the standard evaluation suite for the Nano Collective's agent tooling — the infrastructure layer that tells maintainers, contributors, and users whether changes are making Nanocoder better at actual engineering work, not just at benchmark-shaped tasks.

### Goals

- Deliver a reproducible, provider-neutral evaluation pipeline for Nanocoder.
- Curate an expert-verified dataset of 10-20 tasks from 5-10 production repositories in v1.
- Produce a failure taxonomy report that classifies *why* an agent failed, not just whether it passed.
- Enable multi-provider comparison on the same task set, so users can make informed model choices.
- Build CI infrastructure that catches Nanocoder regressions automatically on every PR.

### Non-Goals

- NanoBench is not a general-purpose benchmark for all coding agents. It is purpose-built for Nanocoder as the harness.
- NanoBench is not a fine-tuning dataset. Tasks are for evaluation, not training.
- NanoBench does not aim to replace SWE-bench for the broader research community. It aims to be more useful for Nanocoder's specific needs than SWE-bench is.
- NanoBench does not benchmark model intelligence in isolation — it benchmarks model performance *through Nanocoder*, which is the correct unit of analysis for this project.

---

## 6. Proposed Architecture & Task Lifecycle

```
[ Task Telemetry Trigger ]
            │
            ▼
┌───────────────────────────────────────┐
│     Manifest Ingestion Layer          │ ──► Parses task constraints & metadata
└───────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│    DevContainer Sandbox Provisioner   │ ──► Native virtual envs (uv/pnpm) for local runs,
└───────────────────────────────────────┘     pre-baked Docker images for CI pipelines
            │
            ▼
┌───────────────────────────────────────┐
│     Headless Execution Loop           │ ──► Invokes Nanocoder via --plain --json flags,
└───────────────────────────────────────┘     bypassing the Ink.js interactive render tree
            │
            ▼
┌───────────────────────────────────────┐
│     Deterministic Telemetry Capture   │ ──► The orchestrator captures the structured JSON
└───────────────────────────────────────┘      run report directly from stdout
            │
            ▼
┌───────────────────────────────────────┐
│      Native Verification Harness      │ ──► Runs localized project test suites 
└───────────────────────────────────────┘     directly inside the container
            │
            ▼
┌───────────────────────────────────────┐
│       Diagnostic Scoring Engine       │ ──► Maps the JSON log dump to fractional
└───────────────────────────────────────┘     scores and the failure taxonomy
```

---

## 7. Dataset Design

### Repository Selection Criteria

To ensure rigorous, objective, and consistent curation across all current and future dataset releases, candidate repositories are evaluated against a deterministic scoring matrix. A repository must achieve a minimum score of 12 out of 20 points to be onboarded into the benchmark:

| Axis | Points | Criteria |
|---|---|---|
| Language breadth | 4 | 1pt per distinct language required to solve a typical bug |
| Cross-file dependency depth | 4 | Avg files read to understand one bug, sampled from 5 closed PRs |
| Post-April-2026 activity | 4 | ≥2 merged PRs/month = 4pts; ≥1/month = 2pts; less = 0pts |
| Domain novelty | 4 | 0 if domain already covered; 2 if adjacent; 4 if new domain |
| Context pressure | 4 | >80k tokens = 4pts; 50–80k = 3pts; 20–50k = 2pts; &lt;20k = 0pts |

### Architectural Complexity Tiers

To systematically probe an agent's reasoning depth, NanoBench abandons simplistic line-count metrics in favor of four **Architectural Complexity Tiers**. These tiers categorize the cognitive load and reasoning radius required to solve the task. 

Crucially, this taxonomy is grounded in mechanistic interpretability research regarding how Large Language Models encode hierarchical structure. Transformer layers encode progressively more abstract representations: shallow layers process local syntactic patterns, middle layers build relational graphs (e.g., imports and function calls), and deep layers encode abstract systemic invariants. NanoBench's tiers map directly to this cognitive architecture:

| Tier | Designation | Cognitive Radius | Target Agent Behavior | Diagnostic Implication |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Isolated Edit** | Localized syntax/logic within a single file. | Read file → identify logic gap → edit. | **Baseline Competence.** Models failing here lack fundamental code comprehension. Run-to-run variance should be zero. |
| **Tier 2** | **Interface Mapping** | Tracing dependencies across 2–5 files. | Search → trace import chains → reconcile interface contracts. | **Relational Reasoning.** Tests the middle transformer layers. Failure indicates an inability to maintain coherent state across API boundaries. |
| **Tier 3** | **System Refactor** | Comprehending module graphs and invariants across 5–15 files. | Investigate structure → map dependencies → plan → execute multi-file changes. | **Architectural Abstraction.** Tests deep transformer layers. Failure indicates the agent's planning capacity breaks down when coordinating system-wide rules. |
| **Tier 4** | **Investigative Debugging** | Multi-step hypothesis testing where root causes are obfuscated. | Investigate → form hypothesis → test → refine → implement. | **Sustained Inference.** The ceiling task. High run-to-run variance is expected here, separating standard models from frontier reasoning engines. |

### Task Extraction Methodology

Tasks are extracted exclusively from real merged pull requests, not from open issues or synthetic generation. The extraction process:

1. **Identification**: Identify a merged PR containing multi-file architectural changes and strong native test coverage.
2. **Patch Isolation**: Surgically extract the golden patch from the PR diff to establish the ground truth.
3. **State Pinning**: Record the immutable `base_commit` (the exact parent commit just before the fix was merged).
4. **Reproducibility Check**: Clone the repository at the `base_commit` and verify the bug natively reproduces in isolation.
5. **Verification Gate**: Confirm the test suite fails at the `base_commit`, and successfully passes only after applying the ground-truth patch.
6. **Flakiness Gate**: Verify that the `test_command` returns an identical result on three consecutive runs at the `base_commit`. A task that is not deterministic before the agent touches it can never produce a trustworthy score.
7. **Contamination Screening**: Confirm the merge date falls after the contamination cutoff via immutable pinned SHAs. (Note: Index-backed similarity screening is deferred to the v2 roadmap).

### Task Schema

Every curated task is compiled into a standardized, machine-readable metadata schema. This schema guarantees that the orchestrator has all the necessary parameters to run the evaluation deterministically. The schema enforces four core metadata categories: for example:

```json
{
  "task_id": "torax-001",
  "repo": "google-deepmind/torax",
  "repo_url": "https://github.com/google-deepmind/torax",
  "issue_url": "https://github.com/google-deepmind/torax/issues/547",
  "pr_url": "https://github.com/google-deepmind/torax/pull/1895",
  "base_commit": "<sha>",
  "languages": ["python", "jax"],
  "domain": "scientific computing",
  "complexity_tier": "Tier 3 (System Refactor)",
  "task_type": "feature",
  "reasoning_category": "functional_flow_integrity",
  "token_estimate": 52000,
  "problem_statement": "...",
  "required_files": [
    "torax/_src/transport_model/qlknn_transport_model.py",
    "..."
  ],
  "ground_truth_patch": "...",
  "test_command": "pytest torax/tests/transport_model_test.py -x -q -k 'qlknn'",
  "contributor": "RONAK-AI647",
  "merged_at": "2026-01-15T00:00:00Z"
}
```

### Ground Truth

The ground truth for every task is the actual merged PR diff. This enables strict pass/fail grading via the native test suite, but also unlocks fractional scoring for pathfinding. Because the orchestrator knows exactly which files need to be edited, agents receive partial credit for successfully navigating to the correct components, even if their final code fix falls short.

It cuts the fluff but keeps the two most important points: the PR diff is the standard, and we give credit for good navigation.

### Dataset Versioning

The dataset is versioned via Git tags (`v0.1`, `v1.0`, etc.). Every `base_commit` SHA is immutable. A task added in v0.1 will produce identical evaluation conditions in v2.0.

---

## 8. Evaluation Methodology

### Execution Pipeline

NanoBench invokes Nanocoder in non-interactive run mode — the same mode Nanocoder explicitly designed for CI/CD pipelines and automation scripts:

```bash
nanocoder \
  --provider <provider> \
  --model <model> \
  --mode yolo \
  --trust-directory \
  --plain \
  --json \
  run "<problem_statement>\n\nKey files to focus on:\n<required_files>"
```

- `--mode yolo`: auto-accepts all tool calls, including bash execution, without prompting.
- `--trust-directory`: skips the first-run directory trust prompt (ephemeral, does not modify `trustedDirectories`).
- `--provider` / `--model`: fully specify the agent stack being evaluated. 
- ` --plain` / `--json`: bypasses the interactive Ink.js UI and emits a structured JSON report (`{ kind, exitCode, toolCalls[], filesChanged[], temperature }`) directly to `stdout` for deterministic parsing. The `temperature` field records the actual sampling parameter used for the run, per §8.5.

Note on Token Tracking: To fully support the `context_window_exceeded` failure taxonomy, NanoBench will coordinate a minor upstream feature request with the Nano Collective to add a `usage` block (token counts) to the existing `--json` run report.

### Execution Modes & The Navigation Delta

Unconstrained codebase exploration is highly token-intensive. Early dry-runs on complex repositories  demonstrated that agents often exhaust standard API tier quotas purely on file exploration before attempting a fix—resulting in a 0.0 score for quota exhaustion rather than an architectural failure. 

To reconcile the tradeoff between measuring navigation and maintaining reproducible run costs, NanoBench defines two evaluation modes:

1. **Hinted Mode (Default):** The agent receives the `<problem_statement>` appended with the `<required_files>` metadata array. This isolates pure implementation ability. Given the right architectural map, can the agent produce a correct fix? Categories like `hallucinated_api` and `wrong_abstraction_layer` are primarily measured here.
2. **Navigation Mode (Opt-in):** The agent receives *only* the problem statement. This tests the full stack: can the agent find *and* fix the bug? The `0.1 Pathfinding Credit` and `insufficient_context_read` signals are only meaningful—and only awarded—when running in this mode.

The performance delta between these two modes serves as a novel diagnostic metric, quantifying exactly how much of a given model's failure rate is caused by poor pathfinding versus poor implementation.

### Scoring Strategy

| Score | Label | Condition |
|---|---|---|
| 1.0 | Complete Resolution | All tests in `test_command` exit 0 and no pre-existing passing tests are broken. This is the only score that counts as a solved task. |
| 0.5 | Partial Resolution | ≥50% of target tests pass AND the agent modified ≥1 file within `required_files`. Distinguishes correct-but-incomplete logic from hallucinated fixes. |
| 0.1 | Pathfinding Credit | Tests fail (or fail to compile), but the agent successfully navigated to and modified ≥1 file within `required_files`. Rewards architectural localization even if the implemented logic is flawed. |
| 0.0 | Zero Signal | Tests fail AND zero target files were touched. The agent hallucinated a fix in irrelevant files, or execution halted prematurely (e.g., token exhaustion, API timeout) before an edit was made. |

### Partial Credit

The 50% threshold for partial pass is intentional. A task with 10 test cases should not score 0.0 simply because one edge case was missed — that conflates "wrong direction" with "nearly right." The threshold requires both directional correctness (touched the right files) and substantive correctness (at least half the tests pass).

### 8.5 Run Variance & Sampling Policy
 
LLM sampling is stochastic. The same task, run twice on the same model, can
pass once and fail once. §7 already asserts that this variance is not uniform
across tiers — Tier 1 tasks are expected to have close to zero run-to-run
variance, while Tier 4 tasks are expected to have high variance. NanoBench
turns that assertion into an actual sampling policy, so the claim can be
checked rather than taken on faith.
 
**Runs per task.** The number of runs per task is set by its Architectural
Complexity Tier, not applied uniformly:
 
- **Tier 1–2:** 1 run per task per model. These tasks are expected to be
  near-deterministic, so repeated sampling adds cost without adding signal.
  Used directly in CI regression checks.
- **Tier 3–4:** 5 runs per task per model, minimum, before any score from
  these tasks is used in a regression comparison. This is a higher bar than
  typical CI eval sampling, because NanoBench's Tier 3–4 tasks are more
  expensive and more architecturally demanding per run — getting the sample
  size right matters more here, not less.
**Score reporting.** Every task reports two numbers, not one:
 
- `pass@1` — the result of a single run. Cheap, useful as a smoke-test signal,
  but not used alone for regression claims on Tier 3–4 tasks.
- Averaged score over N runs — the number actually used for trend comparisons
  and the Provider Matrix in §8's Benchmark Outputs.
Both the raw pass count (e.g. "3/5 runs passed") and the derived score are
shown in the output report, so a reader can see the sample size behind any
number rather than a single smoothed percentage.
 
**Temperature.** Temperature is pinned to 0 by default for every provider
that supports it. The actual temperature used is recorded per run in the
`--json` telemetry (see §8's Execution Pipeline). Where a provider or model
does not support temperature 0 — some hosted reasoning models force sampling
— the run is explicitly flagged as non-deterministic in the output, so a
reviewer can tell whether spread in a Tier 3/4 result comes from the task's
difficulty or from an unpinned sampling parameter.
 
**What counts as a real regression.** A raw point-estimate comparison (for
example, "52% dropped to 55%") is not enough to claim a regression at
NanoBench's dataset size — a single flipped task can move the aggregate by a
large margin on its own. Instead, each aggregate score is reported with a
confidence interval computed from its N runs (a Wilson interval on the pass
rate). Two scores are only treated as a real regression or improvement if
their intervals do not overlap. If the intervals overlap, the report labels
the movement as "not distinguishable from noise" instead of presenting it as
a finding.
 
---

### Benchmark Outputs

Each evaluation run deterministically produces three primary artifacts:

- **Raw Telemetry Output**: Extracted directly from Nanocoder's `--json` `stdout` payload, this report exposes `toolCalls[]` and `filesChanged[]` to compute exactly what files were read and edited, mapping directly to the failure taxonomy.

- **Aggregated Baseline Report**: A human-readable synthesis document breaking down aggregated scores across multiple dimensions: provider, model, reasoning category, language, domain, and token density.

- **Provider Matrix**: A comparative matrix mapping Provider → Model → Task → Score → Failure Mode, allowing maintainers to instantly identify which LLMs suffer from specific architectural blind spots (e.g., hallucination vs. context exhaustion).

---

## 9. Failure Taxonomy

The failure taxonomy is the primary diagnostic payload generated by the benchmark. Binary score improvements (e.g., shifting from 52% to 55%) provide zero actionable signal to model developers or framework maintainers. Conversely, observing that `insufficient_context_read` failures dropped from 62% to 21% after an update to a prompt builder provides exact, targeted telemetry.

### 9.1 Classification Mechanism

Every failure category in this taxonomy is assigned by a deterministic rule
engine, not a model. The engine reads only structured fields that already exist in Nanocoder's `--json` run report — `toolCalls[]`, `filesChanged[]`, exit codes, and, once the upstream `usage` block lands, token counts together with the static `required_files` array from the task schema. No log text is summarized or judged by an LLM at any point in this pipeline. This follows directly from the Grading Paradox in §4: a benchmark that will not let a model pick its own tasks should not let a model decide why it failed one.

**Assignment order.** A run's terminal state is checked against the six
categories in a fixed sequence. The first rule that matches is the label that
is applied, and no later rule is evaluated once a match is found. This removes
the need for a "which one is more severe" judgment call — the order itself is
the precedence rule.

1. **Execution halted before any edit.** If Nanocoder exits on a context-size
   or rate-limit error and `filesChanged[]` is empty, the run is
   `context_window_exceeded`, regardless of what a test run might otherwise
   have shown. A run that never reached the point of editing code cannot also
   be a partial fix.
2. **No required-file overlap.** If nothing in `filesChanged[]` intersects
   `required_files`, the run is `insufficient_context_read` in Navigation Mode,
   or scores 0.0 (Zero Signal) in Hinted Mode — checked before any test output
   is inspected.
3. **Required-file overlap, full failure, missing-symbol error.** If
   `filesChanged[]` intersects `required_files` but the test run fails on an
   `AttributeError` or `NameError` referencing a symbol that does not exist in
   the historical state of `required_files`, the run is `hallucinated_api`.
4. **Required-file overlap, full failure, interface-level error.** Same
   overlap condition as above, but the failure is a type or interface mismatch
   rather than a missing symbol: `wrong_abstraction_layer`.
5. **Partial test pass.** If at least 50% of target tests pass and
   required-file overlap is nonzero, the run is `partial_fix_only`. This rule
   is only reached if rules 1–4 did not match, so a run that partially passed
   despite an earlier context warning is still scored as a genuine partial
   fix — the run produced a gradable artifact, which is the stronger signal.
6. **Cross-language split (Navigation Mode, polyglot tasks only).** One
   language's test suite passes fully while another fails:
   `missing_cross_language_change`.
**Structurally impossible overlaps.** Some category pairs cannot both apply to
the same run, by construction rather than by rule ordering:
 
| Category A | Category B | Why they cannot co-occur |
|---|---|---|
| `context_window_exceeded` | `partial_fix_only` | The former requires `filesChanged[]` to be empty; the latter requires nonzero required-file overlap. |
| `context_window_exceeded` | `hallucinated_api` / `wrong_abstraction_layer` | Both require a completed test run; a context-exhausted run never reaches `test_command`. |
| `hallucinated_api` | `wrong_abstraction_layer` | Both require full test failure with required-file overlap, but are separated by error type (missing symbol vs. interface mismatch) — a single failure has one dominant error type, checked in fixed order. |
 
**Open limitation.** Rules 3 and 4 depend on string-matching exception types
inside a stack trace, which is more fragile than the pure `filesChanged[]`
overlap checks used by every other rule. This is the least deterministic part
of the taxonomy today, and it is treated as such — see the updated open
question in §14 for how this gets validated before it is trusted at scale.
 
---

### 9.2 Signal Confidence Level (1-4)
 
Not every diagnostic signal in this taxonomy carries the same certainty. Some
come straight from structured fields with no interpretation required; others
depend on matching text inside an error message, which is inherently less
reliable. NanoBench makes this explicit with four confidence levels, ranked from most to least direct:
 
- **Level 1 — Structural signal.** Computed purely from `filesChanged[]`
  against `required_files`. No interpretation involved. Backs
  `insufficient_context_read`, `partial_fix_only`, and
  `missing_cross_language_change`.
- **Level 2 — Outcome signal.** Pass/fail counts from `test_command`,produced
  by the target repository's own test runner rather than by Nanocoder. Backs
  the 0.5 / 1.0 scoring thresholds directly.
- **Level 3 — Process signal.** Nanocoder's own exit code, e.g. a context-size or rate-limit error. Deterministic, but its accuracy is only as good as
  Nanocoder's own error reporting — the same upstream dependency already noted
  in §8 regarding the `usage` block.
- **Level 4 — Content signal.** String-matching against exception type inside a
  stack trace. Backs `hallucinated_api` and `wrong_abstraction_layer`. This is
  the least certain level in the taxonomy and is flagged as a known limitation
  rather than presented as equally reliable to Levels 1–3.
Each category below is tagged with its level so the taxonomy states its own
confidence level rather than leaving it implicit.

**Human Audit Protocol for Level 4 Signals:**
Because Level 4 signals (`hallucinated_api` and `wrong_abstraction_layer`) rely on string-matching exception types, they require periodic offline human auditing.
- **No Score Overrides:** Humans audit the taxonomy classification only. They never set or override a task score.
- **The 90% Agreement Rule:** The audit publishes an agreement rate between the human and the rule engine. If agreement drops below 90%, the `hallucinated_api` and `wrong_abstraction_layer` categories will temporarily collapse into a single, coarser `implementation_error` category until the parser rules are improved.
- **Mandatory Blinding:** To prevent model bias, reviewers only see the stack trace and the diff. The provider and model names are strictly stripped from the payload. *(Note on v1 Limitations: As the sole dataset maintainer for v1, the author cannot practically blind themselves to the CLI invocations. True blinding is mandatory from the second reviewer onward).*
 
---

NanoBench maps terminal states to six strict diagnostic categories:

### Hallucinated APIs (`hallucinated_api`)→ Level 4

The agent calls a method or accesses an attribute that does not exist in the historical state of the codebase. This is highly common in repositories with complex, evolving SDKs or strict functional paradigms that prohibit imperative mutations.

*Diagnostic signal: test fails with `AttributeError` or `NameError` on a symbol that doesn't exist in `required_files`.*

### Insufficient Context Reading (`insufficient_context_read`)→ Level 1

The agent failed to read enough of the repository to map the architectural dependencies before executing changes. This manifests as surface-level logic edits that miss the underlying data flow. Agents may read dozens of files, but fail to locate the actual architectural bottleneck.

*Diagnostic signal: `files_read` is high but `required_files` overlap with `files_edited` is low.*

### Wrong Abstraction Layer (`wrong_abstraction_layer`)→ Level 4

The agent injected its logic at the incorrect level of the architecture—for example, editing a high-level interface contract when the fix was actually required in the underlying implementation driver. This is heavily prevalent in deep, plugin-based frameworks.

*Diagnostic signal: agent touched files from `required_files` but tests still fail with an interface mismatch error.*

### Missing Cross-Component Changes (`missing_cross_language_change`)→ Level 1

The agent successfully fixed one localized component but missed a parallel architectural change required in another language or package. This routinely occurs in polyglot, full-stack environments (e.g., updating a backend schema but ignoring the frontend state manager).

*Diagnostic signal: partial tests pass (one language's tests) but the other language's tests fail.*

### Context Window Exhaustion (`context_window_exceeded`)→ Level 3

The agent exhausted its context window or API token budget before outputting a viable patch. High-complexity architectural tasks frequently exceed standard context limits, proving that current agents struggle to navigate large-scale repositories without highly optimized retrieval.

*Diagnostic signal: Nanocoder exits with a context-size error or rate-limit error before `test_command` is reached.*

### Partial Fixes (`partial_fix_only`) →  Level 1 + Level 2

The agent successfully implemented correct logic for a subset of the task but failed to catch all required edge cases. This triggers fractional scoring (0.5) because the agent demonstrated strict directional and partial functional correctness.

*Diagnostic signal: some target tests pass, agent touched files from `required_files`, but full test suite fails.*

### Future Categories

As the dataset grows, additional failure categories will be introduced through the task contribution process:
- `test_not_updated` — agent fixed the implementation but forgot to update/add tests
- `correct_file_wrong_function` — agent read the right file but edited the wrong function
- `environment_agency_failure` —The agent failed to correctly parse or iterate upon complex terminal tracebacks (e.g., deeply nested compiler errors or strict type-checker outputs) preventing it from self-correcting a failing fix.
---

## 10. Execution Infrastructure & Isolation

### Deterministic Workspace Provisioning

To guarantee absolute reproducibility and prevent cross-run state contamination, the orchestrator enforces strict isolation protocols for every evaluation cycle. The evaluation pipeline executes the following lifecycle for every task:

1. `Ephemeral Sandbox Creation`: A pristine, isolated workspace is provisioned exclusively for the current task.
2. `State Hydration`: The target repository is retrieved via a high-speed shallow clone and immediately hard-reset to the exact, immutable base_commit SHA, ensuring the agent inherits the precise historical state of the codebase.
3. `Subprocess Injection`: The agent (e.g., Nanocoder) is invoked headlessly with its working directory strictly bound to the isolated sandbox, physically preventing it from accessing external system states or caching layers.
4. `Ephemeral Teardown`: Upon completion of the verification suite and telemetry extraction, the sandbox is aggressively purged.

This prevents cross-task contamination and ensures every run starts from a clean state.

### Containerization & Dependency Isolation

Because advanced codebases often rely on complex, system-level dependency chains, native multi-language runtimes, or hardware-specific acceleration, the execution pipeline utilizes an adaptive environment management layer.

The infrastructure handles workspace environments across two distinct strategies:

- **Runtime-Insulated Tasks**: For single-language or interpreted environments (e.g., pure Python ecosystems), the runtime context is isolated via virtual environments or lightweight configuration specs mapped directly to the ephemeral workspace. This guarantees version pinning for specialized mathematical or runtime packages without incurring the container layer's overhead.

- **Containerized Archetypes**: For polyglot codebases or systems with deep native compilation requirements (e.g., Go binaries, compiled C/C++ components, Node/React builds), each task definition bundles a standardized container specification (such as a Dockerfile or development container definition). The orchestrator dynamically spins up a containerized sandbox to execute the agent and run the verification test suite.


### CI Integration

NanoBench ships a continuous integration workflow that:
- Validates every incoming task against schema, reproducibility, and verification requirements before it enters the dataset.
- Optionally runs a configurable subset of tasks against a specified provider and model on demand.
- Posts a score summary and failure taxonomy breakdown as a review comment.

This workflow can be wired directly to Nanocoder releases to catch agent regressions before they ship.

---

## 11. Why NanoBench is Different

### Comparison with SWE-bench

| Dimension | SWE-bench | NanoBench |
|---|---|---|
| Task source | GitHub issues (automated scrape) | Real merged PRs (expert-curated) |
| Task complexity | Mostly single-file, single-language | Multi-file, multi-language, architectural |
| Contamination control | Weak (most tasks predate model cutoffs) | Strong (post-cutoff merge dates, immutable pinned SHAs) |
| Failure analysis | Pass/fail only | Granular diagnostic taxonomy (hallucination, abstraction mismatch, context exhaustion) |
| Provider comparison | Not supported | First-class: same task, all providers |
| Harness specificity | Generic (model-level) | Nanocoder-specific (full stack: model + harness) |
| Scoring | Binary | Graded (1.0 / 0.5 / 0.1 / 0.0) |

### Comparison with Existing Evaluation Suites

Nanocoder's own benchmarking (documented in the repo's `benchmarks/` directory) measures performance metrics like response speed and token throughput — not agent task-solving accuracy. NanoBench is complementary infrastructure: where the existing benchmarks measure *how fast* Nanocoder runs, NanoBench measures *how well* it solves real problems.

### Why Provider-Neutral Evaluation Matters

The harness matters as much as the model. The same model scores differently through different agent harnesses — a finding confirmed by the Coding Agent Index (Artificial Analysis, May 2026). For Nanocoder specifically, this means:

- A user choosing between Claude Sonnet and a local Qwen model needs Nanocoder-specific performance data, not raw SWE-bench scores evaluated through a different harness.
- A maintainer improving Nanocoder's prompt builder needs to know whether the improvement holds across all providers or creates a regression on one.

NanoBench is the only infrastructure that can answer either question for Nanocoder, because it is the only benchmark that treats Nanocoder itself as the fixed variable.

---

## 12. Risks and Challenges

### Dataset Contamination
**Risk:** An agent solves a task using training memory rather than active reasoning, artificially inflating its score.

**Mitigation:** Every task is post-dated beyond relevant model knowledge cutoffs. The pinned commit SHA and merge timestamp are stored in every task, making contamination claims auditable and falsifiable. (Note: Index-backed similarity screening will be introduced in v2).

### Environment & Dependency Drift
**Risk:** Conflicting system dependencies or runtime mismatches cause evaluation failures unrelated to the agent's actual performance.

**Mitigation:** Single-language environments are isolated via lightweight
configuration. Polyglot environments run inside fully containerized sandboxes, ensuring dependency conflicts never affect evaluation results.

### Evaluation Cost
**Risk:** Multi-provider evaluations at scale incur high API costs and hit rate limits.

**Mitigation:** NanoBench utilizes **Hinted Mode** as the default execution path. By injecting expert metadata, the framework prevents runaway API costs caused by unbounded file exploration, making it financially feasible to run continuous CI regressions. Maintainers can selectively trigger **Navigation Mode** for deep-dive pathfinding evaluations when token budgets permit.

### Statistical Power at v1 Scale
**Risk:** With a v1 dataset of roughly 6 tasks, each task carries a large
share of the aggregate score. A single task flipping from pass to fail can
move the overall number by a large margin — larger than many of the real
regressions the benchmark is meant to catch. At this scale, it is genuinely
hard to tell a real regression from ordinary run-to-run noise.
 
**Mitigation:** This is a known and bounded limitation, not a hidden one. The
sampling and confidence-interval policy in §8.5 is the short-term mitigation:
wide confidence intervals at v1 scale will correctly show up as wide, and the
report will say so rather than presenting a noisy point estimate as a
finding. The long-term fix is dataset growth — §15's v2/v3 roadmap already
plans to expand the task count, which is what actually narrows the intervals.
v1's regression-detection claim should be read as directionally useful but
statistically weak, with that weakness improving as the dataset grows.
 
### Benchmark Bias
**Risk:** Tasks curated by one person reflect a narrow domain slice.

**Mitigation:** The repository scoring matrix is fully transparent and auditable. A community contribution pipeline with strict validation gates opens curation to the broader collective over time.

---

## 13. Alternatives Considered

### Synthetic Benchmarks

Synthetic tasks (generated by LLMs from codebase analysis) are scalable but untestable for quality. We cannot verify whether a synthetically generated task actually requires architectural reasoning or can be solved by a simple keyword search. Rejected on principle: an LLM cannot be trusted to select the tasks used to benchmark LLMs.

### Single-Repository Benchmarks

Benchmarking Nanocoder exclusively on the Nanocoder repository itself would produce a conflict of interest and contamination (training data likely includes the Nanocoder codebase). Rejected.

### Model-Specific Evaluation

Building the evaluation harness around a proprietary API (e.g., Gemini's Live API or Anthropic's streaming format).
Violates the core provider-neutrality principle of the Nano Collective. Enforcing vendor lock-in completely undermines the goal of universally comparing multi-model performance across a standardized agent harness. Rejected.

### Why These Were Not Chosen

All alternatives inherently compromise evaluation quality, narrow the diagnostic audience, or enforce vendor lock-in. The architecture proposed in this whitepaper is the only solution that is simultaneously rigorous, reproducible, and aligned with the Nano Collective's mandate for provider-neutral open-source tooling.

---

## 14. Governance & Curation Decisions

Following the public review window, the initial open questions regarding dataset governance and pipeline architecture have been resolved into the following protocols:

### Dataset Ownership & Governance
The dataset is maintainer-owned through v1 and v2, with `@RONAK-AI647` serving as the dataset maintainer. Transition to collective governance is deferred to v3 when community curation formally opens.New domains are proposed via PR against the repository registry. A domain onboards if the target repository scores 12 or higher on the §7 matrix and the domain is not already represented. The maintainer decides, and the reasoning is recorded in the PR itself so the decision is auditable later.Disputes regarding scores or tasks are raised as issues on the `nanobench` repository. The dataset maintainer rules on the dispute and records the outcome in the task file itself, so the resolution history travels with the task. Unresolved disputes escalate to Will.

### The JSON Integration Contract
The evaluation core's orchestration language is the maintainer's choice. However, the integration contract is strictly mandated: Nanocoder's `--json` run report must be consumed through a checked-in schema. CI must validate a real payload against this schema and fail on mismatch to prevent silent taxonomy degradation. The pinned Nanocoder version is recorded in every result set.

### Community Contribution Validation Gates
Task submissions pass through a bifurcated validation pipeline:
1. **Automated Hard Gates (CI):** Auto-rejections with no human-in-the-loop. Includes schema validation against the versioned §7 schema, reproducible `base_commit` cloning, the Verification Gate (test suite fails at `base_commit` and passes after the golden patch), the Flakiness Gate (`test_command` returns an identical result on 3 consecutive runs at `base_commit`), confirmation that the merge date falls after the contamination cutoff, and the repository scoring matrix reaching 12/20 on the automatically computable axes.
2. **Maintainer Judgment:** Subjective curation checks. Includes complexity tier assignment, domain novelty and overall dataset balance, whether the `problem_statement` leaks its own solution, and whether `required_files` is actually correct and complete.

Gate failures report which gate failed and how to fix it, rather than a bare rejection. Maintainers help contributors clear gates rather than closing submissions outright — a deliberate choice given that this whitepaper itself arrived from outside the core team.

### Retiring Tasks
Tasks are retired, never deleted. Triggers for retirement include a task failing the flakiness gate post-onboarding, an upstream repository rewriting history, or post-hoc contamination. A retired task is marked `retired` with a recorded reason and drops out of the next dataset tag. Existing version tags are never rewritten.

### Scoring & Classification Audit
Scoring remains fully automated; no human judgement sets or overrides a task score. A periodic, off-critical-path human audit checks Level 4 classification agreement (`hallucinated_api` vs. `wrong_abstraction_layer`) against the rule engine's output. If agreement drops below 90%, both categories collapse into a single, coarser `implementation_error` category until the parsing rules improve. Reviewer blinding to provider and model is mandatory from the second reviewer onward. Full protocol in §9.2.

---

## 15. Roadmap [ v1 scope ]

### Version 1.0 Deliverables

- Curated Diagnostic Dataset: A foundational matrix of 6 high-complexity, multi-file tasks spanning diverse, polyglot architectural environments, with all states strictly pinned and validated. This 6-task set is a starting point for the sampling and confidence-interval methodology in §8.5, not a target ceiling — v2/v3 dataset growth (below) is the primary lever for narrowing confidence intervals and strengthening the regression-detection claim in §2.

- Automated Orchestration Engine: A headless, fully automated evaluation pipeline that dynamically injects boundaries, triggers Nanocoder in non-interactive mode, and extracts fractional scores via native test suites.

- Provider Performance Matrix: A comprehensive, multi-model execution baseline evaluating the identical task dataset across leading commercial APIs and local open-weight models to isolate harness efficiency from raw model capability.

- Actionable Telemetry & CI Integration: Automated generation of the granular failure taxonomy matrix, bundled with a plug-and-play continuous integration workflow designed to block regression in future Nanocoder updates.

### Future Directions

- v2: **Polyglot Architectural Integration**: Expand the evaluation matrix to encompass complex, multi-language repositories, supported by dynamic, containerized execution sandboxes to handle native compilation and deep dependency chains.
- v3: **Decentralized Task Curation**: Transition from a closed-loop curated baseline to a community-driven contribution pipeline, enforced by strict programmatic validation checks to prevent task contamination and maintain dataset integrity.
- v3+: **Harness Efficiency Telemetry**: Introduce advanced differential scoring to measure the precise delta between a raw model's native API performance and its capability when routed through the execution harness, mathematically quantifying the value-add of the orchestration layer.
- Long-term: NanoBench as the standard evaluation layer for all Nano Collective agent tooling, not just Nanocoder

---
