---
title: "Canopy"
description: "A portable layer for publishing and installing agent assets across any harness — skills, tools, prompts, sub-agents — written once and installed everywhere the collective ships an adapter"
proposer: "Matt Spence"
proposer_github: "mrspence"
status: "Declined"
sidebar_order: 6
status_changed_on: "2026-10-04"
---

# Canopy

> **Declined, 4 October 2026.** Canopy did not go ahead and is closed out. The thinking stays here as a record until the archive window lapses.

> **Naming note.** *Canopy* is the recommended name for both the project and the CLI: one name, one thing to remember, `canopy` on the command line. It carries no buying/selling connotation and describes the cross-harness layer directly. All names are recommendations pending a short shortlist and a `canopy` CLI collision check.

The agent ecosystem is fragmenting along harness lines. A skill written for Claude Code is a folder of markdown with a specific frontmatter shape. A Nanocoder skill is a different folder with different conventions. A Cursor rule lives in `.cursor/rules` and follows yet another schema. An Aider configuration, a Continue.dev recipe, a Goose toolkit, an OpenAI Assistants definition: every harness has invented its own format for what is, underneath, the same kind of thing, a packaged unit of agent behaviour.

The result is that the people doing the most interesting work, building skills, MCP tools, prompt packs, specialist sub-agents, have nowhere portable to publish it. They either pick a harness and accept the lock-in, fork their work across three formats and maintain all of them, or hide it in a GitHub repo with a README that says *"copy this folder into your config."* None of these scale. None of them let a single high-quality asset reach the whole community.

This whitepaper proposes a project to build the missing layer: a portable manifest format for agent assets, a catalogue where those assets can be published and discovered, and a set of adapters that translate a manifest into whatever the user's harness actually expects. The crucial commitment, and the change from earlier drafts, is that **the collective owns and ships the adapters itself**. An author writes a skill once, publishes it once, and any harness we maintain an adapter for can install and run it, without that author doing any per-harness work and without us waiting on anyone else to show up.

Crucially, an author does not have to start from scratch. The same adapters run in reverse: an existing skill already sitting in a Claude Code skills directory, a Codex configuration, or a Nanocoder setup can be **imported** into Canopy, which reads the harness-native files and produces a manifest-ready package. Most of the interesting work already exists inside somebody's harness; importing is how it gets out.

That guarantee, *write once and it installs everywhere we support*, is the thing worth showing up for. Canopy is the layer that spans the harnesses, and `canopy` is the command a user runs to install from it. A package is one manifest-bearing unit, whether a single skill or a bundle, and the catalogue is the aggregate of every package the community contributes.

## Problem

There is no single problem here. There is a stack of related ones, and they reinforce each other.

1. **Format fragmentation.** Every harness defines its own schema for skills, tools, prompts, and sub-agents. The underlying concepts are nearly identical, but the on-disk shapes are not interoperable. An asset built for one harness cannot run in another without manual rewriting.
2. **Distribution is ad hoc.** Most useful agent assets today live in personal GitHub repos, gists, or Discord pastes. There is no canonical place to look. Discoverability depends on knowing which person to follow on which platform.
3. **Vendor-controlled marketplaces entrench lock-in.** Where marketplaces do exist (Anthropic's skill directory, Cursor's directory, vendor-run MCP listings), they accept submissions in *that vendor's* format only. Publishing into them deepens the dependency on the vendor's harness. A second harness cannot ingest the same listings without permission or scraping.
4. **No trust or provenance layer.** Installing a skill or tool from a stranger means giving it access to your shell, your repo, and your model. There is no standard for signing, attestation, or reputation across the ecosystem. Each user reinvents their own threat model.
5. **No versioning or dependency story.** Skills depend on tools. Sub-agents depend on skills. Prompts assume specific tool availability. None of this is expressed today. Updating one asset can silently break another, and there is no resolver to detect it.
6. **Authors face an O(n) maintenance burden.** A maintainer who wants their work to reach the whole community must publish into every vendor marketplace separately, in every vendor's format, and keep them in sync as the asset evolves. Most authors do not, and the community sees a fraction of what exists.

These problems compound. Format fragmentation makes distribution harder. Distribution being ad hoc makes trust harder. Lack of trust makes the vendor marketplaces, which at least offer some review, feel safer, which deepens lock-in, which makes fragmentation worse.

