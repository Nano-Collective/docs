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

## Writing Documentation

### Directory Structure

Place `.md` or `.mdx` files in your repository's `docs/` folder:

```
your-repo/
├── docs/
│   ├── index.md              # Root page (Introduction)
│   ├── commands.md            # Top-level page
│   ├── getting-started/
│   │   ├── index.md           # Folder overview page
│   │   ├── installation.md
│   │   └── uninstalling.md
│   └── features/
│       ├── index.md           # Folder overview page
│       ├── custom-commands.md
│       └── task-management.md
└── src/
    └── ...
```

- `index.md` in the root `docs/` folder becomes the Introduction page
- `index.md` in a subfolder becomes that folder's overview/default page
- The sidebar is built automatically from the folder structure

### Frontmatter

Control page titles, descriptions, ordering, and visibility using YAML frontmatter:

```yaml
---
title: "Custom Page Title"
description: "Page description for SEO and search results"
sidebar_order: 1
hidden: false
---
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Custom page title (overrides auto-generated title from filename) |
| `description` | string | Page description for SEO meta tags |
| `sidebar_order` | number | Numeric sort order in sidebar (lower number = appears first) |
| `hidden` | boolean | Hide page from sidebar but keep accessible via direct URL |

### Sidebar Ordering

Sidebar ordering is controlled by the `sidebar_order` frontmatter field. Pages without `sidebar_order` appear last.

**For regular pages**, `sidebar_order` controls the page's position among its siblings:

```yaml
# docs/commands.md
---
title: "Commands"
sidebar_order: 6
---
```

**For folders**, the `sidebar_order` in the folder's `index.md` controls the folder's position in its parent. The index page itself is always displayed first within the folder:

```yaml
# docs/getting-started/index.md
---
title: "Getting Started"
sidebar_order: 2
---
```

This means `sidebar_order: 2` positions the "Getting Started" **folder** as the 2nd item in the root sidebar. Inside the folder, the index page (overview) is always first, and other pages are sorted by their own `sidebar_order`.

**Full example:**

```
docs/
├── index.md                    # sidebar_order: 1  → 1st in root
├── getting-started/
│   ├── index.md                # sidebar_order: 2  → folder is 2nd in root
│   ├── installation.md         # sidebar_order: 2  → 2nd in folder
│   └── uninstalling.md         # sidebar_order: 3  → 3rd in folder
├── configuration/
│   ├── index.md                # sidebar_order: 3  → folder is 3rd in root
│   ├── providers.md            # sidebar_order: 2  → 2nd in folder
│   └── preferences.md          # sidebar_order: 3  → 3rd in folder
├── commands.md                 # sidebar_order: 5  → 5th in root
└── community.md                # sidebar_order: 6  → 6th in root
```

**Hidden pages:**

```yaml
---
title: "Legacy API"
hidden: true
---
```

Hidden pages are excluded from the sidebar but remain accessible via direct URL.

## Publishing Documentation

### Step 1: Add Your Project

If your project isn't already configured, add it to `lib/projects.ts`.

### Step 2: Create Documentation

Add a `docs/` folder to your repository with `.md` or `.mdx` files. Use frontmatter to control titles and ordering.

### Step 3: Create a Release

Documentation is fetched from **GitHub releases**. Create a GitHub release with a semantic version tag (e.g., `v1.0.0`). The site automatically picks up the latest patch release for each minor version.

## URL Structure

```
/[project]/docs/[version]/[path]

# Examples:
/nanocoder/docs/v1.0.0/getting-started
/nanocoder/docs/latest/installation
/nanotune/docs/v1.3.1/configuration/providers
```

- `[project]` - Project ID from config (e.g., `nanocoder`)
- `[version]` - GitHub release tag (e.g., `v1.0.0`) or `latest`
- `[path]` - Path to the markdown file (without extension)

## Development

```bash
# Install dependencies
npm install

# Create .env.local with a GitHub token (required to avoid API rate limits)
echo "GITHUB_TOKEN=ghp_your_token_here" > .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

In development mode, docs are fetched from the `main` branch of each project repository. In production, docs are fetched from GitHub release tags.

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
- GitHub personal access token (set as `GITHUB_TOKEN` in `.env.local`)
- GitHub releases with semantic version tags
