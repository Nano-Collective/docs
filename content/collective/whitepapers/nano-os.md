---
title: "NanoOS (working title)"
description: "A working whitepaper for an open source agent orchestration CLI that lets a user compose an oracle agent, specialist sub-agents, skill packs, and custom tools into a personal operating system of agents"
sidebar_order: 3
---

# NanoOS (working title)

Most people who work with AI today still treat it as a single chat window. One model, one context, one conversation at a time. The interesting work is happening one layer up, where multiple agents coordinate, delegate, and call tools on a user's behalf. That layer is real, it is moving fast, and it is currently owned by a small number of closed platforms and bespoke frameworks.

This whitepaper proposes a project to build that layer in the open: a local-first CLI that lets a user stand up an oracle agent, attach specialist sub-agents and custom tools to it, and grow that arrangement, over time, into something that runs across their personal and working life.

The "OS" framing is deliberate. The point is not to write a literal operating system. The point is to give a user the same kind of compositional substrate for agents that an operating system gives for processes: a place to run them, a way to address them, a permission model, a shared notion of memory, and a contract for how new ones plug in.

The document is published in working form so the collective can argue the shape of it before code lands. Naming, scope, and design decisions below are open.

## Problem

The agent layer is where the next round of useful work happens, and it is currently shaped by tools whose incentives are not the user's.

A user who wants more than a single chat today has a small set of options:

1. **Closed platforms with proprietary agent layers.** Custom GPTs, Claude Projects, vendor specific agent runners. The platform owns the orchestration, the memory, the tool layer, and the data. The user is a tenant.
2. **Heavyweight frameworks aimed at developers.** LangGraph, CrewAI, AutoGen, and similar. Powerful, but the audience is people building agent products for other people, not people running agents for themselves. The setup cost is high and the abstractions assume a developer's mental model.
3. **Per project agent scripts.** Glue code, shell pipelines, hand rolled prompts. Works for one task, does not compose, does not survive a refactor.

None of these gives an individual a stable, composable place to live their agent workflows in. There is no shared substrate where a user can say "here is my oracle, here are the specialists it can call, here are the tools each of them is allowed to use, and here is what I want them to remember across all of it." That gap is what this project exists to close.

The need is sharper for the kind of users the Nano Collective already builds for. Someone running a local coding agent, a handful of utilities for cleaning and shaping content, and a local model via Ollama or LM Studio already has the components of an agent stack on their machine. What they are missing is the substrate that ties those components together without locking them into someone else's platform.

## Intended audience (open)

The audience question, as in the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper, comes before scope.

Candidates, with honest assessment of each:

- **Power users who want personal automation.** People who already use AI heavily and want it to compose: an email triage agent that hands off to a calendar agent that hands off to a drafting agent. Realistic primary audience. Existing tools serve them badly because the tools are built for app developers, not for them.
- **Developers building multi agent products.** Already served by LangGraph and similar. NanoOS would have to win on local-first, openness, and ergonomics, not on capability ceiling. Possible secondary audience, not the right primary.
- **Teams running shared internal automations.** Wants role based access, audit trails, deployment to shared infrastructure. Out of scope for v1 by a wide margin, but a plausible direction if the single user shape lands first.
- **Researchers building agent topologies for evaluation.** A clean, scriptable substrate has real value here. Small audience, but technically aligned with the project's shape. Likely a downstream consumer rather than a target.

Picking the audience changes the v1 surface area. A power user runner needs ergonomic install, clear defaults, and a few specialist sub-agents that work out of the box. A developer framework needs a wider API and a less opinionated default set. v1 cannot do both well.

## Principles

The three values that govern every Nano Collective project apply, with two carrying particular weight for this project:

