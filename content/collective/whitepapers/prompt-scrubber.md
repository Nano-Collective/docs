---
title: "Prompt Scrubber (working title)"
description: "A working whitepaper for a small open source tool that scrubs identifying content from LLM prompts and messages before they leave the user's machine"
sidebar_order: 2
---

# Prompt Scrubber (working title)

When you send a prompt to a cloud LLM, the prompt itself often gives you away. Your name in a question. Your email in a pasted snippet. Your home directory in a stack trace. The path to your private repo. A secret your tool helpfully echoed back. None of these are necessary for the model to do its job. All of them are visible to the provider and persisted in their logs.

This whitepaper proposes a small open source tool that scrubs identifying content out of prompts and messages before they hit any LLM, runs entirely on the user's machine, and follows the shape of `get-md`: independent first, with downstream integrations as natural consumers.

It is a sibling working document to the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper. The proxy addresses identity at the network and key layers. The scrubber addresses identity at the content layer. They compose cleanly; they ship separately.

Naming, exact scope, and stack are open. The document is published in working form so the collective can argue the shape of it before code lands.

## Problem

LLM prompts carry identity in ways the user often does not notice and the provider quietly retains. Common leak surfaces:

1. **Direct identifiers in prose.** Names, emails, phone numbers, addresses written into the prompt by the user.
2. **Filesystem and project context.** Absolute paths, home directories, project slugs, branch names, internal URLs.
3. **Secrets accidentally included.** API keys, tokens, credentials pasted alongside code or config.
4. **Tool call results in agentic settings.** `ls`, `git log`, `cat`, `grep`, and similar tools return identifying output that gets fed straight back into the next LLM turn.
5. **Stylistic and contextual fingerprints.** How a user writes, what they care about, what jargon they use, all build a persistent profile over time.

Items 1 through 4 can be addressed today with disciplined pattern matching. Item 5 is the harder problem and requires model based rewriting, which is a future direction rather than a v1 commitment.

## Principles

- **Privacy-respecting.** The tool exists to keep identifying content on the user's machine. It must not introduce new exposure of its own. No telemetry, no remote rule fetching by default, no opt out logging.
- **Local-first.** The tool runs entirely on the user's hardware. No part of v1 requires network access.
- **Open for all.** Full source open, rule packs published, deployment trivial. Anyone can install, audit, and extend.

## Threat model

What the tool defends against:

- **Cloud LLM providers reading identifying content in prompts and tool results.** Partial defence. Identifying content is reduced, not eliminated.
- **Long term provider profile building from prompt content.** Partial defence. Stable session mappings prevent identifier level correlation across a session but do not address stylistic fingerprints.
- **Accidental secret leakage in prompts.** Strong defence. Pattern based detectors catch the common shapes.

What the tool does not defend against:

- **An adversary on the user's machine.** The scrubber runs locally; if the local environment is compromised, the prompt is too.
- **Semantic leakage.** A question that is inherently identifying (your private codebase, a niche bug only you have) cannot be made anonymous by stripping identifiers.
- **Style fingerprinting.** The v1 brute force approach does not rewrite style. The way you phrase things still goes out.
- **Anything at the network or key layer.** That is the proxy's job.

## Scope

A deliberately narrow scope, shipped well.

- One input: a prompt string or a message (system, user, assistant, tool result, etc.).
- One primary output: the scrubbed version, semantically equivalent for LLM consumption.
- One auxiliary output: a reverse mapping from placeholder to original, so responses can be rehydrated where needed.
- Pluggable detectors. A default set ships in the box; users and rule packs can extend with project specific rules.
- Both a CLI and a library API in the same package, mirroring the rest of the Nano Collective utility shaped projects.

## v1: brute force first

The strong technical answer to prompt anonymisation is a small local model that rewrites style while preserving intent. That is phase 2 work, not v1. Pulling a candidate model off Hugging Face (the same pattern `get-md` uses), evaluating it, and integrating it as a swappable backend is a few weeks of follow up, with a clean path for users to point the tool at their own local model. Treating the model as a v1 dependency would slow the first release unnecessarily.