## Intended audience

Canopy is built for three groups, in roughly this order:

- **Asset authors.** Engineers and prompt-writers who build skills, tools, or sub-agents and want them to reach users on any harness without maintaining three copies. This is the group whose pain is most acute and most directly solvable, and because we own the adapters, it is the group we can make the strongest promise to.
- **Harness users.** Developers running Nanocoder, Claude Code, Codex, or a similar tool who want to install community-built assets the way they install npm packages or VS Code extensions.
- **Harness maintainers.** The teams building agent harnesses themselves. Unlike earlier drafts, we do **not** depend on them. A maintainer adopting Canopy natively is a bonus that lowers our maintenance load; it is not the path to adoption.

Worth naming explicitly: this is **not** built for end-users who do not configure their own agents. If your relationship with AI is "I open the app and type," Canopy is upstream of you.

## Principles

- **Portability is the product.** An asset that only runs on one harness has no business being published here. The format must be designed for translation, not for any single runtime.
- **Open by default.** The manifest spec, the catalogue protocol, and the signing scheme are all open. Anyone can self-host a catalogue. Anyone can write a new harness adapter without asking permission.
- **No single point of capture.** The reference catalogue exists to bootstrap the ecosystem, not to own it. Because v0 is git-based, mirroring and self-hosting are free side effects, not phase-two features. A curated publish path (review on the reference catalogue) and an open format are not in tension: the gate is on *our* catalogue's quality, not on the right to run your own.
- **Trust must be legible.** Users installing an asset should be able to see, in one place, who published it, what it can do, what it depends on, and whether the signature checks out. We do not invent reputation; we surface provenance.

## Threat model

**In scope:**

- Malicious assets that try to exfiltrate data, run unintended commands, or escalate privileges inside a harness.
- Typosquatting and namespace confusion at the catalogue level.
- Supply-chain attacks on the manifest itself (tampered downloads, modified post-publish).
- Dependency confusion when an asset pulls in tools or sub-agents from elsewhere.

**Out of scope:**

- Securing the harness itself. We assume each harness already enforces its own permission model around tools and shell access. Canopy cannot make an insecure harness secure.
- Vetting asset *quality* (does it work well, is the prompt good). Our PR review catches the obviously broken and the obviously malicious; it does not certify quality. That remains a reputation and review problem, not a packaging one.
- Secret distribution. Assets must not carry secrets. Anything that needs an API key gets it from the user's environment at install or run time.
- Model hosting or inference. Canopy ships packaging, not weights.

## Proposed approach

Three pieces, designed to ship independently and compose:

1. **A manifest format.** A single YAML or JSON file at the root of every asset that declares what the asset is (skill, tool, prompt, sub-agent, or a bundle of these), what capabilities it needs (filesystem, network, shell, specific MCP servers), what it depends on, and how to install it. The format is intentionally minimal at v0: enough to round-trip between two harnesses, not enough to encode every harness's quirks.
2. **A catalogue.** At v0 the catalogue is a **git repository**, and publishing happens through **pull requests**. A PR gives us a human review checkpoint and clean provenance for free, reuses infrastructure everyone already understands, and means we do not have to build or operate a bespoke registry service to launch. Automated scanning runs on every PR as a second layer. A standalone registry service is a later phase, added if and when scale demands it, not a v0 dependency.
3. **Harness adapters, owned by the collective.** Small per-harness shims that translate in both directions: they read a manifest and produce the on-disk shape a harness expects (install), and they read a harness's native files and produce a manifest-ready package (import). We build and maintain the first set ourselves rather than waiting on harness vendors. This is where the portability promise is actually kept, and owning it is what turns adoption from a hope into a deliverable.

A user flow looks like this: an author already has a skill in their Claude Code skills directory, so they run `canopy import` and the Claude Code adapter reads the native files and drafts a `canopy.yaml` manifest for them; they tidy it, add it at the root, and open a PR against the catalogue. CI scans the package, a reviewer looks at it, and on merge the manifest's hash is recorded in the catalogue index. A user on Nanocoder runs `canopy add code-review-pack`; the Nanocoder adapter resolves the package from the catalogue, verifies the recorded hash, resolves dependencies, translates the bundle into Nanocoder's native skill layout, and installs it. The same command, run inside Claude Code or Codex, produces a working install in that harness's format, using an adapter we maintain.