- **Privacy-respecting.** The oracle and its sub-agents see whatever the user routes through them: messages, files, tool results, intermediate state. That data must stay on the user's machine by default, and the project must be honest about every point at which a sub-agent or tool sends anything outward.
- **Local-first.** Agent orchestration is one of the workloads where the temptation to reach for a cloud model is strongest, because the orchestrator often does the most "reasoning" of any component. The project must make local models a first class path, not a degraded fallback. Cloud calls are allowed where capability requires, and should compose with the sibling privacy projects when used.
- **Open for all.** Full source open. The orchestration protocol, the sub-agent contract, the tool contract, all documented. Anyone can write a sub-agent or a tool that plugs in. Anyone can replace the oracle with their own.

A fourth principle, specific to this project, is worth naming:

- **Composable, not monolithic.** NanoOS is a substrate, not an everything app. Sub-agents are independent projects. Skills are independent capability packs. Tools are independent projects. NanoOS earns its place by orchestrating well, not by absorbing the rest of the stack. Contributed pieces meet at the substrate's contracts (sub-agent, skill, tool) and compose without per project coordination.

## Threat model (open)

An agent substrate is a privacy surface in its own right. Naming what it does and does not defend against, to be argued:

**The user's data leaking to cloud models via sub-agents.**
Out of scope for the substrate itself. Mitigated by routing relevant sub-agents through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) and the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber). NanoOS does not duplicate their work; it makes their use clean.

**A malicious or buggy sub-agent reading more than it should.**
In scope. The permission model has to be real, not advisory. A sub-agent that needs filesystem access should declare it; the oracle should mediate it; the user should see what was read. See "Permissions and capabilities" below.

**A malicious or buggy tool exfiltrating data.**
In scope. Tools run with declared scopes (network, filesystem, secrets, model access). A tool that asks for more than its declared scope cannot run.

**A compromised oracle.**
Partial. If the oracle process is itself compromised, everything downstream is too. The same caveat applies to any OS kernel. Hardening the oracle process and keeping its surface small is the answer; we do not pretend the substrate can defend against arbitrary local malware.

**A network observer reading agent traffic.**
Out of scope for the substrate. The proxy already handles this for the cloud leg. Intra agent traffic stays on the user's machine in v1.

**A state level adversary with legal compulsion over a sub-agent author.**
Not a goal of v1. Worth naming as out of scope until proven otherwise.

The threat model lives alongside the project once it ships and evolves as the design firms up.

## Proposed approach

Four primitives. Everything else composes out of them.

### The oracle

The oracle is the top level agent in a NanoOS arrangement. The user speaks to it. It holds the conversation, the working memory, and the routing logic. When a request comes in, the oracle decides: do I answer this directly, or do I hand it off to a sub-agent that is better placed to do so?

The oracle is configurable in four places:

- **Model.** Multi-provider by design, on the same shape the collective's existing tools already ship. Any chat completion compatible model the user can reach: local runtimes (Ollama, LM Studio, llama.cpp, MLX) and cloud providers (OpenAI, Anthropic, OpenRouter, others) sit behind a pluggable adapter. Local is the default, but the project is under no illusion that local quality on common consumer hardware is sufficient for every oracle workflow today. Cloud is a first class path, not a hidden one, and users should expect to reach for it where the work genuinely demands it. The proxy and scrubber compose cleanly on the cloud path.
- **Sub-agents.** A declared list of specialist agents the oracle is allowed to call, with a description of what each does. The description is what the oracle reads when deciding whether to delegate.
- **Skills.** A declared list of skills the oracle has access to. Each skill is a capability pack (see below) that adds a group of tools to the oracle's toolkit in one line, instead of the oracle having to name every tool individually. Skills are the unit of capability reuse across an arrangement.
- **Tools.** A declared list of bare tools the oracle can call directly, separately from any skill or sub-agent. Used for short, local, single step actions that do not warrant invoking a whole sub-agent and are not naturally grouped with anything else.

The oracle is intentionally thin. It is a router, a conversation owner, and a memory holder, not a do everything agent. The interesting capability lives in the sub-agents, the skills, and the tools, not in the oracle's prompt.

