---
title: "Marketplace (working title)"
description: "A working whitepaper for an open, harness-agnostic marketplace and packaging format for agent assets (skills, tools, prompts, sub-agents) that can be installed into any agent harness without rewriting"
sidebar_order: 6
proposer: "Matt Spence"
proposer_github: "mrspence"
status: "In public review"
review_opens: "2026-05-27"
review_closes: "2026-06-26"
---

# Marketplace (working title)

The agent ecosystem is fragmenting along harness lines. A skill written for Claude Code is a folder of markdown with a specific frontmatter shape. A Nanocoder skill is a different folder with different conventions. A Cursor rule lives in `.cursor/rules` and follows yet another schema. An Aider configuration, a Continue.dev recipe, a Goose toolkit, an OpenAI Assistants definition: every harness has invented its own format for what is, underneath, the same kind of thing, a packaged unit of agent behaviour.

The result is that the people doing the most interesting work, building skills, MCP tools, prompt packs, specialist sub-agents, have nowhere portable to publish it. They either pick a harness and accept the lock-in, fork their work across three formats and maintain all of them, or hide it in a GitHub repo with a README that says *"copy this folder into your config."* None of these scale. None of them let a single high-quality asset reach the whole community.

This whitepaper proposes a project to build the missing layer: a portable manifest format for agent assets, a reference registry where those assets can be published and discovered, and a small set of adapters that translate a manifest into whatever the user's harness actually expects. The goal is that an author writes a skill once, publishes it once, and any harness (Nanocoder, Claude Code, Cursor, or one that does not yet exist) can install and run it.

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

The marketplace is built for three groups, in roughly this order:

- **Asset authors.** Engineers and prompt-writers who build skills, tools, or sub-agents and want them to reach users on any harness without maintaining three copies. This is the group whose pain is most acute and most directly solvable.
- **Harness users.** Developers running Nanocoder, Claude Code, or a similar tool who want to install community-built assets the way they install npm packages or VS Code extensions. The marketplace exists for them, but only works if authors show up first.
- **Harness maintainers.** The teams building agent harnesses themselves. The marketplace asks them to support an open install format alongside (not instead of) their native one. Adoption here is the leverage point: one harness adapter unlocks the whole catalogue for that harness's users.

Worth naming explicitly: this is **not** built for end-users who do not configure their own agents. If your relationship with AI is "I open the app and type," the marketplace is upstream of you.

## Principles

- **Portability is the product.** An asset that only runs on one harness has no business being published here. The format must be designed for translation, not for any single runtime.
- **Open by default.** The manifest spec, the registry protocol, and the signing scheme are all open. Anyone can self-host a registry. Anyone can write a new harness adapter without asking permission.
- **No single point of capture.** The reference registry exists to bootstrap the ecosystem, not to own it. Federation, mirroring, and self-hosting are first-class concerns from day one, not phase-two features.
- **Trust must be legible.** Users installing an asset should be able to see, in one place, who published it, what it can do, what it depends on, and whether the signature checks out. We do not invent reputation; we surface provenance.

## Threat model

**In scope:**

- Malicious assets that try to exfiltrate data, run unintended commands, or escalate privileges inside a harness.
- Typosquatting and namespace confusion at the registry level.
- Supply-chain attacks on the manifest itself (tampered downloads, modified post-publish).
- Dependency confusion when an asset pulls in tools or sub-agents from elsewhere.

**Out of scope:**

- Securing the harness itself. We assume each harness already enforces its own permission model around tools and shell access. The marketplace cannot make an insecure harness secure.
- Vetting asset *quality* (does it work well, is the prompt good). That is a reputation and review problem, not a packaging problem.
- Secret distribution. Assets must not carry secrets. Anything that needs an API key gets it from the user's environment at install or run time.
- Model hosting or inference. The marketplace ships packaging, not weights.

## Proposed approach

Three pieces, designed to ship independently and compose:

1. **A manifest format.** A single YAML or JSON file at the root of every asset that declares what the asset is (skill, tool, prompt, sub-agent, or a bundle of these), what capabilities it needs (filesystem, network, shell, specific MCP servers), what it depends on, and how to install it. The format is intentionally minimal at v0: enough to round-trip between two harnesses, not enough to encode every harness's quirks.
2. **A registry.** A reference implementation of a small HTTP service that hosts manifests, serves search and resolve queries, and verifies signatures. The reference registry is run by the collective and federates with anyone who wants to mirror or run their own.
3. **Harness adapters.** Small per-harness shims (one per supported harness) that read a manifest and produce the on-disk shape that harness expects. Adapters are the integration surface; they are where the portability promise is actually kept.

