---
title: "Agentveil"
description: "A working whitepaper for a local-first policy gateway that mediates every sensitive action an AI coding agent takes on a user's machine - file reads, shell commands, network requests, MCP tool calls - against a user-authored allowlist."
sidebar_order: 8
proposer: "Sk Akram"
proposer_github: "akramcodez"
status: "In public review"
review_opens: "2026-08-19"
review_closes: "2026-09-19"
---

# Agentveil

Think of Agentveil like a security guard between an AI agent and your computer. As coding agents become more autonomous, they require increasingly broad permissions to be useful. However, giving an agent full access to your computer grants it much more access than it actually needs for any given task. This whitepaper proposes Agentveil, an open-source, local-first policy gateway that intercepts every sensitive action an AI agent attempts and evaluates it against a strict, user-authored allowlist.

## Problem

Today, when you give an AI agent the ability to execute tools, it typically gains unrestricted capability to:
- Read any file on disk
- Run arbitrary shell commands
- Access `.env` files and environment variables
- Make network requests to any domain
- Call any configured MCP (Model Context Protocol) tool

For example, if you ask [Nanocoder](https://github.com/Nano-Collective/nanocoder) to "Fix the authentication bug", the agent might legitimately need to read `src/auth.ts`, run tests, and perhaps call the GitHub MCP server. But by default, it also has the power to read `~/.ssh/id_rsa`, dump your AWS credentials, or exfiltrate private documents.

While mitigations exist, they are structurally limited:
- **Container Sandboxing (E2B, Docker):** Heavyweight, high friction, and still grant broad access within the sandbox.
- **Kernel-level Profiles (AppArmor):** Extremely difficult to author and maintain across distributions.
- **Agent-level approval policies:** CLI agents - including Nanocoder - already ship per-tool approval layers. Nanocoder's `approval-policy.ts` is a single approval authority that every execution path routes through, with five development modes (`normal`, `auto-accept`, `yolo`, `plan`, `headless`), fail-safe defaults for unknown tools, path validation covering directory traversal and null-byte injection, and an MCP layer with command-injection tests. These are real protections, and they work. However, they are enforced *by the agent's own code*. A bug in the agent, a plugin, a custom tool, or anything spawned by an allowed shell command can bypass them. They also protect only that agent's users - not users of other agents - and they produce no hash-chained audit record and no declarative, diffable policy artifact a team can review.
- **Detection-first tools:** Optimise for blocking known bad patterns (like an antivirus) rather than enforcing least-privilege.

The core problem is not the absence of approval flows - it is the absence of enforcement *outside* the agent process. Agentveil addresses the four gaps that agent-level policies cannot close:

1. **Enforcement below the agent's own code.** Kernel-level restrictions (Landlock, seccomp-bpf, Seatbelt) survive bugs, plugins, and shell descendants.
2. **Portability across agents.** A gateway protects whatever the user runs, including agents the collective did not write.
3. **Audit trail.** A hash-chained, optionally signed log of every allow/review/deny decision, verifiable from outside the agent.
4. **Declarative policy.** A version-controlled `policy.yaml` that a team can diff, review, and share - not code plus a mode setting.

**Why now.** The need for external enforcement is urgent in 2026 for four reasons. First, MCP server proliferation means every new server is new capability granted to an agent by a third party (and MCP tool descriptions can change between runs). Second, autonomy modes are shipping in mainstream CLI agents, where users explicitly turn confirmation off. Third, indirect prompt injection has moved from a demonstrated weakness to documented incidents in the wild. Finally, agents are moving into CI and background unattended runs where there is no human to answer a Review prompt at all.

## Intended audience

Agentveil is designed for developers running local coding agents (like [Nanocoder](https://github.com/Nano-Collective/nanocoder)) who want least-privilege semantics by default. It is also for security teams standardising agent permissions across a fleet, and open-source contributors wanting to publish secure policy packs.

It is explicitly **not** for cloud-agent-only users, users fully satisfied with containerised sandboxing, or users exclusively using pure "chat" agents without tool access.

## Principles

Agentveil inherits the Nano Collective's core values: Privacy-respecting, local-first, open-for-all. To these, it adds specific principles for agent mediation:

- **Least privilege by default.** Deny-by-default, allow-by-explicit-grant. The agent only gets the permissions it actually needs.
- **Inspectable policy.** Policies are declarative, diffable, and version-controlled. Inspired by OPA Rego-lite, the `policy.yaml` is the canonical artifact.
- **Fail-safe.** If the gateway crashes, the agent fails closed. Because the gateway runs as a separate daemon without kernel-level network interception, this guarantee is a property of the *agent*: a compliant agent must refuse to proceed if the daemon is unreachable. If the daemon restarts during an active session, the agent must re-establish the connection and policies are re-evaluated. A broken mediator must never silently grant access.
- **Audit-quality.** Every decision is recorded in a hash-chained, optionally signed log. The log supports post-hoc review of what a well-behaved but misdirected agent did; it does not provide tamper-evidence against a compromised user account (see Taint tracking and audit logs for the full scope statement).

## Threat model

Agentveil targets the runtime execution surface of the agent.

**In scope (v1):**
- Indirect prompt injection leading to tool exfiltration.
- Unauthorised reads of sensitive paths (`.env`, `~/.ssh`, `~/.aws`).
- Shell exfiltration (`curl --data-binary @file`, `bash -c`).
- Network egress to non-allowlisted hosts or cloud metadata endpoints.
- Chained-tool privilege escalation.
- Taint flow: indirect prompt injection via untrusted tool output influencing subsequent agent actions (e.g. a fetched web page persuading the agent to exfiltrate data). Mitigated at the session level in v1; per-value tracking deferred to v1.1.
- Sensitive operations by shell descendants (e.g. npm lifecycle scripts) when kernel enforcement is active.

**Out of scope:**
- Static analysis of agent code.
- Model-side safety or prompt filtering.
- Agent process compromise or host OS container escapes.
- Protection against state-level adversaries.
- Shell descendant mediation when running in degraded-enforcement mode (no Landlock / no Seatbelt). In this mode, only the agent's own tool calls are mediated; child processes of an allowed shell command run with the user's full privileges. The audit log records a `degraded-enforcement` warning so this residual risk is visible.

## Proposed approach

Agentveil sits on the boundary between the agent runtime and the OS. It intercepts actions across four distinct layers:

1. **Filesystem layer:** Path-allowlist policy. By default, it allows reading the current working directory but strictly denies access to `.env`, `.git`, and user home secrets unless explicitly opted in.
2. **Shell layer:** Command allowlist. Each profile specifies a set of permitted command names with optional argument constraints; everything not on the list is sent to Review. There is no built-in denylist of exfiltration patterns - pattern matching against shell arguments is inherently bypassable (`base64 file | curl`, `python3 -c "..."`, renamed binaries), and a denylist that reads as protection is worse than no denylist. Kernel enforcement (Landlock, seccomp-bpf) handles what the allowlist cannot: restricting what an allowed command’s process tree can actually do.
3. **Network layer:** Egress allowlist (deny by default). Only explicitly listed hosts and ports are reachable. A convenience blocklist of cloud metadata IPs (`169.254.169.254`) and known pastebins ships as defence-in-depth, but the allowlist is the protection - the blocklist catches the careless case and is explicitly bypassable.
4. **MCP layer:** Evaluates permissions on a per-tool basis. It detects and flags if an MCP server's tool descriptions change between runs.

### How interception works

Agentveil uses a layered interception strategy that combines tool-call mediation with platform-specific kernel enforcement.

**Primary mechanism: tool-call mediation.** The agent runtime (e.g. Nanocoder) routes every tool invocation - file reads, shell commands, network requests, MCP calls - through Agentveil's local daemon API before execution. Agentveil evaluates the call against `policy.yaml`, returns an allow / review / deny verdict, and only then does the agent runtime proceed. This is the mechanism that makes the four-layer policy model work: every action is a structured request that Agentveil can inspect, log, and block.

The `--gateway` flag or wrapper binary configures Nanocoder to use Agentveil as its tool-call proxy. If Agentveil is unreachable, the agent runtime refuses to execute any tool call (fail-closed).

**Supplementary mechanism: kernel enforcement for shell descendants.** Tool-call mediation alone has a gap: once a shell command is allowed (e.g. `npm install`), any child process it spawns runs outside the mediation layer. To close this gap, Agentveil applies platform-specific kernel restrictions to spawned processes:

- **Linux:** [Landlock LSM](https://docs.kernel.org/userspace-api/landlock.html) restricts filesystem access for child processes to the paths allowed by `policy.yaml`. [seccomp-bpf](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html) filters syscalls to block direct network egress and other sensitive operations that would bypass the mediation layer.
- **macOS:** [Seatbelt](https://www.chromium.org/developers/design-documents/sandbox/) (`sandbox-exec`) sandbox profiles constrain child processes to the same path and network policy. The Endpoint Security framework is architecturally preferred but requires Apple-notarized entitlements, so it is deferred to a future release.

**Fallback behaviour.** Where kernel enforcement is unavailable - Linux kernels before 5.13 (no Landlock), or restricted macOS environments - Agentveil falls back to tool-call-only mediation and emits a `degraded-enforcement` warning in the audit log. The warning makes it explicit that shell descendants are unmediated in this mode, allowing users and security teams to make an informed risk decision.

**What the mechanism choice implies:**

| Question | Answer |
| :--- | :--- |
| Why Rust? | Landlock, seccomp-bpf, and Seatbelt integration require low-level syscall access that Rust handles safely. |
| SDK or daemon? | Daemon. Kernel enforcement must be applied from outside the agent process, ruling out an in-process SDK for v1. |
| Does the MCP layer need a proxy? | No. MCP calls are already structured requests routed through the agent runtime; tool-call mediation is sufficient. |

### Policy format and outcomes
Agentveil uses a YAML schema (`policy.yaml`) that defines rules for paths, commands, networks, and secrets. It ships with three preset profiles: **permissive**, **balanced** (the default), and **strict**.

Every intercepted action results in one of three outcomes:
- **Allow:** Silently execute the action.
- **Review:** Pause and prompt the user to confirm the action inline.
- **Deny:** Block the action and log the attempt.

### Taint tracking and audit logs

Once a session reads untrusted content (e.g. a web search result, a fetched URL, or a file outside the project directory), Agentveil marks that session as tainted. From that point forward, every outbound action in the session (network egress, shell commands with external targets) is escalated from Allow to Review, requiring explicit user confirmation.

This is a coarse, session-level rule. It does not attempt per-value dataflow analysis through the model, because the model is an opaque transformation: it can paraphrase a secret, encode it, or act on injected instructions without ever quoting the tainted input. Substring matching between tainted input and outbound arguments catches the naive case and misses the adversarial one, which is the case that matters for indirect injection.

The session-level rule trades precision for honesty. It costs more Review prompts after any web fetch, and precision is exactly what a v1.1 can buy back with per-value tagging once there is an attack corpus to measure against. Taint tracking at any granularity is mitigation, not prevention - a reader should not conclude that indirect prompt injection is solved.

**Audit log scope.** All decisions (including taint escalations) are written to an append-only, hash-chained audit log. The log's purpose is post-hoc review: understanding what a well-behaved but misdirected agent did during a session, auditing policy effectiveness across sessions, and sharing session records across a team.

The hash chain detects accidental corruption and out-of-order entries. Opt-in Ed25519 signing with a user-held key adds attribution across machines (proving which developer's session produced a log) and detects naive tampering. However, on a single machine where the log and the signing key are both written by a process running as the same user, cryptographic tamper-evidence does not hold: anything running as that user can rewrite the chain, recompute hashes, and re-sign the result. The threat model already places agent process compromise out of scope, so this is an honest boundary.

Stronger tamper-evidence (an anchor published to a location the agent cannot write, a key held in the Secure Enclave or TPM, or a separate privileged writer process) is worth pursuing as future work but is out of scope for v1.

## A worked example

Imagine telling an agent: *"Download the latest dependencies and run the tests."*

With Agentveil running the balanced profile, the execution flow looks like this:

| Action | Gateway Decision | Enforcement Layer | Reason |
| :--- | :--- | :--- | :--- |
| `npm install` | Allow | Tool-call mediation | Balanced profile allows shell in cwd |
| Read `src/auth.ts` | Allow | Tool-call mediation | Cwd read access granted |
| Read `~/.ssh/id_rsa` (by agent) | Deny | Tool-call mediation | Out-of-bounds secret read |
| `postinstall` script reads `~/.ssh/id_rsa` | Deny | Kernel (Landlock) | Child process inherits filesystem restrictions from parent |
| `postinstall` script opens socket to `evil.com` | Deny | Kernel (seccomp-bpf) | Child process inherits egress filter from parent |
| Send `project.zip` to `unknown-site.com` | Deny | Tool-call mediation | Network and command pattern violation |
| `git push` | Review | Tool-call mediation | Requires explicit human confirmation |

This protects the machine even if the agent is prompt-injected or hallucinating.

**How shell descendants are covered.** When Agentveil launches an allowed shell command, it applies Landlock filesystem restrictions and seccomp-bpf syscall filters to the spawned process *before* executing the command. Both mechanisms are mandatory and irreversible: every child process created by `fork()` or `clone()` inherits the same restrictions, and no descendant can remove or widen them. This is what makes the `postinstall` rows in the table above accurate - a malicious lifecycle script inherits the same path and network restrictions as the parent command.

On macOS, Seatbelt (`sandbox-exec`) provides equivalent inheritance for child processes.

> **Degraded mode.** On systems where kernel enforcement is unavailable (Linux < 5.13, restricted macOS environments), shell descendants run unmediated. Only the agent's own tool calls are filtered. The audit log records a `degraded-enforcement` warning and the residual risk is documented in the threat model's out-of-scope section.

## v1 scope

- Local daemon using tool-call mediation as the primary interception mechanism, supplemented by Landlock + seccomp-bpf (Linux) and Seatbelt (macOS) for kernel-level enforcement of shell descendants.
- Mediation for Filesystem, Shell, Network, and MCP tool calls.
- Three built-in policy profiles (`permissive`, `balanced`, `strict`) governed by a YAML schema.
- Session-level taint escalation: once untrusted content is read, all subsequent outbound actions in that session require Review. Per-value taint tracking is deferred to v1.1.
- Append-only hash-chained audit log with opt-in Ed25519 signing.
- Proposed implementation in Rust for safe syscall integration and memory safety (see Open questions for the language decision).
- Packaged as a standalone binary installable on macOS and Linux:
  - **macOS:** Uses tool-call mediation, falling back to Seatbelt (`sandbox-exec`) for shell descendants. Requires no Apple Developer Program entitlements (Endpoint Security and Network Extensions are out of scope for v1 due to recurring cost and organisational complexity).
  - **Linux:** Uses tool-call mediation, backed by Landlock and seccomp-bpf for shell descendants.

### v1 success picture

A feature list says what will be built. A success picture says what would prove it worked. For a security project the distinction is critical: a gateway that blocks everything and a gateway that blocks nothing ship the same feature list.

v1 is successful when all three of the following hold:

1. **Attack corpus: zero bypass.** A published test suite of ≥ 20 documented scenarios - indirect prompt injection leading to exfiltration, secret-path reads (`.env`, `~/.ssh`, `~/.aws`), egress to non-allowlisted hosts, chained-tool privilege escalation, and taint-flow re-injection - must all be blocked under the `strict` and `balanced` profiles with zero bypass. The corpus is published in the repository so anyone can rerun it.
2. **Interruption budget: ≤ 3 review prompts per hour.** Under the `balanced` profile on a representative coding session (create a feature branch, edit files, run tests, push), the user is prompted no more than 3 times per hour. This is the number that decides whether users reach for `allow: "*"` - the anti-pattern the document already names as the project’s main risk.
3. **Overhead budget: ≤ 5 ms p95.** The p95 added latency per mediated tool call must not exceed 5 ms, measured on the file-heavy case (500+ file reads in a single session) where interposition overhead is most visible.

## What it is not

- Not a hosted control plane or fleet manager.
- Not a detection engine. Every layer enforces least-privilege via allowlists, not pattern-matching denylists. Convenience blocklists (cloud metadata IPs, known pastebins) ship as defence-in-depth but are explicitly not load-bearing - no profile relies on them for a security property.
- Not a replacement for VM sandboxing (use Firecracker alongside it if needed).
- Not an LLM-side safety layer or prompt-injection scanner.

## Composition with other NC projects

Agentveil naturally fits into the Nano Collective's privacy-respecting vision:

- **[Nanocoder](https://github.com/Nano-Collective/nanocoder):** The primary consumer. Agentveil plugs in via a `--gateway` flag or wrapper binary. **Prompt ownership:** when `--gateway` is present, Nanocoder delegates approval decisions to Agentveil and silences its own `approval-policy.ts` prompts for actions that Agentveil has already allowed. Agentveil becomes the single approval surface, avoiding double-prompting. If `--gateway` is absent, Nanocoder's built-in approval policy remains in effect as it does today.
- **[`prompt-scrub`](https://github.com/Nano-Collective/prompt-scrub):** While `prompt-scrub` protects data *leaving* the machine in the prompt, Agentveil protects the machine from the agent's *actions*. They compose: Agentveil's policy requires the agent to call `prompt-scrub` on outbound payloads and produces the audit record proving it did.
- **[NanoOS](/collective/whitepapers/nano-os) (Paused):** A future consumer where Agentveil acts as the per-tool permission oracle.
- **[Sentinel](https://github.com/Nano-Collective/sentinel) (alpha):** While Sentinel provides repo-wide static security audits, Agentveil provides live-session runtime mediation.

## Alternatives considered

- **Just use a container (E2B, Docker):** Too heavyweight for daily local dev and still grants broad access inside the sandbox.
- **Detection-first tools (Clampd, Adrian):** Excellent for known-bad patterns but fail to enforce least-privilege. They are complementary, not substitutes.
- **Per-tool confirmation UIs (Claude.ai style):** CLI agents lack the UI surface for this. Agentveil brings this control to the local terminal environment.
- **AppArmor / SELinux:** Profile authoring is notoriously painful and distro-specific. These are system-wide MAC frameworks designed for sysadmins, not per-session agent policies.
- **Landlock alone (Linux):** [Landlock](https://docs.kernel.org/userspace-api/landlock.html) is unprivileged, per-process, and requires no root - it is the closest kernel primitive to what Agentveil's filesystem and network layers need. However, Landlock has no concept of "which tool asked", no audit trail, no MCP awareness, no review prompt, and no policy format a human wants to write by hand. Existing wrappers like [Island](https://github.com/landlock-lsm/island) and [Compartment](https://github.com/nmicic/compartment) provide TOML-based configuration but remain Linux-only and agent-unaware.
- **Seatbelt alone (macOS):** [Seatbelt](https://www.chromium.org/developers/design-documents/sandbox/) (`sandbox-exec`) is per-invocation and used in production by shipped coding agents. However, its Scheme-based policy language is awkward and largely undocumented, it is macOS-only, and it provides no agent-level semantics.

**Agentveil's relationship to Landlock and Seatbelt.** Agentveil does not replace these kernel primitives - it builds on top of them. Landlock and Seatbelt provide the trusted enforcement floor: mandatory, irreversible, kernel-enforced restrictions that survive child processes. Agentveil provides the layers that do not exist in the kernel: an agent-shaped `policy.yaml` format, taint-aware decision logic, an auditable hash-chained log, MCP tool-description drift detection, and the review prompt. The trusted computing base stays small because enforcement is delegated to the kernel; Agentveil's contribution is the policy, audit, and agent-awareness layer that no kernel primitive provides today.

## Competitive landscape

As of September 2026, the "agent firewall" space is active, and the ecosystem is converging on native OS primitives over heavy containerisation.

**Detection and proxy tools.** Tools like **[Clampd](https://github.com/clampd/clampd)** provide Rust runtime security pipelines but optimise for detection rules (240+ rules) rather than strict allowlisting. **[Diplomat-agent](https://github.com/diplomat/diplomat)** uses a two-tier approach but relies heavily on AST scanning. **[Pipelock](https://github.com/pipelock/pipelock)** and **[OpenAFW](https://github.com/openafw/openafw)** are network-side proxies that protect the LLM-bound leg but cannot protect local secrets like `.env` or `~/.ssh`.

**Shipped agent sandboxes.** The closest prior art to Agentveil's core idea is already in production: shipped CLI coding agents. Both **Claude Code** and **Codex CLI** confine local tool execution using OS primitives (Seatbelt on macOS, Landlock or bubblewrap on Linux). Agentveil engages directly with this model, arguing that while the primitives are correct, they should not be opinionated, closed, per-agent implementations. The gap Agentveil addresses is providing these exact primitives under user-authored, cross-agent, inspectable policies.

**Landlock / Seatbelt wrappers.** A growing set of tools wrap kernel primitives directly: **[nono](https://github.com/always-further/nono)** combines Landlock and Seatbelt with per-resource policies and credential-injection proxies; **[Compartment](https://github.com/nmicic/compartment)** provides rootless confinement for agents like Claude Code using Landlock and seccomp; **[enclave](https://github.com/kohkimakimoto/enclave)** wraps `sandbox-exec` with TOML configuration for macOS. These tools validate the enforcement layer that Agentveil builds on, but none provides an agent-aware policy format, taint tracking, MCP tool-description monitoring, or a hash-chained audit log.

Agentveil distinguishes itself as the policy, audit, and agent-awareness layer on top of kernel enforcement.

## Open risks

- **Policy authoring UX:** The project lives or dies by its ergonomics. If configuring policies is too hard, users will resort to an `allow: "*"` anti-pattern.
- **Coverage gaps:** Every new MCP server introduces a new policy decision. The default profiles must be highly opinionated to remain safe out of the box.
- **Supply chain:** A bug in the mediator is a bug in every installation. Code integrity is critical.
- **Taint tracking precision:** The session-level taint rule is deliberately coarse. After any web fetch, the remaining session will generate more Review prompts, which trades security for interruption cost. If the interruption budget (≤ 3 prompts/hour) proves unachievable with the session-level rule, a finer-grained approach will be needed for v1.1.

## Resolved in review

The following questions were settled during the public review window (2026-08-19 - 2026-09-19) based on feedback from [#74](https://github.com/Nano-Collective/docs/issues/74), [#75](https://github.com/Nano-Collective/docs/issues/75), [#76](https://github.com/Nano-Collective/docs/issues/76), [#77](https://github.com/Nano-Collective/docs/issues/77), [#80](https://github.com/Nano-Collective/docs/issues/80), and [#81](https://github.com/Nano-Collective/docs/issues/81).

- **Interception mechanism (#74).** Agentveil uses tool-call mediation as the primary mechanism, supplemented by Landlock + seccomp-bpf (Linux) and Seatbelt (macOS) for kernel-level enforcement of shell descendants. See [How interception works](#how-interception-works).
- **SDK vs. daemon (#74).** Daemon. Kernel enforcement must be applied from outside the agent process, ruling out an in-process SDK for v1.
- **Relationship to Landlock and Seatbelt (#76).** Agentveil builds on top of kernel primitives, not as a replacement. Enforcement is the kernel's; Agentveil's contribution is the policy, audit, and agent-awareness layer.
- **Relationship to Nanocoder’s approval-policy (#77).** When `--gateway` is present, Nanocoder delegates approval to Agentveil and silences its own prompts. When absent, Nanocoder’s built-in policy remains in effect.
- **Taint tracking granularity (#80).** v1 uses a coarse session-level taint rule (untrusted read escalates all subsequent egress to Review). Per-value taint tracking is deferred to v1.1 once an attack corpus exists to measure precision against.
- **Signing key custody (#81).** User-held keys. Nano Collective attestation would put the collective in a custody and liability role, require it to operate key material on behalf of users, and create the hosted dependency its positioning argues against. If fleet attestation is needed later, it belongs to whoever runs the fleet, not to NC.

## Open questions


- **Default profile behaviour:** Should the permissive profile even ship, or should we restrict it to balanced and strict?
- **Kernel enforcement depth:** How aggressively should the seccomp-bpf filter restrict child-process syscalls? An overly tight filter will break legitimate build tools; an overly loose one leaves gaps.
- **Landlock adoption floor:** Should v1 require Landlock (kernel ≥ 5.13), or should the degraded-enforcement fallback be the expected path on older distributions?
- **Implementation language:** With enforcement delegated to the kernel, the argument for Rust shifts from "performance" to "safe syscall integration with Landlock, seccomp-bpf, and Seatbelt." If the policy compiler and daemon do not need raw syscall access (e.g. by using a C FFI layer), sharing code with Nanocoder via TypeScript becomes the stronger argument. This decision should be revisited once the kernel integration surface is scoped.

## Next steps

- Settle on the policy schema v0 with three working examples (`permissive`, `balanced`, `strict`).
- Publish the v1 attack corpus (≥ 20 scenarios) and validate zero bypass under `balanced` and `strict`.
- Build a Nanocoder integration prototype validating the `npm install` vs. `send .zip` flow end-to-end.
- Scope the kernel integration surface (Landlock, seccomp-bpf, Seatbelt) to determine whether Rust's syscall access is required or whether a C FFI layer suffices for TypeScript.
- Conduct a threat-model audit by an external reviewer.