### Sub-agents

A sub-agent is anything that satisfies the sub-agent contract: it accepts a structured request, it does work, it returns a structured response, and it declares what skills, tools, and resources it needs to do its job. The skills and tools fields work the same way they do for the oracle. A sub-agent that lists `skills: [k8s, observability]` and `tools: [some_one_off]` runs with the union of those skills' tool sets plus the named tool.

A sub-agent can be:

- **A bundled NanoOS sub-agent.** Default specialists shipped with the project (an email drafter, a calendar manager, a file organiser; final list is an open question, not a commitment).
- **An existing agent the user already runs.** Any standalone agent (a coding agent, a writing assistant, anything that satisfies the contract) can be wrapped as a sub-agent and delegated to from the oracle.
- **A third party agent.** Anything that conforms to the contract. The contract is small enough that wrapping an existing agent is a thin shim, not a port.
- **Another NanoOS instance.** A sub-agent can itself be an oracle with its own sub-agents under it. Recursive composition is a first class shape, not an accident. A user might run a "work" oracle and a "personal" oracle and have a top level oracle delegate to either.

Recursion is the part of the design that earns the "OS" framing. A user does not have to flatten their mental model of their work into a single agent's prompt. They can mirror the structure of their life: an oracle for personal admin, sub-agents under it for finance, calendar, household; an oracle for work, sub-agents under it for coding, comms, research; a top level oracle that knows which side of life a request belongs to. Each layer is a NanoOS arrangement. The substrate is the same all the way down.

The depth has to be bounded in practice. Cost and latency both compound with recursion. Sensible defaults (warnings past a depth, hard caps configurable per arrangement) are part of the v1 surface, not a polish item.

### Tools

A tool is a single purpose action with a declared input shape, output shape, and capability scope. Tools are the leaves of the call tree.

Tools are intentionally not agents. A tool does not have a model. A tool runs a function. Examples in scope for the default toolkit, all to be argued:

- File read and write within a declared root.
- HTTP fetch through the privacy stack where configured.
- Shell command execution with an allowlist.
- Calendar, email, and similar OS level integrations (where the user opts in).
- Calls to other Nano Collective utilities (get-md, json-up) where they fit the tool shape.

The tool contract is small enough that any user can write one. Tool authors declare what their tool needs (network, filesystem paths, environment variables); the user grants or denies; the oracle and sub-agents see only the tools the user has granted to them.

### Skills

A skill is a reusable capability pack: a set of tools grouped together by purpose, behind one manifest. A skill has no identity of its own. It is not an agent. It is a unit of capability that an oracle or a sub-agent attaches to itself in one line.

Concretely, a skill bundles:

- A set of tools that belong together. A `k8s` skill might ship `k8s_pods`, `k8s_logs`, and `k8s_describe`. A `content-tools` skill might ship a drafting tool, a content calendar tool, and a posting tool.
- A short description so an agent knows what the skill is for.
- Optionally, a slash command or two that compose with the tools.
- Optionally, an event subscription that lets a tool in the skill respond to runtime events directly without an agent in the loop.

An oracle or a sub-agent declares the skills it has access to by name (`skills: [k8s, observability, incident-response]`). At execution time, the agent's effective tool list is the union of every tool from every skill it lists, plus any bare tools it has named individually. The same skill attaches to many agents. One agent composes many skills. That orthogonality is what makes the arrangement scale.

The reason this matters is that a single user agent in a real arrangement can need fifteen or twenty tools across three or four logical groups. Listing each tool by name on the agent flattens that structure into a wall of names. Listing skills preserves it. The CMO sub-agent says `skills: [content-tools]`, not a list of every drafting and scheduling tool it depends on.