### Manifest deep-dive

The manifest is the load-bearing piece. If it is wrong, nothing else recovers. A v0 manifest covers:

- **Identity.** Name, version, author, content hash.
- **Kind.** `skill`, `tool`, `prompt`, `sub-agent`, or `bundle`. A bundle is a coherent set of the others.
- **Capabilities required.** Filesystem read/write paths, network access, shell commands, MCP servers. The harness uses these to decide what to prompt the user about at install time.
- **Dependencies.** Other packages this one needs, with version ranges.
- **Entry points.** For skills, the markdown file; for tools, the executable or MCP server; for sub-agents, the prompt and tool list.
- **Harness hints (optional).** Per-harness overrides for cases where the generic shape is wrong. These exist as escape valves but are discouraged.

What the manifest deliberately does *not* describe: execution semantics. We do not redefine how a harness runs a skill. We describe the *package*; the harness still owns the runtime.

### Catalogue deep-dive

The v0 catalogue is a git repository plus a publish workflow, not a service.

- **Publishing is a PR.** An author opens a pull request that adds their manifest (and, for small packages, the bundle itself; for larger ones, a fetchable reference). This is the default and only publish path at v0. The PR is where review and provenance happen at once.
- **Review is a human plus a scanner.** CI runs automated scanning on every PR: known-bad shell commands, unexpected network calls, capability declarations that do not match the contents, typosquatted names. A maintainer or trusted reviewer then signs off. **Scanning is a filter, not a guarantee.** A skill is mostly plain-English instructions, so a cleverly worded prompt that tells an agent to do something harmful is hard to catch automatically. We say this plainly so we do not oversell the safety story: the scan removes the obvious, review removes more, and neither certifies that an asset is safe or good.
- **The index records hashes.** On merge, the manifest's content hash lands in the catalogue index. That recorded hash is what `canopy` verifies at install time.
- **Mirroring and self-hosting are free.** Because the catalogue is a git repo referenced by fully-qualified name, anyone can fork, mirror, or run their own, public or private, with no permission from us. A self-hosted catalogue that tracks the collective's plus its own private assets is a first-class deployment mode on day one.

A bespoke HTTP registry, with fetch-time search, richer versioning semantics, and signature verification as a service, is a deliberate **later phase**. We add it only when the git-based path stops scaling, and the manifest format is designed so the move does not break published assets.

### Adapter deep-dive