A user flow looks like this: an author writes a skill, adds a `marketplace.yaml` manifest at the root, signs the bundle, and pushes it to the registry. A user on Nanocoder runs the marketplace install command (final binary name TBD, see open questions) against `code-review-pack`; the Nanocoder adapter pulls the manifest, verifies the signature, resolves dependencies, translates the bundle into Nanocoder's native skill layout, and installs it. The same command, run inside Claude Code or any other adapted harness, produces a working install in that harness's format.

### Manifest deep-dive

The manifest is the load-bearing piece. If it is wrong, nothing else recovers. A v0 manifest covers:

- **Identity.** Name, version, author, signature.
- **Kind.** `skill`, `tool`, `prompt`, `sub-agent`, or `bundle`. A bundle is a coherent set of the others.
- **Capabilities required.** Filesystem read/write paths, network access, shell commands, MCP servers. The harness uses these to decide what to prompt the user about at install time.
- **Dependencies.** Other marketplace assets this one needs, with version ranges.
- **Entry points.** For skills, the markdown file; for tools, the executable or MCP server; for sub-agents, the prompt and tool list.
- **Harness hints (optional).** Per-harness overrides for cases where the generic shape is wrong. These exist as escape valves but are discouraged.

What the manifest deliberately does *not* describe: execution semantics. We do not redefine how a harness runs a skill. We describe the *package*; the harness still owns the runtime.

### Registry deep-dive

The reference registry is small on purpose. It hosts manifests and asset bundles, verifies signatures on publish, exposes a JSON API for search and resolve, and serves a static index that can be mirrored to a CDN. It does not run code. It does not host model traffic. It does not gate publication behind editorial review at v0. Moderation is a reactive layer, not a gating one.

Federation works the way it works for container registries or package mirrors: the manifest references a fully-qualified name (`registry.example.org/author/skill@1.2.3`), and any registry that holds that asset can serve it. A self-hosted registry that mirrors the collective's plus its own private assets is a first-class deployment mode.

### Adapter deep-dive

Adapters are the per-harness translators. Each adapter is a small library (or a binary the harness shells out to) that takes a manifest plus a destination harness and writes the right files in the right places. The first two adapters we plan to build:

- **Nanocoder adapter.** Translates manifests into the Nanocoder skill, tool, and sub-agent layout. Lives in the Nanocoder repo or as a sibling.
- **Claude Code adapter.** Translates manifests into the Claude Code skills directory and settings format. Ships as a standalone CLI a user can run.

Beyond those, the bet is that maintainers of other harnesses will write their own adapters once the catalogue is large enough to be worth integrating with. We do not control whether they do.

## Design options

A few decisions are genuinely open and shape the project.

**1. Manifest format: YAML, JSON, or TOML.** YAML reads best for the multi-line prompts that show up in skills. JSON is the safest interchange format. TOML splits the difference. Leaning YAML, with a JSON schema for validation.

**2. Signing scheme: Sigstore, minisign, or PGP.** Sigstore offers keyless signing tied to OIDC identities, which lowers the bar for authors but adds a dependency on the Sigstore infrastructure. Minisign is the simplest. PGP is the most familiar and the most painful. No decision yet.

**3. Registry vs. git-as-registry.** A real registry gives us search, versioning semantics, and signature verification at fetch time. Git-as-registry (where assets live in normal repos and are pulled by URL + tag) is cheaper to bootstrap and harder to capture. The current lean is *both*: the manifest format works either way, and the reference registry is one way to serve manifests rather than the only one.

**4. How much harness-specific logic lives in the adapter vs. the manifest.** If adapters are thin, manifests carry per-harness escape hatches and bloat. If adapters are thick, the manifest stays clean but each harness is a non-trivial project. We favour thick adapters: the manifest stays the universal contract.

## Economics and operations

The reference registry costs money to run: storage, bandwidth, signature verification compute, and the moderation work that follows any abuse complaint. Order-of-magnitude, this is small at the start (gigabytes, not terabytes) and grows with adoption.

Funding model is unresolved. Options on the table:

- **Sponsorship.** Costs covered by the collective's sponsors. Simple, but creates a dependency.
- **Pay-for-private.** Public assets free; private namespaces or organisational tiers paid. Standard package-registry pattern.
- **Federation as the answer.** The reference registry stays minimal and free; organisations that need more run their own. The collective never grows a billing surface.

The third is the most aligned with the principles and the most operationally constrained. The second is the most realistic if adoption scales.

What the marketplace will *not* do, at any point: take a cut of asset sales, run paid placement in search results, or charge authors to publish.

## Architecture sketch

