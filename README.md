# Nano Docs

Official documentation site for Nano Collective projects. Built with Next.js and Nextra, this site fetches documentation **remotely from GitHub repositories** at build time.

## How It Works

### Architecture

This documentation site does **not** use local filesystem routing. Instead:

1. **Remote Fetching**: At build time, the site fetches documentation from each project's GitHub repository
2. **Version-based**: Docs are organized by GitHub release tags (e.g., `v1.0.0`)
3. **Automatic Discovery**: The site automatically discovers all `.md` and `.mdx` files in the `docs/` directory of each release

### Project Configuration

Projects are configured in `lib/projects.ts`:

```typescript
export const PROJECTS: ProjectConfig[] = [
  {
    id: "nanocoder",           // URL slug
    name: "Nanocoder",         // Display name
    description: "...",        // Project description
    repo: {
      owner: "Nano-Collective",  // GitHub owner
      name: "nanocoder",           // GitHub repo name
    },
    docsPath: "docs",          // Optional: custom docs folder (default: "docs")
  },
];
```

## Publishing Documentation

### Step 1: Add Your Project

If your project isn't already configured, add it to `lib/projects.ts`.

### Step 2: Create a Release

Documentation is fetched from **GitHub releases**. To publish docs:

1. Create a GitHub release with a tag (e.g., `v1.0.0`)
2. Add a `docs/` folder to your repository
3. Place your markdown files in `docs/`

### Step 3: Add Documentation Files

Place `.md` or `.mdx` files in your repository's `docs/` folder:

```
your-repo/
├── docs/
│   ├── index.md           # Homepage (appears as "Introduction")
│   ├── getting-started.md
│   ├── installation.md
│   └── api/
│       ├── overview.md
│       └── reference.md
└── src/
    └── ...
```

The sidebar automatically displays all files, organized by folder structure.

## Frontmatter

You can customize page titles, descriptions, ordering, and visibility using YAML frontmatter at the top of each markdown file:

```yaml
---
title: "Custom Page Title"
description: "Page description for SEO and search results"
sidebar_order: 1
hidden: false
---
```

### Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Custom page title (overrides auto-generated from filename) |
| `description` | string | Page description for SEO meta tags |
| `sidebar_order` | number | Numeric sort order in sidebar (lower = appears first) |
| `hidden` | boolean | Hide page from sidebar but keep accessible via direct link |

### Examples

**Custom title and description:**
```yaml
---
title: "Quick Start Guide"
description: "Get up and running in 5 minutes"
---
```

**Ordering pages:**
```yaml
---
# In getting-started.md
title: Getting Started
sidebar_order: 1
---
```
```yaml
# In api-reference.md
---
title: API Reference  
sidebar_order: 2
---
```

**Hidden pages (for redirects or internal content):**
```yaml
---
title: Legacy API
hidden: true
---
```

## URL Structure

Documentation URLs follow this pattern:

```
/[project]/docs/[version]/[path]

# Examples:
/nanocoder/docs/v1.0.0/getting-started
/nanocoder/docs/latest/installation
/nanotune/docs/v1.3.1/api/overview
```

- `[project]` - Project ID from config (e.g., `nanocoder`)
- `[version]` - GitHub release tag (e.g., `v1.0.0`) or `latest`
- `[path]` - Path to the markdown file (without extension)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Adding a New Project

1. Open `lib/projects.ts`
2. Add your project to the `PROJECTS` array:
   ```typescript
   {
     id: "your-project",
     name: "Your Project",
     description: "Brief description",
     repo: {
       owner: "YourOrg",
       name: "your-repo",
     },
   }
   ```
3. Create a GitHub release with a `docs/` folder
4. Run `npm run dev` to see your docs

## Requirements

- Node.js 18+
- GitHub account with access to project repositories
- GitHub releases with semantic version tags
