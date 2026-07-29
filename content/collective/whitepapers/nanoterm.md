---
title: "Nanoterm"
description: "A whitepaper for an open-source, ultra-lightweight terminal companion that translates natural language into safe, executable shell commands."
sidebar_order: 3
proposer: "Sk Akram"
proposer_github: "akramcodez"
status: "Building"
review_opens: "2026-07-09"
review_closes: "2026-08-09"
---

# Nanoterm

Most developers rely on the terminal daily, but memorizing arcane shell syntax (like complex `find` combinations, `ffmpeg` one-liners, or `sed` incantations) breaks flow. While powerful AI coding agents like Nanocoder exist, booting up a heavy, context-aware agent just to generate a one-line shell command introduces unnecessary friction.

This whitepaper proposes `Nanoterm`: a tiny, open-source terminal companion that translates natural language requests into shell commands, presents them for review, and executes them locally after explicit human approval. It provides a shell-first experience without the overhead of a full development environment, acting as the perfect lightweight companion to the Nano Collective ecosystem.

## Problem

The agent layer is where the next round of useful work happens, but current AI coding tools are fundamentally misaligned with quick, ephemeral shell tasks:

1. **Overhead.** Booting a full coding agent to ask "how to delete all `node_modules`" takes too long, clutters the interface, and uses unnecessary compute resources.
2. **Context mismatch.** Coding agents optimize for source code editing. They try to explain code, scan workspaces, and provide conversational filler rather than just outputting an executable command.
3. **Safety.** Many command generation tools either refuse to run commands entirely or run them blindly without an intermediate review step. This is incredibly dangerous for destructive actions like `rm` or `chmod`.
4. **Fragmentation.** Existing standalone tools in this specific space (like `whai`, `aichat`, or `gorilla-cli`) are completely disconnected from the Nano Collective ecosystem, missing out on shared prompt architectures, model configurations, and privacy tooling.

## Intended audience

`Nanoterm` is designed for developers, sysadmins, and power users who spend their days in the terminal and want an AI assistant specifically tuned for shell operations. 