Why not collapse skills into sub-agents? Because a sub-agent is an identity (a system prompt, a model, a job) and a skill is a capability (a set of tools). Different sub-agents reuse the same skill. One skill should not be welded to one sub-agent's identity. Keeping them orthogonal is what lets the CMO and the CEO both attach the same `content-tools` skill without each redefining what is inside it.

A skill is also the natural unit for sharing. The bundle is a directory plus a manifest; "install a skill" is a `cp -r` into the user's config and a manifest validation, nothing more. A community catalogue, when one exists, is a packaging problem on top of an existing format.

### The execution model

A request flows like this:

1. The user sends a message to the oracle.
2. The oracle reasons over its sub-agent list and its tool list. It either answers directly, calls a tool, or invokes a sub-agent with a structured request.
3. A sub-agent, once invoked, runs its own loop: its own model, its own tool list, its own sub-agents if recursion is in play. It returns a structured response to the oracle.
4. The oracle integrates the response into the conversation and either replies to the user or continues delegating.

This is not novel. The novel parts are the locality, the openness, and the composability. The substrate is the same whether the oracle and all sub-agents are local Llama variants, or a mix of local and cloud, or a recursive tree where some branches are local only and others reach out through the proxy.

### Memory and state

A NanoOS arrangement needs memory in several shapes:

- **Conversation memory.** The oracle holds the current conversation. Per arrangement, persisted locally between runs.
- **Per agent memory.** A sub-agent that runs repeatedly across sessions (a coding agent, an email triager) needs its own memory for the things it learns about the user's preferences, projects, contacts. This is the shape Claude Code's `CLAUDE.md` and similar files already hint at; NanoOS should make it first class.
- **Shared memory, scoped.** Some facts (the user's name, time zone, preferred language) are useful across the whole arrangement. A shared memory layer that the oracle owns and sub-agents read from, with explicit scope, is the natural shape. Writes from sub-agents should be mediated and reviewable.

Memory lives on disk in plain, inspectable files. The user can read it, edit it, delete it, version control it. A privacy substrate that hides what it remembers about its user would be a contradiction.

### Permissions and capabilities

Sub-agents and tools declare what they need; the user grants what they get. The grant is scoped to an arrangement, persisted, and revocable. Two patterns under consideration:

- **Declared capabilities at registration time.** A sub-agent declares "I need filesystem read on `~/Documents/work` and network access through the proxy." The user accepts on first registration and the grant is remembered.
- **Just in time prompts for sensitive actions.** Anything that touches secrets, modifies state outside a sandbox, or sends data outward triggers a prompt unless explicitly pre-approved by the user.

The right v1 balance is closer to declared at registration with a short, well chosen list of actions that always prompt regardless. Permissions that prompt on every action quickly train the user to click through. Permissions that never prompt train the user to assume nothing is happening. The middle path is the design problem.

## A worked example: a business team

The shape of the design lands better against a concrete arrangement than against the abstract primitives alone. The example below is a single user running a small SaaS who wants the substrate to mirror how they would think about staffing a team if the team were people.

### The arrangement

The user runs a top level oracle. Through conversation, they describe what they are trying to do (launch and run a SaaS), and over time the oracle helps them register the sub-agents and tools that arrangement needs. The state the user ends up with looks roughly like this:

- **Oracle.** The user's entry point. Local model by default. Holds shared memory about the business: the product, the brand voice, the current priorities. Skills attached: `personal-admin` (calendar, inbox triage, file read on the business folder).
- **CEO sub-agent.** Itself a NanoOS instance, so it has its own oracle, its own sub-agents, and its own skills and tools. The oracle delegates anything that reads as a business decision or a multi function task to the CEO. Skills attached: `business-strategy` (planning frameworks, decision logs, OKR tracking).
  - **CMO sub-agent.** A flat sub-agent under the CEO. No further delegation. Skills attached: `content-tools` (drafting, content calendar, posting for whichever channels the user has connected). Bare tools: `get-md` for reading competitor pages and source material.
  - **CTO sub-agent.** A coding sub-agent, registered against the project repository. Skills attached: `code-review`, `test-runner`, `deploy`. Scoped to the SaaS's working directory. If the coding agent is itself an orchestrator (with its own internal delegation), this branch becomes recursive without the user having had to design that recursion themselves.
- **Skills installed but not yet attached.** A growing local catalogue of capability packs the user has installed (`k8s`, `observability`, `customer-research`, others). They sit available; the user attaches them to whichever agent needs them when the need lands.

Each layer has its own memory. The oracle remembers the brand voice and the user's preferences. The CEO remembers strategic context (current quarter goals, open initiatives). The CMO remembers the content calendar and the channels' posting rules. The CTO remembers the codebase. Shared memory (the user's name, the product name, the time zone) is held by the top level oracle and read by anyone below who has been granted access.

Each layer also has its own skills. Skills are not memory; they are the capability shape an agent carries. The CMO does not learn its skills over time. Its skills are declared once on its definition, and they change only when the user attaches or removes one. That separation, capability via skills, history via memory, is what keeps the arrangement legible as it grows.

### A request flowing through it

The user types into the oracle: "We need a launch announcement for the new pricing tier by Friday."

1. The oracle reads the request. It is a multi function business task with a deadline. The oracle delegates to the **CEO**.
2. The CEO decomposes: the announcement needs marketing copy and a check that the pricing page in the app actually reflects the new tier. It delegates the copy to the **CMO** and the pricing page check to the **CTO**.
3. The CMO drafts the copy using its drafting tool, pulls competitor framing through get-md, and schedules a draft post in the content calendar tool. Returns the draft and the scheduled time to the CEO.
4. The CTO opens the repository, finds the pricing page component, confirms the new tier is wired up, runs the relevant tests, and returns a status to the CEO. Internally, the CTO may have delegated to its own sub-agents to do the file reads and the test run; the CEO does not see or need to see that.
5. The CEO integrates both responses, notices that the pricing page is missing one feature bullet for the new tier, asks the CTO to add it (a second round trip), and then returns a consolidated status to the oracle.
6. The oracle replies to the user with the draft copy, the scheduled time, and a one line note about the pricing page fix.

The user wrote one sentence. Several agents (oracle, CEO, CMO, CTO, and any internal sub-agents the CTO delegated to) and a handful of tools did the work. The user can inspect any layer of that call tree, read the memory each agent wrote, revoke a tool, swap a model, or fire a sub-agent and replace it without rewriting the rest of the arrangement.

### Why this shape is the point

A flat agent with a huge prompt could be coached to do most of this. A bespoke script could automate the specific announcement workflow. Neither survives contact with the next request. The CEO that handles "we need a launch announcement" should also handle "we need to decide whether to raise prices" and "the team is hitting a deadline crunch, what should we cut." The CMO that drafts the announcement should also draft the next one, and the next. The arrangement is a thing the user maintains, not a script they rewrite per task.

This is the part of the design that earns the OS framing. The user is not chaining prompts. They are populating an organisation of agents that they can think about the way they would think about a team, that they own, that runs on their machine, and that grows the way their work grows.

The arrangement is also a test of the project's principles. Every model call can be local. Every tool runs under a declared scope. Every memory file is on disk and readable. The cloud only enters the picture for the calls that genuinely need cloud capability, and when it does it goes through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) with the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) in front of it. The business team example works at every privacy posture the user wants to take, from "everything local" to "selectively cloud, scrubbed and proxied."

## v1 scope

A deliberately narrow v1, shipped well.

- **A CLI.** Single binary install. Run `nanos` (or whatever the final name is); land in an oracle session. No GUI, no daemon, no server in v1.
- **One oracle, configurable.** Local model by default. Cloud models supported with explicit configuration.
- **A small default sub-agent set.** Probably two or three, picked for being broadly useful and tractable to ship. Specific candidates to be argued.
- **Skills as a first class primitive.** A skill is a directory plus a manifest. The oracle and sub-agents attach skills by name. A small default skill set ships in the box; a user installed skill is a `cp -r` away.
- **A small default toolkit.** Filesystem within a declared root, shell with allowlist, HTTP fetch through the privacy stack where configured. Possibly get-md as a tool. Bare tools, not bundled into skills, are for one off names that do not belong with anything else.
- **Plain file based memory.** Conversation history on disk. Per agent memory in declared paths. No database.
- **The sub-agent, skill, and tool contracts published as a stable v1.** Third parties can build against them from day one.

What v1 ships is "an oracle, a small set of competent specialists, a small set of capability packs, a small set of useful tools, a clear contract for adding more." Not a complete agent OS. The starting point that grows.

## What it is not (in v1)

- **Not a hosted service.** No NanoOS cloud, no remote oracle. If the project ever has a hosted component, it is later and explicit.
- **Not a literal operating system.** No kernel, no scheduler in the OS sense, no process model below the agent abstraction. The "OS" word is a metaphor for compositional substrate, not a promise of a kernel.
- **Not a chat UI.** A CLI is the v1 surface. UIs may come later or may be downstream consumers of the substrate.
- **Not a multi user platform.** Single user, single machine. Team workflows are out of scope until single user lands well.
- **Not a model.** NanoOS uses whichever models the user configures. It is not training, fine tuning, or shipping a model of its own.
- **Not a replacement for any existing agent.** Existing agents (coding agents, writing tools, anything else the user already runs) become sub-agents under NanoOS, not absorbed into it. They ship independently.
- **Not a moderation, safety, or alignment layer.** Out of scope. The substrate is neutral about what the user wants their agents to do; the permissions model is about preventing accidental harm, not about policing intent.

## Composition with other collective projects

Most collective projects compose with this substrate through the generic contracts (sub-agent, skill, tool). A few have a more specific integration shape worth naming:

- **The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber)** runs as middleware on any sub-agent that talks to a model. Scrubbed prompts go out; rehydrated responses come back. The oracle does not have to know.
- **The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy)** is the configured network path for cloud model calls. A sub-agent that uses a cloud model talks to the proxy, not directly to the provider.
- **Nanotune** is upstream of the model layer rather than a runtime component. Models fine tuned through Nanotune are first class oracles or sub-agent backbones.

