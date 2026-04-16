# Technical Stack

## Build System

This project uses **Make** for build and Git operations. There is no JavaScript build system (no Webpack, Vite, etc.) - apps are served as static files.

### Root Makefile Targets

| Command | Description |
|---------|-------------|
| `make` | Pull latest, stage all changes, commit (empty message), push |
| `make install-hooks` | Install pre-commit hook from `.githooks/pre-commit` |

### Front Makefile Targets (in `front/` directory)

| Command | Description |
|---------|-------------|
| `make release` | Minify JS, update build number, copy to nightly, commit, push |
| `make precommit` | Stage and commit all changes |
| `make minify` | Minify `front.js` to `front.min.js` |

## Tech Stack

### Core Framework: `front.js`

A custom low-code framework providing:

| Feature | Description |
|---------|-------------|
| `globalize` | Internationalization with JSON locale files |
| `data` | Declarative data fetching with `bindasset` |
| `navigate` | Client-side routing and navigation |
| `keyboard` | Keyboard navigation support |
| `chronotize` | Date/time handling |
| `math` | Calculator math functions |

### CSS Framework: `front.css`

CDN-hosted utility classes from `https://cdn.front.nu/dist/front.css`

### Common Modules Used

```
module="globalize;keyboard;math"           # Calculator
module="globalize;chronotize;data;navigate;keyboard"  # Dictionary
module="globalize;data;navigate;keyboard;chronotize"  # Chat
```

### Common Plugins Used

```
plugin="share;seold"  # Dictionary (sharing and SEO)
```

## Configuration via Script Tag

Apps configure the framework via a `<script>` tag in `<head>`:

```html
<script
  src="../../front/front.js"
  module="globalize;keyboard;math"
  var="api;enum"
  conf="debug:false;varsDir:assets/json/vars;storageKey:calc"
  globalize-conf="folder:assets/json/locales"
  navigate-conf="startpage:experimental/app/calc;startpageLocal:app/calc">
</script>
```

### Configuration Parameters

| Parameter | Description |
|-----------|-------------|
| `module` | Comma-separated framework modules to load |
| `var` | Comma-separated variable files to load from `assets/json/vars/` |
| `conf` | Framework configuration (debug, varsDir, storageKey, frontSrcLocal) |
| `globalize-conf` | Localization configuration (folder path) |
| `navigate-conf` | Navigation configuration (startpage paths) |

## Data Binding Syntax

The framework uses custom attributes for data binding:

| Attribute | Purpose |
|-----------|---------|
| `bindasset` | Bind asset data (API responses) to elements |
| `bindvar` | Bind variable data to elements |
| `globalize-get` | Localize text content |
| `globalize-target` | Localize attribute values (e.g., placeholder) |
| `onvaluechange` | Trigger actions when input value changes |
| `click` | Trigger actions on click |
| `include` | Include HTML fragments |

## External Dependencies

| Source | Description |
|--------|-------------|
| `https://cdn.front.nu/dist/front.css` | CSS framework |
| `https://cdn.front.nu/dist/design/material/icons/material.woff` | Material Icons |
| `../../front/front.js` | Local framework copy (for development) |

## Common Commands

```bash
# Install Git hooks
make install-hooks

# Update code (pull, commit, push)
make

# Build and release front framework
cd front && make release

# Minify front framework
cd front && make minify
```