The brute force answer ships now. Regex, well maintained heuristics, and a curated set of detectors cover the obvious identity leaks:

- Email addresses, phone numbers, postal addresses.
- Names. Proper noun detection with a sensible cutoff, with stricter opt in modes.
- File paths and project identifiers. Absolute paths, home directory references, project slugs.
- Secrets and credentials. API keys, tokens, common credential shapes.
- URLs, especially internal ones. Private repos, internal tools, dev environments.
- Code specific tells. Private class names, internal variable conventions where the user opts in.

This is unglamorous, but it ships, it runs fast, and it materially reduces the most embarrassing forms of identity leakage. v1 does not need to solve the style transfer problem. It needs to stop a prompt from quoting your name, your email, your repo path, and your internal API token in plaintext to a third party.

Take `get-md` as the reference posture: fast, lightweight, optimised for LLM consumption. The scrubber should feel the same way. Blunt, focused, useful from the first install.

## What it is not (in v1)

- Not a model based rewriter. That is a future option, parked deliberately rather than vaguely promised.
- Not a proxy. It does not make network calls. It does not handle API keys. It does not route requests.
- Not a router or model picker. It does not decide where the prompt goes after scrubbing.
- Not a moderation tool. It is not trying to catch harmful content. It is trying to catch identifying content.

`get-md` style restraint applied to prompt privacy: do one thing well.

## API shape

The CLI and the library expose the same primitives. Roughly:

- **scrub a message.** Input: a message and (optionally) a session id. Output: the scrubbed message and the updated mapping.
- **rehydrate a response.** Input: a model output and the session mapping. Output: the response with placeholders swapped back to original values.
- **inspect.** Show what the scrubber would change without committing to a transformation. Useful for debugging and for tuning rule sets.

The API is message based rather than prompt based. That is what makes it work in agentic settings.

## Designed for agentic use

The scrubber follows the `get-md` pattern: an independent project with its own CLI, library API, and release cadence. Downstream tools (Nanocoder being the obvious example) consume it as a normal dependency. The standalone usage and the integrated usage are equally valid.

Agentic consumers, however, shape the v1 API more than one shot CLI usage does. Three things to get right from v1:

**Tool call results are a major leak surface.** Agentic tools execute tool calls locally and feed the results back into the next LLM turn. `ls` exposes home directories. `git log` exposes names and emails. `cat config.json` exposes credentials. `grep -r` exposes private file paths. The scrubber must operate on tool results, not just on user supplied prompts. Every message that flows to the LLM passes through the scrubber regardless of origin.

**Long prompts demand session scoped mappings and performance discipline.** Agentic prompts can be tens of thousands of tokens (system prompt, tool definitions, accumulated history). Two implications:

- *Stable mappings across turns.* If the user's name is replaced with `Person_A` on turn 1, it must be replaced with `Person_A` on every subsequent turn, otherwise the model loses coherence. The reverse mapping is session scoped, persisted for the life of the conversation, not regenerated per call.
- *Performance.* Pattern matching over very long contexts has to be cheap enough not to dominate latency. Compiled detectors, small per rule cost, possibly incremental scanning over the diff between turns. Worth measuring early rather than assuming.

**Provider prompt caching has to be considered.** Several providers cache long fixed prefixes (system prompt, tool definitions) for cheaper repeated calls. Scrubbing a prefix once and reusing the same scrubbed text preserves cache hits. Scrubbing fresh each turn destroys them. The scrubber should be cache aware so privacy does not silently cost the user real money.

These are not polish items. They are the difference between a tool that works in agentic settings and one that only works for isolated one shot prompts.

## Composition

The scrubber stands alone, and it composes:

- **In front of a direct LLM call.** The user runs the scrubber locally, sends the cleaned prompt to OpenAI, Anthropic, or anyone else, and rehydrates the response. NC is not in the path at all.
- **In front of the Private Inference Proxy.** The scrubber runs first; the proxy then handles the network and key layer. Even the proxy sees scrubbed content, not just the provider.
- **As a library inside Nanocoder or any other tool that talks to LLMs.** The scrubber becomes a shared dependency rather than per project reinvention. A one toggle integration is the design goal.

## Open risks

1. **The strong form depends on a model that lives outside the project.** Brute force v1 ships now and covers the obvious leaks. The model based rewriter that addresses stylistic fingerprinting is phase 2: identify a fit for purpose model on Hugging Face (the `get-md` pattern), evaluate it, integrate it as a swappable backend, ship. Users can also point the tool at their own local model. The residual risk is not that this is years of work, it is that no off the shelf model proves good enough in evaluation and the project has to fine tune one. Manageable, not existential.
2. **False positives and false negatives.** Aggressive detectors that strip too much make prompts useless to the model. Permissive detectors miss real leaks. The defaults need careful tuning, and users need a way to inspect and override.
3. **Performance on long contexts.** Untested. If naive regex passes do not scale to 100k token contexts within the latency budget agentic tools need, the v1 architecture has to design for incremental scanning from the start.
4. **The "70% not 100%" framing.** Users may read about the tool and assume it makes them anonymous. It does not. The docs and any marketing have to land that distinction clearly, or the project causes harm by selling false reassurance.

## Open questions

1. **Naming.** Something in the `get-md` / `json-up` shape. Candidates worth arguing rather than picked yet.
2. **Language and stack.** TypeScript by default; case for Rust or Go if performance becomes a real constraint at scale or if it ends up embedded in tools that are not JS based.
3. **Default rule set.** Which detectors ship in the box, which require opt in, and how strict the defaults are.
4. **Rule pack distribution.** Whether community rule packs ship as separate packages, are bundled, or both.
5. **Response rehydration UX.** Per call return of the mapping, or session scoped storage? Where does the mapping live (in memory, on disk, both)? How does the CLI expose it for one shot use?
6. **Detector confidence levels.** Whether detectors return a confidence score so consumers can apply different policies (strip vs flag vs ignore) per confidence band.
7. **Relationship to the proxy.** Even as separate projects, the scrubber and the proxy need to version cleanly when used in combination.
8. **Phase 2: model based rewriting.** Which existing Hugging Face model is fit for purpose for paraphrasing and style stripping (candidates include paraphrase tuned T5 variants, small Llama or Phi models, dedicated anonymisation models, and others worth surveying)? What is the evaluation method? What is the default ship choice, and what is the user override path (Ollama, llama.cpp, MLX, or anything else local)?

## Next steps

For this whitepaper to graduate into docs:

- [ ] Resolve naming.
- [ ] Lock the v1 scope: detector categories, opt in vs default, performance targets.
- [ ] Pick the stack.
- [ ] Sketch the API shape so a consumer (Nanocoder, the proxy, a one shot CLI user) can integrate with a single toggle.
- [ ] Decide whether this ships before, alongside, or after the proxy.
- [ ] Confirm at least one committed maintainer.

When those are settled, this document becomes the foundation of the project's README and design notes. The repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

## Relationship to the Private Inference Proxy

This project and the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) are sibling efforts. They started as one project, with the scrubber as "Mode C" of the proxy design. As the scoping firmed up, the scrubber outgrew that framing:

- Different deployment model (local library vs network service).
- Different threat model (content layer vs network and key layer).
- Different ship constraints (no commercial layer, no provider relationships, no entity question).
- Many more potential callers than the proxy alone.

Treating them as siblings rather than as one project lets the scrubber ship on its own timeline (probably first), and lets the proxy work proceed without the scrubber gating any of its milestones.

The two are designed to compose. A user running both, with payment privacy configured on the proxy, gets the strongest privacy stack the collective is offering. A user running only the scrubber still gets meaningful content layer protection. A user running only the proxy still gets meaningful network and key layer protection.