This is the long picture from the collective's introduction page expressed as a product: local-first models at the core, specialist sub-agents and tools any contributor can build, and privacy preserving paths to external capability when the task genuinely requires it. NanoOS is the layer that makes the rest of the stack feel like one stack.

## Alternatives considered

- **A library, not a CLI.** A library only release moves the integration cost onto the user. The CLI is the demonstration that the substrate is real, the entry point for non developer users, and a forcing function for ergonomic defaults. A library API is part of the project; a library only release is not.
- **A web app or desktop GUI as the v1 surface.** Bigger surface area, slower iteration, harder to keep local-first honest. CLI first is the right shape for the audience and for the collective's existing posture. A GUI is a plausible downstream project.
- **Absorbing sub-agents into a single agent runtime.** Smaller bundle, simpler install. Loses everything that makes the project interesting. Independent sub-agents with a contract is the whole point.
- **Building on top of an existing framework (LangGraph, CrewAI, AutoGen, MCP runners).** Each is worth a serious look during scoping, especially the [Model Context Protocol](https://modelcontextprotocol.io/) for the tool layer; reusing a well designed contract there beats reinventing one. The substrate as a whole, however, is shaped by privacy and locality concerns those frameworks do not prioritise. The default answer is to compose with what fits and write the rest, not to bend the project to an existing runtime.
- **Skip the recursive composition.** Flat oracle plus sub-agents is simpler. Drops the part of the design that earns the OS framing and the part that lets users mirror the structure of their own life into the system. Worth arguing whether recursion is in v1 or a phase 2 milestone.

## Open risks

These are the concerns that could kill the project or force it into a different shape.

1. **Latency and cost compound with depth.** A recursive arrangement with cloud models at multiple layers can produce a single user turn that fans out to dozens of model calls. Local models help on cost; they do not help on latency at depth. If the design does not produce useful work at usable speeds for the audience's hardware, the recursive shape is decoration. v1 has to measure this honestly on representative hardware, not assert it works.

2. **The default sub-agents are a make or break for the install experience.** A user who installs NanoOS and finds an empty oracle has nothing. The default sub-agent set has to demonstrate real value on first run. Picking the wrong defaults, or shipping them at the wrong level of polish, is the most likely path to the project landing flat.

3. **The permissions model is a real product surface, not a feature.** Get it too loose, and a buggy sub-agent reads things it should not. Get it too strict, and the user clicks through every prompt until they stop reading them. Get it confusing, and the user opts out of the model and the project's privacy story collapses. This is design work, not implementation work.

4. **Substrate projects are hard to land.** A tool that does one thing well is easy to evaluate. A substrate that "lets you build anything" is easy to dismiss as vague. The project must ship with concrete, complete user journeys (one oracle, three sub-agents, five tools, a clear story for each) or it reads as a framework looking for a user.

5. **The OS metaphor can mislead.** Some readers will hear "OS" and expect a kernel, a process scheduler, or a Linux replacement. The naming has to either lean into the metaphor with enough explanation that confusion is rare, or pick a different name. Either path is fine; ambiguity is not.

6. **Sub-agent interoperability could fracture quickly.** If every NanoOS user writes their own sub-agent contract variations, the ecosystem fragments and the substrate value disappears. The contract has to be small, stable, well documented, and defended against drift in the first year.

7. **Provider terms and tool side effects.** Sub-agents that drive third party services (email, calendar, payments) have terms of service of their own. The project does not control whether a user's email provider permits agentic access; it does control whether the documentation is honest about that. If it is not, users will find out the hard way.

## Open questions

These are the questions the whitepaper exists to argue.

1. **Naming.** "NanoOS" is the working title. It has the right scope but invites confusion with literal operating systems. Alternatives in the "Nano" prefixed family or the lowercase hyphenated utility family are worth proposing.
2. **Audience for v1.** Power users running personal automations, or developers building multi agent products? The two read the docs differently and want different defaults.
3. **Default sub-agent set.** What ships in the box. Candidates: a coding agent integration, a research / web reading agent, an inbox / triage agent, a calendar agent, a file organiser. The right v1 list is probably two or three, not all of them.
4. **Default tool set.** Same question for tools. The bias is toward fewer, well scoped, well documented tools.
5. **Tool contract: roll our own, adopt MCP, or align with an existing format.** Multiple candidates. MCP brings free interoperability with a growing external ecosystem but inherits decisions the collective did not make. Rolling our own gives full control at the cost of being yet another contract in the world. Aligning with a format another collective project is already shipping (e.g., a markdown tool format) would mean a single artifact format usable across projects, at the cost of coupling our pace to theirs. The options are not mutually exclusive (MCP could be the wire format under any authoring experience), and the right answer is probably a composition. A clean evaluation against privacy, locality, and the substrate's own design pressure is required before v1.
6. **Sub-agent contract.** Whether to define our own, lean on an existing protocol, or compose (MCP for tools, our own for sub-agents). Stability of the contract matters more than its elegance.
7. **Skill contract.** A skill is a manifest plus a directory of tools and optionally commands. The exact manifest fields, naming rules, scoping semantics, and event subscription shape are open. Worth designing in their own right rather than borrowing wholesale from any other project. Cross project alignment with whatever shape other tools end up shipping is a nice to have, not a requirement.
8. **Skill scoping and sharing.** A skill installed once should be attachable to any agent in the user's arrangement. Open: where installed skills live on disk, whether the loader scopes them by arrangement (personal vs work), and what the install flow looks like in v1 (a `cp -r` is the floor; a community catalogue is the ceiling).
9. **Recursion in v1.** Flat (oracle plus sub-agents) is simpler and ships sooner. Recursive (sub-agents that are themselves NanoOS instances) is the design's centre of gravity. Whether to ship recursion in v1 or as phase 2 is open.
10. **Memory model.** Plain files is the right shape. Open questions: what schema, what scoping rules between agents, how shared memory is mediated, how the user inspects and edits it.
11. **Permissions UX.** Where the slider sits between "declared at registration" and "prompt at use." The honest answer is "both, in carefully chosen places"; the design is in which actions sit where. Skills add a wrinkle: a skill is granted at attachment time, not per tool, which suggests the permission unit at the manifest level is the skill, not the individual tool inside it. Worth arguing.
12. **Configuration shape.** A single config file describing the arrangement (oracle model, sub-agents, skills, tools, memory paths) is the default. Whether to support multiple named arrangements per machine (personal / work / research) in v1 or later.
13. **State portability.** Whether an arrangement is portable between machines. The on disk state is plain files, so it is portable in principle; whether the project provides explicit import / export is a separate question.
14. **Cloud model defaults.** The local-first principle says local by default. The realistic concern is that local model quality at common consumer hardware specs is not yet enough for the oracle role in all workflows. Whether the project ships with a recommended local model floor, a recommended fallback, or neither, is open.
15. **Headless and scheduled use.** A user who wants the email triage agent to run on a cron does not want to start a CLI session every time. Whether v1 supports a headless or scheduled mode, or parks it for phase 2, is open.
16. **Observability and debugging.** A recursive call tree is hard to debug when something goes wrong. What v1 ships for tracing, replay, and per turn inspection is part of the user experience, not a power user feature.
17. **Bundled integrations.** Whether NanoOS ships with any sub-agents pre wired (a coding agent, an inbox triage agent, etc.) or expects the user to install them separately is an ergonomics question with real stakes. The substrate works either way; the install experience does not.
18. **Stack.** TypeScript follows the rest of the collective. A case for Rust or Go exists if the substrate ends up doing real work in the hot path. Default is TS unless argued otherwise.
19. **Arrangements as packageable artifacts.** If skills, tools, and sub-agents are portable files that meet at a shared contract, then a whole arrangement (oracle config plus its sub-agent set plus its skill set plus any shared memory seeds) is also a portable artifact. The "business team" worked example could ship as a template a user clones, edits, and runs, rather than as a bespoke setup they assemble by hand. Whether arrangement packaging is a v1 surface, a phase 2 milestone, or something the format simply does not foreclose, is open. The v1 design should at least avoid making this harder later.

## Next steps

For this whitepaper to graduate into docs:

- [ ] Pick the intended audience for v1. Everything else follows.
- [ ] Resolve the naming question.
- [ ] Evaluate MCP for the tool contract; decide adopt, compose, or roll our own.
- [ ] Pick the sub-agent contract approach and write a draft contract document.
- [ ] Lock the skill manifest format and the agent-skill binding semantics.
- [ ] Pick the default skill set that ships in the box.
- [ ] Decide whether recursion ships in v1 or phase 2.
- [ ] Pick the default sub-agent set and the default tool set.
- [ ] Sketch the permissions UX in enough detail that the trade off can be argued, not just stated. Decide whether the unit of grant is the skill or the tool.
- [ ] Measure latency and cost on a representative arrangement against representative local hardware before locking the design.
- [ ] Decide whether any sub-agents ship bundled with NanoOS, or whether the user installs all of them separately.
- [ ] Confirm at least one committed maintainer and one design partner from the collective.

When those are settled, this document becomes the foundation of the project's README and design notes. The repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.
