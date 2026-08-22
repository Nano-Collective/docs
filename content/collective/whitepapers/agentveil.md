---
title: "Agentveil"
description: "A working whitepaper for a local-first policy gateway that mediates every sensitive action an AI coding agent takes on a user's machine — file reads, shell commands, network requests, MCP tool calls — against a user-authored allowlist."
sidebar_order: 7
proposer: "Sk Akram"
proposer_github: "akramcodez"
status: "In public review"
review_opens: "2026-08-19"
review_closes: "2026-09-19"
---

# Agentveil

Think of Agentveil like a security guard between an AI agent and your computer. As coding agents become more autonomous, they require increasingly broad permissions to be useful. However, giving an agent full access to your computer grants it much more access than it actually needs for any given task. This whitepaper proposes Agentveil, an open-source, local-first policy gateway that intercepts every sensitive action an AI agent attempts and evaluates it against a strict, user-authored allowlist. By composing Agentveil with Nanocoder and `prompt-scrub`, Nano Collective aims to deliver the first complete privacy envelope for local agentic workflows.

## Problem

Today, when you give an AI agent the ability to execute tools, it typically gains unrestricted capability to:
- Read any file on disk
- Run arbitrary shell commands
- Access `.env` files and environment variables
- Make network requests to any domain
- Call any configured MCP (Model Context Protocol) tool

For example, if you ask Nanocoder to "Fix the authentication bug", the agent might legitimately need to read `src/auth.ts`, run tests, and perhaps call the GitHub MCP server. But by default, it also has the power to read `~/.ssh/id_ed25519`, dump your AWS credentials, or exfiltrate private documents. 

While mitigations exist, they are structurally flawed:
- **Container Sandboxing (E2B, Docker):** Heavyweight, high friction, and still grant broad access within the sandbox.
- **Kernel-level Profiles (AppArmor):** Extremely difficult to author and maintain across distributions.
- **Agent-level Confirmations:** Only work in hosted environments with custom UIs; CLI agents lack this surface.
- **Detection-first tools:** Optimize for blocking known bad patterns (like an antivirus) rather than enforcing least-privilege.

The core problem is that agents operate with implicit trust. Giving an agent access to your computer gives it much more access than it actually needs.

## Intended audience

Agentveil is designed for developers running local coding agents (like Nanocoder) who want least-privilege semantics by default. It is also for security teams standardizing agent permissions across a fleet, and open-source contributors wanting to publish secure policy packs.

It is explicitly **not** for cloud-agent-only users, users fully satisfied with containerized sandboxing, or users exclusively using pure "chat" agents without tool access.

## Principles

Agentveil inherits the Nano Collective's core values—Privacy-respecting, local-first, open-for-all—and adds specific principles for agent mediation:

- **Least privilege by default.** Deny-by-default, allow-by-explicit-grant. The agent only gets the permissions it actually needs.
- **Inspectable policy.** Policies are declarative, diffable, and version-controlled. Inspired by OPA Rego-lite, the `policy.yaml` is the canonical artifact.
- **Fail-safe.** If the gateway crashes, the agent fails closed. A broken mediator must never silently grant access.
- **Audit-quality.** Every decision results in a hash-chained, optionally signed log entry, verifiable from outside the agent.

## Threat model

Agentveil targets the runtime execution surface of the agent.

**In scope (v1):**
- Indirect prompt injection leading to tool exfiltration.
- Unauthorized reads of sensitive paths (`.env`, `~/.ssh`, `~/.aws`).
- Shell exfiltration (`curl --data-binary @file`, `bash -c`).
- Network egress to non-allowlisted hosts or cloud metadata endpoints.
- Chained-tool privilege escalation.
- Taint flow: tool results flowing back into the model unredacted.

**Out of scope:**
- Static analysis of agent code.
- Model-side safety or prompt filtering.
- Agent process compromise or host OS container escapes.
- Protection against state-level adversaries.

## Proposed approach

Agentveil sits on the boundary between the agent runtime and the OS. It intercepts actions across four distinct layers:

1. **Filesystem layer:** Path-allowlist policy. By default, it allows reading the current working directory but strictly denies access to `.env`, `.git`, and user home secrets unless explicitly opted in.
2. **Shell layer:** Command and argument inspection. Features a built-in denylist for known exfiltration patterns and an allowlist mode for tighter constraints.
3. **Network layer:** Egress allowlist (deny by default), with a default blocklist targeting pastebins and cloud metadata IPs.
4. **MCP layer:** Evaluates permissions on a per-tool basis. It detects and flags if an MCP server's tool descriptions change between runs.

### Policy Format and Outcomes
Agentveil uses a YAML schema (`policy.yaml`) that defines rules for paths, commands, networks, and secrets. It ships with three preset profiles: **permissive**, **balanced** (the default), and **strict**.

