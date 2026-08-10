---
title: "Scriptura (working title)"
description: "A working whitepaper for an open source, local-first AI code editor that replaces the proprietary editing and agent experience of Cursor with a model-agnostic, privacy-respecting shell built on open tooling"
sidebar_order: 7
proposer: "Jason-Chiu"
proposer_github: "jason1015-coder"
status: "In public review"
review_opens: "2026-07-15"
review_closes: "2026-08-24"
---

# Scriptura

This whitepaper proposes **Scriptura**: an open source code editor that reproduces the parts of the Cursor experience people actually pay for, on top of open tooling, with the model layer treated as a swappable backend rather than a captive one. A user installs Scriptura, points it at whichever model provider they already trust (a local Ollama instance, an OpenAI-compatible endpoint, an in-house proxy), and gets the editing, chat, agent, and completion experience without surrendering their code or their choice of model.

The closest sibling inside the collective is Nanocoder, which is the agent runtime. Scriptura is the *editor* that wraps that runtime. Nanocoder is the engine; Scriptura is the cabin. The two are designed to compose, and the design below assumes Nanocoder as the default local backend while keeping the provider abstraction open enough that anything satisfying the contract can sit behind it.

The document is published in working form so the collective can argue the shape of it before code lands. Naming and the default provider flow have been settled during the public review window (recorded under "Resolved in review" below); the remaining scope and design decisions are still open.