- **Manifest spec.** Versioned schema repository. JSON schema + prose. No code.
- **Registry service.** Small HTTP server (likely Rust or Go), object storage for asset bundles, Postgres or sqlite for the index. Reads-mostly. Cacheable behind a CDN.
- **CLI.** A small `marketplace` binary that publishes, searches, resolves, and verifies. Used directly by authors and called by adapters.
- **Adapters.** Per-harness libraries that wrap the CLI and write to the harness's config directory. Maintained either by the harness team or by the collective, depending on who is faster.
- **Web frontend.** Searchable catalogue, asset detail pages with provenance, sign-in only required to publish. Likely built into the existing docs site or as a sibling app.

## Alternatives considered

- **Wait for a vendor to standardise.** Vendors are incentivised to lock in, not to standardise. Waiting yields nothing.
- **Publish everything as npm packages.** Works for tools written in JavaScript (MCP servers already do this) but has no concept of skills, prompts, or sub-agents. It also quietly assumes the Node.js ecosystem: a Python author, a Rust author, or a non-code asset like a prompt pack has no natural reason to publish into npm and no comfortable way to install from it. The same critique applies to PyPI, crates.io, or any other language-specific registry, and none of them are neutral ground. The package manager would also be carrying semantics it does not understand, and cross-language discoverability would be worse, not better.
- **Build it as a feature of a single harness (e.g., Nanocoder's package manager).** Solves the problem for Nanocoder users and reproduces the lock-in for everyone else. The whole point is to sit *between* harnesses, not inside one.

## Competitive landscape

- **Anthropic's Skills directory.** Curated, high quality, Claude-only. Excellent inside its lane; structurally incapable of being the cross-harness layer.
- **Cursor Directory.** Same story for Cursor rules.
- **Smithery, Glama, and other MCP registries.** Closest neighbours. They solve the tool-distribution problem for MCP specifically. The marketplace would interoperate with these (an MCP server is a valid asset kind) rather than compete.
- **GitHub repos with READMEs.** The current default, and the thing the marketplace most directly displaces.
- **npm / cargo / pip.** The analogy people reach for. They are not competitors; they are the existence proof that a packaging-plus-registry layer is the right shape for this problem.

The differentiator is not features. It is the refusal to be owned by any single harness vendor.

## Open risks

1. **Harness adoption.** If no harness ships an adapter, the marketplace is a publishing format with no consumers. Nanocoder is committed; Claude Code is uncertain (depends on whether they tolerate a third-party tool writing into their skills directory); everything else is speculative. **This is the existential risk.** If we cannot land at least three real harness adapters in the first year, the project does not have a path.
2. **Manifest design churn.** The manifest is the contract. Getting it wrong in v0 and then changing it in v1 burns trust and breaks every published asset. We need to ship a deliberately *minimal* v0 and resist the urge to encode every harness's quirks before we have learned which ones matter.
3. **Quality and abuse at scale.** A registry with no editorial gate will accumulate broken, low-quality, and outright malicious assets. Provenance and signing help; they do not solve. If the catalogue becomes a swamp before reputation tooling catches up, users stop trusting it and adoption collapses.
4. **Vendor hostility.** A harness vendor could actively discourage their users from installing assets from outside their own marketplace, through warnings, terms of service, or technical countermeasures. We cannot prevent this. We can make the cost of doing it visible.

## Open questions

1. What is the minimum viable signing story for v0? Anything beyond "the manifest is hashed and the hash is in the registry index" is real work.
2. Should the manifest carry an explicit `runtime` field (e.g., "this skill assumes a coding harness, not a general chat harness") or do we leave the runtime fit implicit and let adapters refuse?
3. How aggressively do we want to court the MCP ecosystem, by making the marketplace a strict superset of MCP server distribution, or by treating MCP as one asset-kind among several?
4. Naming. *"Marketplace"* is generic and SEO-poor, and the install-command name needs to avoid conflicts with existing CLIs (the obvious short ones, `nano`, `pkg`, `agent`, are all taken or ambiguous). Open.

## Next steps

Before this becomes a repository, the following need to land:

- [ ] Structure and design: a working sketch of how the manifest, registry, CLI, and adapters fit together end-to-end, with the seams between them named. Flexible; the point is to expose the shape so it can be argued with.
- [ ] Manifest spec v0: a draft JSON schema and a short prose specification, with at least three real-world assets modelled against it (one skill, one tool, one sub-agent).
- [ ] A working adapter prototype that installs a manifest-described skill into Nanocoder and produces an identical-behaviour install in Claude Code from the same source.
- [ ] A go/no-go conversation with at least one external harness maintainer about whether they would accept an adapter for their tool.
- [ ] A decision on the signing scheme.
- [ ] A name (for both the project and the install command).

Naming, scope, signing, governance, and registry topology are all open. The thing we are most sure of is the shape of the problem.