Every intercepted action results in one of three outcomes:
- **Allow:** Silently execute the action.
- **Review:** Pause and prompt the user to confirm the action inline.
- **Deny:** Block the action and log the attempt.

### Taint Tracking and Audit Logs
Data fetched from untrusted sources (e.g., a web search or file read) is tagged as tainted. If a subsequent outbound tool call uses this tainted data, Agentveil subjects it to tighter inspection to mitigate indirect prompt injection. All decisions are written to an append-only, hash-chained audit log.

## A worked example

Imagine telling an agent: *"Download the latest dependencies and run the tests."*

With Agentveil running the balanced profile, the execution flow looks like this:

| Action | Gateway Decision | Reason |
| :--- | :--- | :--- |
| `npm install` | Allow | Balanced profile allows shell in cwd |
| Read `src/auth.ts` | Allow | Cwd read access granted |
| Read `~/.ssh/id_rsa` | Deny | Out-of-bounds secret read |
| Send `project.zip` to `unknown-site.com` | Deny | Network and command pattern violation |
| `git push` | Review | Requires explicit human confirmation |

This protects the machine even if the agent is prompt-injected or hallucinating.

## v1 scope

- Local daemon operating at the process boundary.
- Mediation for Filesystem, Shell, Network, and MCP tool calls.
- Three built-in policy profiles (`permissive`, `balanced`, `strict`) governed by a YAML schema.
- Append-only hash-chained audit log with opt-in Ed25519 signing.
- Written in Rust for minimal overhead and memory safety.
- Packaged as a standalone binary installable on macOS and Linux.

## What it is not

- Not a hosted control plane or fleet manager.
- Not a detection engine (we enforce least-privilege, we don't scan-and-score).
- Not a replacement for VM sandboxing (use Firecracker alongside it if needed).
- Not an LLM-side safety layer or prompt-injection scanner.

## Composition with other NC projects

Agentveil naturally fits into the Nano Collective's privacy-respecting vision:

- **Nanocoder:** The primary consumer. Agentveil plugs in via a `--gateway` flag or wrapper binary.
- **`prompt-scrub`:** While `prompt-scrub` protects data *leaving* the machine in the prompt, Agentveil protects the machine from the agent's *actions*. They compose perfectly: Agentveil enforces that any network egress containing local file data must first pass through `prompt-scrub`.
- **NanoOS:** A future consumer where Agentveil acts as the per-tool permission oracle.
- **Sentinel:** While Sentinel provides repo-wide static security audits, Agentveil provides live-session runtime mediation.

## Alternatives considered

- **Just use a container (E2B, Docker):** Too heavyweight for daily local dev and still grants broad access inside the sandbox.
- **Detection-first tools (Clampd, Adrian):** Excellent for known-bad patterns but fail to enforce least-privilege. They are complementary, not substitutes.
- **Per-tool confirmation UIs (Claude.ai style):** CLI agents lack the UI surface for this. Agentveil brings this control to the local terminal environment.
- **AppArmor / SELinux:** Profile authoring is notoriously painful and distro-specific. Agentveil delivers a portable, agent-shaped alternative.

## Competitive landscape

The "agent firewall" space is active. Tools like **Clampd** provide Rust runtime security pipelines but optimize for detection rules (240+ rules) rather than strict allowlisting. **Diplomat-agent** uses a two-tier approach but relies heavily on AST scanning. **Pipelock** and **OpenAFW** are network-side proxies that protect the LLM-bound leg but cannot protect local secrets like `.env` or `~/.ssh`.

Agentveil distinguishes itself by being the privacy-first, least-privilege project focused entirely on the local developer workflow, seamlessly integrating with the Nano Collective ecosystem.

## Open risks

- **Policy Authoring UX:** The project lives or dies by its ergonomics. If configuring policies is too hard, users will resort to an `allow: "*"` anti-pattern.
- **Coverage Gaps:** Every new MCP server introduces a new policy decision. The default profiles must be highly opinionated to remain safe out of the box.
- **Supply Chain:** A bug in the mediator is a bug in every installation. Code integrity is critical.
- **Taint Tracking:** False negatives in taint flow analysis could reopen prompt-injection vectors.

## Open questions

- **Implementation Language:** Rust provides performance and a smaller trusted compute base, but TypeScript would allow shared code with Nanocoder. The current proposal leans toward Rust.
- **Mediation Placement:** Should Agentveil be an in-process SDK or an out-of-process daemon? (Security vs. Friction tradeoff).
- **Signing Key Custody:** Should audit log signing keys be user-held or attested by Nano Collective?
- **Default Profile Behavior:** Should the permissive profile even ship, or should we restrict it to balanced and strict?

## Next steps

- Settle on the policy schema v0 with three working examples (`permissive`, `balanced`, `strict`).
- Build a Nanocoder integration prototype validating the `npm install` vs. `send .zip` flow end-to-end.
- Lock the implementation language decision (Rust vs. TypeScript).
- Conduct a threat-model audit by an external reviewer.