The proposed editor base already exists at [Scriptura](https://github.com/jason1015-coder/scriptura)

## Problem

A developer who wants an AI-shaped editing experience today picks from a small set of options, none of which fully satisfy the privacy- and locality-first posture the collective cares about:

1. **Proprietary AI editors (Cursor, Windsurf, and others).** Excellent UX, tightly integrated agent and completion loops, codebase indexing out of the box. Closed source on the editor side and on the model-routing side. Your code and your prompts go to the vendor's servers unless you pay for the privacy tier, and even then the routing and retention behaviour is a promise in a privacy policy, not something you can audit. The model you use is the model the vendor chose to wire in; bringing your own is second-class.
2. **VS Code plus a copilot-style extension.** Open editor, closed (or limited) AI backend. Copilot binds you to one vendor. Open alternatives exist but each re-implements the same thin chat panel and none deliver the *editing* feel Cursor nailed: the inline completion that predicts edits, the multi-file agent that actually applies changes, the `@codebase` context that reads the right files without you listing them.
3. **Terminal agents (Nanocoder, Aider, Claude Code).** Powerful, local-first, model-agnostic. But they live in the terminal. They do not give you the inline-edit affordance, the diff preview in place, the hover-to-explain, the tab-to-accept completion. They are a different category of tool that solves a different part of the problem.
4. **Rolling your own editor.** Theoretically possible on the VS Code fork or on a from-scratch web view. The integration work to get completion latency under control, to index a codebase well enough for `@codebase`, and to make the agent loop feel safe is large and largely unglamorous. Most developers who start this abandon it before it feels right.

None of these gives a developer an editor that (a) feels like Cursor, (b) is open source end to end, (c) lets them bring any model they want, local or remote, and (d) keeps their code on hardware they control by default. The gap is not a missing feature; it is a missing *posture*. Cursor proved the experience is worth building. The posture is what no one has shipped openly.

## Intended audience

Scriptura is built for developers who want the Cursor experience without the Cursor captivity. The audience is broad, but the project optimises hardest for a specific shape of user:

- **Local-first developers.** People who already run Ollama, LM Studio, or llama.cpp and want their editor's completions and agents to run against those models. This is the loudest case for the project and the natural first design partner.
- **Privacy-sensitive teams.** Organisations that cannot send source to a third party, who need the editor to prove (not promise) that the code stays local unless they explicitly route it elsewhere.
- **Model-flexible developers.** People who want to swap providers per task: a small local model for completions, a large remote model for the hard agent pass, a self-hosted proxy for audit logging. The provider abstraction is for them.
- **VS Code refugees.** Developers who like the VS Code editing model but not the telemetry, the vendor lock, or the copilot billing, and who want an open editor that inherits the extension ecosystem rather than forking it badly.

What the project is explicitly **not** optimised for, at least in v1:

- **Non-technical users.** Scriptura is a code editor. It assumes you can read a diff and configure a model endpoint.
- **Enterprises needing SSO, centralized policy, and audit export.** That is a phase 2 surface, and a plausible one if the local-first installs land first.
- **People who want zero configuration.** Local-first means at least one model endpoint has to exist somewhere. The project makes that cheap, not invisible.

The work that remains is choosing where to point the documentation and the defaults on day one, not narrowing the product itself. A v1 that documents "here is the editor, here is the provider abstraction, here is how to point it at a local model, here is how to point it at a remote one" is honest to what the product actually is.

## Principles

The three values that govern every Nano Collective project apply:

- **Privacy respecting.** The editor reads source code, which is sensitive. The default deployment is honest about exactly which bytes go where. With a local provider, nothing leaves the machine; the editor can prove this because the provider call is a localhost request the user can observe. With a remote provider, that path is explicit configuration, never hidden behaviour, and the editor surfaces clearly which requests it is about to send and to where. There is no background sync, no telemetry-by-default, no "privacy mode" that is a paid tier rather than the baseline.
- **Local first.** The completion and agent loops must make local providers (Ollama, LM Studio, llama.cpp, MLX, or Nanocoder on a local model) a first-class path with latency that feels native. Remote is allowed where capability requires it and is opt-in rather than the default.
- **Open for all.** Full source open. The provider abstraction documented in enough detail that anyone can write an adapter for a model backend we never anticipated. Anyone can run Scriptura without an account, a key we issued, or a service we host.


## Architecture

The current implementation consists of full C++ Qt based editor shell, with no AI layer yet.

The proposed solution will be adding a widget to the editor shell that provides AI functionality, by integrating with existing nanocoder agent (which is in typescript)

All outbound AI network calls are routed through the Rust backend, where the permission manager enforces the plugin-level network bitmask before any request leaves the machine. The egress log is a property of that chokepoint: every request authorised here is logged here, with a flag for local versus remote destination. Because the permission check and the log write happen in the same place, the log is not a best-effort audit surface — it is the enforcement path.


### Why this shape is the point

A proprietary editor could do steps 2-4 with a better model. What it cannot do is step 5 by default, or let the developer swap the model in steps 2-4 for one they own. The combination of "Cursor feel" plus "local by default" plus "any model behind a real contract" is the part no one has shipped openly. The context engine and the agent loop are the hard parts; the provider abstraction is what makes the whole thing mean something.

### Context engine

`@codebase` retrieval is the feature that makes the chat and inline-edit surfaces feel intelligent rather than generic. The v1 design choice is lexical and symbol-aware retrieval built on the editor's existing LSP workspace index and project search, not semantic retrieval via embeddings.

The reasoning is straightforward: the editor already maintains a symbol index through its LSP client, and project search (ripgrep-style, file-content aware) already exists as a first-class command. Reusing both gives `@codebase` a distinctive local-first answer with no embedding model, no vector index, and no incremental reindex story to maintain on a codebase that changes while the user is working. The retrieval layer ranks results by symbol relevance and recency, then feeds the top matches into the prompt context.

Semantic retrieval is a future idea, not a v1 dependency. It would require an embedding model, a vector store, and a strategy for keeping the index coherent as files change — all of which are solvable but none of which are needed to ship `@codebase` competently in v1. If the project later wants to layer semantic retrieval on top, the lexical layer is a strict superset: every result a semantic search can return is also findable by symbol and text search, and the architecture does not preclude adding a rerank step later.

The scope boundary is: v1 ships retrieval from the local codebase only. No remote index, no corpus beyond the open workspace, and no background indexing that runs without the user's knowledge.

## Composition with other collective projects

Most collective projects compose with Scriptura through the provider contract. A few have a more specific shape worth naming:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder)** is the reference agent backend. Scriptura's agent loop is a thin UI over Nanocoder's non-interactive mode; the same prompts, the same tool access, the same local-first posture. Scriptura pressure-tests Nanocoder on a real interactive workload, the way Sentinel pressure-tests it on a security workload.
- **[Private Inference Proxy](/collective/whitepapers/private-inference-proxy)**, if it lands, is a natural remote provider adapter. A user who needs cloud capability for the hard agent pass but wants audit logging and scrubbing routes Scriptura's remote calls through the proxy rather than directly at a vendor. The provider abstraction is exactly the seam this plugs into.
- **[Sentinel](https://github.com/Nano-Collective/sentinel)** composes the other way: Scriptura could invoke a Sentinel audit pass against the current workspace as a command, surfacing findings as in-editor diagnostics rather than GitHub issues.

This is the long picture from the collective's introduction page expressed as an editor on the same stack: local-first models, a real provider contract anyone can extend, and privacy-preserving paths to external capability when the task genuinely requires it. Scriptura is the editing-shaped instance of the same pattern Nanocoder demonstrates for agents and Sentinel demonstrates for audits.

## v1 scope

A deliberately narrow v1, shipped well.

- **An editor built on the open Scriptura sources.**
  - Scriptura is an editor built from scratch on Qt and Rust, the base already exists and is substantial, and a rewrite is off the table.
- **The provider abstraction with at least two adapters shipped:** a local Ollama/LM Studio adapter and an OpenAI-compatible adapter. Nanocoder wired in as the agent backend.
- **The inline completion loop** against the local provider, with tab-to-accept and latency treated as a primary metric.
- **The chat and inline-edit surfaces** with `@codebase` retrieval through the local context engine.
- **The agent loop** over Nanocoder, proposing diffs the user accepts in place, with command execution scoped to pre-approved commands.
- **The egress log**, local and readable, marking every request as local or remote with its destination. This is a property of the permission-checked network path in the Rust backend, not a standalone feature: every outbound request is authorised and logged in the same place.
- **First-run failure handling for the local provider.** When the local endpoint is unreachable (Ollama not running, model missing), the editor detects it and offers the "install Ollama, here is the one-liner" flow, the settings tab includes a "test connection" action, and failed requests surface in the notification centre instead of vanishing silently. The failure mode the provider question was worried about — silent degradation to a cloud provider — does not exist in the code path; what does need designing is that a user who enables completions without a local model gets told what is wrong and what to do about it.
- **Documentation for writing an adapter**, so the model-agnostic contract is real and extensible, not aspirational.

What v1 ships is "an open editor with the Cursor feel, a real provider contract, and a local-first default that holds." Not a hosted service. Not a model. Not an enterprise control plane.

## What it is not (in v1)
- **Not another rewrite of UI shell** Scriptura is an editor built from scratch on Qt and Rust, the base already exists and is substantial, and a rewrite is off the table.
- **Not a Copilot replacement that phones home.** The default install makes no remote calls. Remote providers are opt-in configuration, never hidden behaviour.
- **Not a model trainer or a model vendor.** Scriptura uses whichever providers the user points it at. The collective does not train or ship an editor-tuned model of its own in v1.
- **Not a from-scratch editor.** It is built on the existing base (scriptura), maintainers should not . A clean-room reimplementation would forfeit that inheritance for no gain.
- **Not a guaranteed-latency product on weak hardware.** Local-first means the feel depends on the local model. On a machine too small to run a completion model, the experience degrades; the project documents the floor rather than hiding it.
- **Not a replacement for terminal agents.** Nanocoder in the terminal still wins for some workflows. Scriptura is the in-editor surface, not the only surface.
- **Not a semantic retrieval product in v1.** The context engine uses lexical and symbol-aware search only. Embedding-based retrieval is a future idea, scoped out of v1 to keep the local-first promise honest and the implementation within reach.

## Alternatives considered

- **Fork Cursor directly.** Impossible: Cursor is closed source. Its value is in the proprietary layer we are precisely trying to replace. No fork path exists.
- **Ship only as a VS Code extension, not a fork.** Already exists, but has less potential for expansion, integration, and customization( restricted by Microsoft's existing frame).
- **Fork VS Code.** Possible, but more performance overhead (although classified as "lightweight" but not friendly toward normal users without extremely good hardware to run alongside with ollama or other local LLM providers) , which is not good for a machine already running a local LLM.
- **Fork IntelliJ IDEA.** Even worst performance (heavy weight) and an even harder tech stack (Java-based), with an even more restricted architecture (forced java-based editor APIs) for expansion compared to VS Code, not favorable at all for local models.

## Resolved in review

These questions were open when the whitepaper was published and were settled during the public review window. They are recorded here as the design history.

1. **Naming.** Settled: **keep Scriptura**. The name fits the collective's Latin noun convention, and there is no meaningful software collision: the npm name `scriptura` is unregistered, and no well-known editor or developer tool carries the name. The nearest namesake is a small web frontend framework under a `scriptura` GitHub org, which is not in the same category and is not widely used. The one real cost is discoverability: a GitHub search for `scriptura` returns 236 repositories, and the top hits are biblical study tools and projects named after "sola scriptura", the theological term; the word skews heavily religious in general search too, so someone looking for the editor will wade through that. That is a soft cost. Against it, the name is already embedded in the repository, the binary, the SDK headers, and the plugin ID namespace (`com.scriptura.*`), and renaming gets more expensive every week; the project will live at `Nano-Collective/scriptura`, so the taken org handle does not matter. Decision: keep it, close the question (recorded against issue #49), and let the project's own results do the search ranking work over time. It is also currently the only open question blocking the repository transfer, which is a lot of friction for a soft cost.
2. **Default provider out of the box.** Settled: **local by default, no remote fallback** — the answer the local-first principle wants, and it is already implemented in the repository. The default configuration in `mainwindow.cpp` reads a local Ollama provider and endpoint (`http://localhost:11434/api/chat`) with a local model (`codellama`), and the feature ships disabled until the user turns it on; there is no remote fallback anywhere in the code path, and no silent degradation to a cloud provider — the exact failure mode the question was worried about. What is genuinely still open is narrower, and it is what issue #50 is circling: the first-run experience when the endpoint is not reachable. Today `requestCompletionInternal` returns silently if the endpoint or model is empty, and `onReplyFinished` drops network errors on the floor without telling the user anything; a user who enables completions without Ollama running gets no ghost text and no explanation. That part is now scoped into v1 (see v1 scope above): detect an unreachable local endpoint and offer the Ollama install one-liner, include a "test connection" action in the settings tab, and surface failed requests in the notification centre rather than letting them vanish.

## Open questions

Questions 1 (naming) and 2 (default provider) were settled during the review window and are recorded above. What remains open:

3. **Plugin system policy.** Reframed during review: the original question pointed at a VS Code extension host that does not exist. Scriptura is a Qt editor shell, not a VS Code fork, so there is no extension host to keep or restrict (covered in more detail in the separate issue about the VS Code premise). The question that is actually live is about the custom plugin system the repository already has, whose plugin IDs sit under `com.scriptura.*`: what surfaces can a plugin touch, how are plugin capabilities and trust scoped, and does the system stay free of the Copilot-style assumptions a VS Code host would inherit? Full access is more compatible, less safe. Unresolved.

## Must-do(s)

Must exist in v1 and after throughout:

- find some contributors, at least **one more core maintainer** (**jason1015-coder alone not practical to do all work**) by a issue in the transferred repo to Nano-collective
- mainwindow.cpp:888 reads settings straight out of QSettings, **MUST CHANGE** to:
  - OS keychain
  - encrypt it (personal key)
- Create Rust<---> typescript communication layer **MUST IMPLEMENT**
- USE **Nanocoder as the backend AI layer**
- **exclude Nanocoder existing TUI**
- UI must **stay C++/QT**
- all backend must route through **RUST BACKEND LAYER, INCLUDE NANOCODER-AI PARTS** (already did, keep this going)
- ai/enabled defaults to false, so a fresh install makes no model calls at all. (already did, keep this going)
- ai/endpoint defaults to http://localhost:11434/api/chat, so the first thing it reaches for is a local model. (already did, keep this going)
- ai/provider defaults to ollama. (already did, keep this going)
- The plugin manifest declares network.access rather than assuming it. (already did, keep this going)
- **TESTING**

## could-do(s)

good-to-have features but not for v1: 
- integrate  with these existing works:
  - **[Private Inference Proxy](/collective/whitepapers/private-inference-proxy)**, if it lands, is a natural remote provider adapter. A user who needs cloud capability for the hard agent pass but wants audit logging and scrubbing routes Scriptura's remote calls through the proxy rather than directly at a vendor. The provider abstraction is exactly the seam this plugs into.
  - **[Sentinel](https://github.com/Nano-Collective/sentinel)** composes the other way: Scriptura could invoke a Sentinel audit pass against the current workspace as a command, surfacing findings as in-editor diagnostics rather than GitHub issues
  - appear on nano-collective website for direct downloading : [webite](https://nanocollective.org) , not strictly needed but makes the project feels even more professional , yet more publicly accessible .

## Next steps

For this whitepaper to graduate into docs:

- [x] Resolve the naming question. Settled: keep Scriptura.
- [ ] Write the provider contract in enough detail that "model-agnostic" is a testable claim, not a slogan.
- [x] Decide the out-of-the-box provider flow for a user with no local model. Settled: local by default, no remote fallback; unreachable-endpoint handling scoped into v1.
- [ ] Settle the plugin system policy (reframed from the extension-host question; the VS Code host premise does not exist).
- [ ] Transfer the repository from `jason1015-coder/scriptura` to `Nano-Collective`, after which the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.


When those are settled, this document becomes the foundation of the project's README and design notes.

This page stays in place after the project ships, as the historical record of how the design was argued.