Adapters are the per-harness translators, and the collective owns the first set. Each adapter works in two directions: **install** (take a manifest plus a destination harness and write the right files in the right places) and **import** (read a harness's native asset and produce a manifest-ready package). Import is what lets the catalogue fill up from work that already exists rather than only from assets authored against Canopy from day one. The starting set we commit to maintaining:

- **Claude Code adapter.** Installs manifests into the Claude Code skills directory and settings format, and imports an existing Claude Code skill folder into a draft manifest. Ships as a path within the `canopy` CLI.
- **Codex adapter.** Installs manifests into Codex's configuration layout, and imports an existing Codex configuration.
- **Nanocoder adapter.** Installs manifests into the Nanocoder skill, tool, and sub-agent layout, and imports an existing Nanocoder setup.

Import is deliberately a *draft* step, not a silent one-click publish. The adapter produces a best-effort `canopy.yaml` with capabilities and entry points inferred from the source files, and the author reviews and corrects it before opening a PR. Inference will not always be perfect (a harness-specific quirk may not map cleanly to the generic manifest), so the human stays in the loop rather than trusting the import blindly.

Owning these flips the project's central bet. Instead of hoping a harness maintainer builds an adapter, adoption becomes something we ship. The moment an author publishes a package to Canopy, a user can install it into any of these harnesses. Harness-maintainer-built adapters are welcome and reduce our load, but they are a bonus, not the plan.

Two things we are honest about in choosing this path:

- **The maintenance load lands on us.** Every time Claude Code, Codex, or Nanocoder changes its on-disk format, our adapter can break. Each adapter therefore ships with a drift test that installs a known asset and asserts the resulting layout, run in CI against each harness, so we catch breakage early rather than from user reports.
- **We write into harness config directories without the vendor's blessing.** That is precisely the vendor-hostility risk below. We decide our posture now: we write only into documented, user-owned config locations, we never modify the harness binary, and if a vendor objects we make the objection and its cost visible rather than quietly working around it.

## Design options

A few decisions are genuinely open and shape the project.

**1. Manifest format: YAML, JSON, or TOML.** YAML reads best for the multi-line prompts that show up in skills. JSON is the safest interchange format. TOML splits the difference. Leaning YAML, with a JSON schema for validation.

**2. Signing scheme: hash-only at v0, richer later.** v0 uses the simplest viable story: the manifest is hashed and the hash is recorded in the catalogue index on merge, so any later fetch can be checked against it. Combined with PR provenance (we know who opened the PR and what was reviewed), this is enough to launch. Keyless signing via Sigstore, minisign, or PGP is a later-phase decision, deferred precisely because anything beyond hash-in-index is real work we do not need at v0.

**3. Registry vs. git-as-registry: resolved toward git for v0.** Earlier drafts left this open and leaned "both." We now commit to git-as-registry as the v0 path: it is cheaper to bootstrap, harder to capture, gives PR review and provenance for free, and is the same surface authors already use. The manifest format stays neutral, so a bespoke registry service can be added later without breaking anything.

**4. How much harness-specific logic lives in the adapter vs. the manifest.** If adapters are thin, manifests carry per-harness escape hatches and bloat. If adapters are thick, the manifest stays clean but each harness is a non-trivial project. We favour thick adapters: the manifest stays the universal contract. This matters more now that we own the adapters, because the cost of thickness is ours to carry, but a clean universal manifest is worth it.

## Economics and operations

The v0 design is close to free to run, by construction. A git-based catalogue with PR publishing means the bulk of the cost is CI minutes for scanning and the human time to review, plus eventual storage if we host bundles rather than referencing them. There is no registry service to operate at v0, which removes the largest standing cost from earlier drafts.

The real ongoing cost is **adapter maintenance**: keeping Claude Code, Codex, and Nanocoder adapters working as those harnesses change. That is engineering time, not infrastructure spend, and it is the price of owning the portability guarantee.

Funding model, should infrastructure cost grow with adoption:

- **Sponsorship.** Costs covered by the collective's sponsors. Simple, but creates a dependency.
- **Pay-for-private.** Public assets free; private namespaces or organisational tiers paid. Standard package-registry pattern, relevant only once a service exists.
- **Federation as the answer.** The reference catalogue stays minimal and free; organisations that need more run their own. The collective never grows a billing surface.

The third is the most aligned with the principles and, given the git-based v0, the most natural default. The second becomes realistic only if and when a hosted service is built.

What Canopy will *not* do, at any point: take a cut of asset sales, run paid placement in search results, or charge authors to publish. (This is also why we avoid a commerce-flavoured name.)

## Architecture sketch

- **Manifest spec.** Versioned schema repository. JSON schema + prose. No code.
- **Catalogue.** A git repository plus a publish workflow: PR template, CI scanning, an index file that records names, versions, and content hashes. No standing service at v0.
- **CLI (`canopy`).** A small binary that imports, adds, searches, resolves, and verifies packages, and that calls the right adapter for the user's harness. Used directly by users and by authors preparing a PR.
- **Adapters.** Per-harness libraries, owned by the collective, that translate a manifest into a harness's config layout. Claude Code, Codex, and Nanocoder at launch, each with a CI drift test.
- **Web frontend (later).** Searchable catalogue, asset detail pages with provenance. Can render straight off the git index. Built into the docs site or as a sibling app when the catalogue is large enough to warrant it.

## Alternatives considered

- **Wait for a vendor to standardise.** Vendors are incentivised to lock in, not to standardise. Waiting yields nothing.
- **Depend on harness maintainers to build adapters.** This was the earlier plan and the project's largest existential risk: if no harness ships an adapter, Canopy is a publishing format with no consumers. Owning the adapters ourselves removes that dependency. The cost is maintenance load we now carry deliberately.
- **Publish everything as npm packages.** Works for tools written in JavaScript (MCP servers already do this) but has no concept of skills, prompts, or sub-agents. It also quietly assumes the Node.js ecosystem: a Python author, a Rust author, or a non-code asset like a prompt pack has no natural reason to publish into npm and no comfortable way to install from it. The same critique applies to PyPI, crates.io, or any other language-specific registry, and none of them are neutral ground. The package manager would also be carrying semantics it does not understand, and cross-language discoverability would be worse, not better.
- **Build it as a feature of a single harness (e.g., Nanocoder's package manager).** Solves the problem for Nanocoder users and reproduces the lock-in for everyone else. The whole point is to sit *between* harnesses, not inside one.
- **Run a fully open, ungated registry.** Rejected. With no review, the catalogue accumulates broken and malicious assets faster than reputation tooling can clean up. PR-based review is the cheaper, simpler, and safer default at v0.

## Competitive landscape

- **Anthropic's Skills directory.** Curated, high quality, Claude-only. Excellent inside its lane; structurally incapable of being the cross-harness layer.
- **Cursor Directory.** Same story for Cursor rules.
- **Smithery, Glama, and other MCP registries.** Closest neighbours. They solve the tool-distribution problem for MCP specifically. Canopy would interoperate with these (an MCP server is a valid asset kind) rather than compete.
- **GitHub repos with READMEs.** The current default, and the thing Canopy most directly displaces. Notably, our own v0 catalogue *is* a git repo, but with a manifest, a review gate, and adapters that make an asset installable everywhere, which a bare README is not.
- **npm / cargo / pip.** The analogy people reach for. They are not competitors; they are the existence proof that a packaging-plus-registry layer is the right shape for this problem.

The differentiator is not features. It is the refusal to be owned by any single harness vendor, backed by adapters we maintain so that refusal is real and not aspirational.

## Open risks

1. **Adapter maintenance load.** Owning the adapters removes the adoption risk but transfers a standing cost to us: when a harness changes its on-disk format, our adapter breaks. Mitigation is a per-harness drift test in CI, but if we cannot keep three adapters green, the portability guarantee erodes. This is now the central operational risk.
2. **Vendor hostility.** Because we write into harness config directories without vendor blessing, a vendor could discourage or technically block third-party installs through warnings, terms, or countermeasures. We cannot prevent this. Our posture: documented user-owned locations only, never touch the harness binary, and make any objection's cost visible.
3. **Manifest design churn.** The manifest is the contract. Getting it wrong in v0 and then changing it in v1 burns trust and breaks every published asset. We ship a deliberately *minimal* v0 and resist encoding every harness's quirks before we have learned which ones matter.
4. **Quality and abuse at scale.** PR review plus scanning filters the obvious, but scanning cannot catch a cleverly worded malicious prompt, and review does not scale infinitely. If submission volume outpaces reviewer capacity, the gate weakens. We treat scanning as a filter, not a solve, and plan for reputation tooling before volume forces the issue.

## Open questions

1. **Naming.** Largely addressed, not closed. *Canopy* is the lead name for both the project and the CLI (it describes the cross-harness layer and carries no commerce implication). We still want a short shortlist and a check that `canopy` does not collide with a common dev CLI before locking it in.
2. Should the manifest carry an explicit `runtime` field (e.g., "this skill assumes a coding harness, not a general chat harness") or do we leave the runtime fit implicit and let adapters refuse?
3. How aggressively do we court the MCP ecosystem, by making Canopy a strict superset of MCP server distribution, or by treating MCP as one asset-kind among several?
4. What is the realistic reviewer model for PR-based publishing as volume grows: core team only, trusted-contributor tier, or per-namespace owners?
5. When does the git-based catalogue stop scaling, and what is the trigger to build the hosted registry service?

## Next steps

Before this becomes a repository, the following need to land:

- [ ] Structure and design: a working sketch of how the manifest, git catalogue, `canopy` CLI, and adapters fit together end-to-end, with the seams between them named.
- [ ] Manifest spec v0: a draft JSON schema and a short prose specification, with at least three real-world assets modelled against it (one skill, one tool, one sub-agent).
- [ ] A working adapter prototype that imports an existing Claude Code skill into a draft manifest, then installs that manifest-described skill into Nanocoder and produces an identical-behaviour install back in Claude Code from the same source, each with a drift test.
- [ ] A catalogue repo with a PR template and a first-pass CI scanner, plus an index format that records content hashes.
- [ ] A decision on the realistic starting reviewer model.
- [ ] A name shortlist and a `canopy` CLI collision check (lead name: **Canopy**, for the project and CLI).

Scope, signing, governance, and catalogue topology remain open. What we are most sure of is the shape of the problem, and that owning the adapters and publishing through PRs is the simplest path that actually keeps the portability promise.