The primary user is someone who already knows their way around a terminal but wants to avoid reading man pages or searching online for complex bash syntax. They want a frictionless workflow: invoke the tool, get the command, approve it, and move on. It is not designed to replace deep, stateful, multi-file refactoring (which is Nanocoder's domain).

## Principles

The design philosophy of `Nanoterm` is its most critical aspect. It must feel like a native UNIX utility, not a bolted-on conversational AI.

- **Shell-first.** The terminal is the product. There is no chat UI, no lengthy explanations of why a command was chosen unless explicitly requested, and no conversational filler. The output is strictly a command ready to be run.
- **Ultra-lightweight.** Instant startup is a hard requirement. There is no indexing of the local filesystem, no scanning of the workspace, and no persistent background agent maintaining state between unrelated sessions.
- **Human approval.** Safety is paramount. `Nanoterm` will *never* execute commands automatically. It will always present the generated command to the user for review. The user must be able to explicitly approve the execution or edit the command inline if the AI hallucinated or missed a nuance.
- **Ephemeral.** Ephemeral refers to **long-term state**, not the absence of any temporary context. Nanoterm intentionally avoids persistent memory and background services, but may retain short-lived local context solely to support immediate follow-up commands within the same shell session.

## Scope (v1)

A tightly focused utility that does one thing exceptionally well.

**In scope:**
- Natural language to shell command translation via a simple CLI invocation (e.g., `nano "find all empty directories"`).
- An interactive `[y/N/edit]` approval flow before execution, ensuring users always have the final say.
- Capturing `stdout` and `stderr` to feed back into the ephemeral session, allowing the user to chain immediate follow-up commands (e.g., "now delete the ones you found").
- **Provider agnosticism:** Support the same provider configuration model as Nanocoder, including OpenAI-compatible endpoints, Anthropic, Google, local models (e.g., Ollama), and other providers supported through `agents.config.json`.

**Out of scope:**
- Editing source code files or performing codebase refactoring.
- Indexing workspaces or managing project state.
- Persistent chat history across terminal tabs or reboots.
- Replacing full terminal emulators like Warp or iTerm.

## Proposed approach

`Nanoterm` will be built as a standalone NPM package (e.g., `@nanocollective/nanoterm`), keeping it completely decoupled from the main `nanocoder` repository. This ensures it remains an ultra-lightweight utility.

### Provider architecture

To resolve the tension between remaining completely decoupled and utilizing Nano Collective's provider connections, **my preferred direction for v1** is sharing the configuration format while keeping provider implementations independent. 

Nanoterm could reuse the existing `agents.config.json` format so users only configure providers once. The exact config lookup strategy (shared location, fallback, or dedicated Nanoterm config) is still open for discussion. However, Nanoterm will implement its own provider calls against the Vercel AI SDK independently—it will not import or depend on any Nanocoder source code. The coupling is strictly at the config-file format level.

Similarly, "shared prompt techniques" refers to adopting the Nano Collective ecosystem's system prompt conventions (e.g., command-only output, no filler) rather than sharing literal prompt code.

### Safety design

Human approval is only effective if the user understands what they are approving. Rather than relying solely on a `[y/N/edit]` prompt, Nanoterm adds lightweight safety layers while keeping the interface simple:

* **Safe by default:** Pressing `Enter` defaults to `N` and aborts execution.
* **Explain-on-request:** Users can request a concise explanation of the proposed command before deciding.
* **Danger detection:** Commands matching common destructive patterns are clearly flagged and require explicit confirmation.
* **Scope:** Nanoterm intentionally avoids full shell parsing or semantic validation in v1. More advanced validation can be explored as a future enhancement.

### The pipeline

1. **Invocation.** The user runs the CLI with a query: `nano "free up disk space"`.
2. **Context Gathering.** The tool briefly samples the environment (OS type, current shell, Present Working Directory) to ground the generation and ensure compatibility.
3. **Generation.** The LLM generates the exact shell command(s) needed, omitting conversational filler.
4. **Approval Workflow.** The user is presented with the command and prompted for action:
   ```bash
   $ nano "find all node_modules larger than 1GB"

   Proposed command:
   > find . -name "node_modules" -type d -prune -size +1G

   Execute? [y/N/edit/?]: 
   ```
5. **Execution & Feedback.** Upon execution (if `y` is selected), the output is printed to the terminal normally. To support chaining, the output is temporarily written to a short-lived local cache scoped to the parent shell (for example, a temporary file keyed by the shell's PID). This allows the user to return to their normal shell prompt, but still chain a follow-up request like `nano "delete the largest one"` on their next invocation. If `edit` is selected, the user is dropped into an prompt to manually tweak the command before execution.

### Privacy and State
Because `stdout`/`stderr` and context gathering can contain sensitive data (API keys, PII, hostnames), the short-lived buffer remains strictly local. Furthermore, when using cloud providers, any buffered context is seamlessly routed through the Nano Collective's `prompt-scrubber` utility to strip identifying content before it leaves the local machine.

## Relationship with Nanocoder

`Nanoterm` and `Nanocoder` are highly complementary. A developer might use `Nanoterm` to quickly figure out the exact `git` incantation to untangle a messy rebase, and then switch to Nanocoder to implement a complex feature across five different files in that newly cleaned repository.

Despite sharing the same provider configuration format, Nanoterm has zero runtime or build-time dependencies on the Nanocoder codebase. This is a deliberate design choice: extracting a shared provider library would gate Nanoterm's development on upstream Nanocoder releases and introduce unnecessary coordination overhead. A shared library remains a future possibility once both tools have stabilized, but v1 prioritizes shipping speed and independence.

## Alternatives considered

### A Nanocoder subcommand
A common question is why Nanoterm isn't simply a feature within Nanocoder (e.g., `nanocoder --term`). Nanocoder is designed for long-running, stateful coding sessions. It requires project understanding, uses complex agent orchestration, and coordinates multiple tools. `Nanoterm` is the opposite: it prioritizes fast startup and handles ephemeral operations. A subcommand would carry too much overhead for sub-second shell tasks.

### Third-party CLI tools
Tools like `whai`, `aichat`, and `gorilla-cli` already exist in this space. Unlike general AI terminal assistants, Nanoterm is intentionally focused on fast, single-task command generation with explicit human approval, local-first workflows, and seamless integration with the Nano Collective ecosystem (reusing provider configurations and `prompt-scrubber` privacy guarantees).

## Success picture (v1)

What would prove this idea? A successful v1 proves that developers can translate natural language into safe shell commands with minimal friction, while preserving Nanoterm's shell-first philosophy and privacy-first design. Example metrics could include:
- Fast startup and execution latency.
- High command acceptance rate (users select `y` without needing to `edit` or retry).
- A safe approval flow where destructive commands are clearly flagged.
- Positive developer feedback on everyday shell tasks.

## Future ideas

While v1 is kept intentionally minimal to validate the core loop, future iterations could explore:
- **Shell completions.** Native tab completions for the `nano` binary itself.
- **Command history injection.** Providing the last 5 executed commands as context to the model to better understand the user's current goal.

## Open questions

To help guide the Stage 3 review, feedback is especially welcome on the following live decisions:
- **Binary naming:** The current proposal uses `nano`, which heavily overloads the GNU `nano` text editor. Should we default to `nt`, `nterm`, or something else?
- **Config reuse mechanism:** What is the cleanest way to reuse `agents.config.json` in v1 without creating a hard dependency on the Nanocoder repository?
- **Local vs cloud default:** Should local models be the out-of-the-box default, or should we default to cloud providers for better initial command accuracy?
- **Safety validation scope:** Should we introduce stricter semantic validation for commands, or is human approval + heuristic detection sufficient for v1?
