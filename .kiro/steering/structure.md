# Project Structure

```
.
├── .kiro/
│   └── steering/          # Steering documents (product.md, tech.md, structure.md)
├── .git/
├── .githooks/             # Git hooks (pre-commit)
├── .vscode/               # VS Code settings
├── app/                   # Application directory
│   ├── calc/              # Calculator app
│   ├── charmap/           # Character map app
│   ├── chat/              # Chat app
│   ├── code/              # Code editor app
│   ├── dictionary/        # Dictionary app
│   ├── map/               # Map app
│   ├── note/              # Note-taking app
│   ├── stream/            # Streaming media app
│   ├── todo/              # Todo list app
│   └── weather/           # Weather app
├── front/                 # Shared front.js framework
│   ├── front.js           # Main framework file
│   ├── front.css          # CSS framework
│   └── nightly/           # Nightly release directory
├── Makefile               # Root Makefile for git operations
└── README.md
```

## App Directory Structure

Each app in `app/{app-name}/` follows this pattern:

```
app/{app-name}/
├── index.html              # Main entry point
├── {optional-page}.html    # Additional pages (e.g., search.html, word.html)
├── assets/
│   ├── css/
│   │   └── app.css         # App-specific styles (optional)
│   ├── json/
│   │   ├── locales/        # Localization files
│   │   │   ├── en.json     # English translations
│   │   │   ├── sv.json     # Swedish translations
│   │   │   └── arc.json    # Aramaic translations (calc only)
│   │   └── vars/
│   │       ├── api.json    # API configuration (keys, endpoints)
│   │       └── enum.json   # Enumerations and constants
│   ├── fonts/              # Custom web fonts (dictionary, charmap)
│   └── img/                # Images (stream app)
│   └── json/               # Additional JSON data (stream, map)
├── includes/               # Reusable HTML fragments
│   ├── sidebar.html
│   ├── form.html
│   ├── posts.html
│   └── catalog.html
└── templates/              # HTML templates
    ├── lists.html
    ├── movie.html
    ├── people.html
    └── shows.html
```

## Asset Organization

### JSON Variables (`assets/json/vars/`)

| File | Purpose | Apps Using |
|------|---------|------------|
| `api.json` | API keys and endpoints | chat, code, dictionary, map, note, stream |
| `enum.json` | Constants and enumerations | calc, charmap, dictionary |

### JSON Locales (`assets/json/locales/`)

| File | Purpose | Apps Using |
|------|---------|------------|
| `en.json` | English translations | All apps |
| `sv.json` | Swedish translations | All apps |
| `arc.json` | Aramaic translations | calc only |

## Shared Resources

### Front Framework (`front/`)

```
front/
├── front.js              # Main framework (includes all modules)
├── front.css             # CSS utility classes
└── nightly/              # Nightly releases
    ├── front.js
    ├── front.css
    └── plugins/
```

### CSS Utility Classes

The framework provides these common utility classes:

| Class | Purpose |
|-------|---------|
| `fdc` | Flex direction column |
| `fwb` | Flex wrap break |
| `tac` | Text align center |
| `p1-` | Padding 1 unit |
| `m0a` | Margin 0 auto (center) |
| `h100p` | Height 100% |
| `w100` | Width 100% |
| `w100p` | Width 100% (percentage) |
| `zi50` | Z-index 50 |
| `bc*` | Background color utilities |
| `white` | White text color |
| `dark` | Dark theme class |
| `light` | Light theme class |

## Navigation Pattern

Apps use the `navigate` module with this pattern:

```html
<script navigate-conf="startpage:experimental/app/{app};startpageLocal:app/{app}">
```

This allows apps to be accessed via:
- `experimental/app/{app}/` (production path)
- `app/{app}/` (local development path)

## Template System

Templates are defined in `<template>` tags and included via `include` attribute:

```html
<template>
  <aside>
    <div include="includes/sidebar.html"></div>
  </aside>
  <main class="pauto"></main>
</template>
```

## State Management

Apps use the framework's state system:

```html
<input
  statevalue="0"
  onstatevaluechangeif="/[0-9]+/;#result;set[0]"
  onvaluechange="sanitize:[^0+(?=\d)|[^0-9,]|(,)(?=.*,)]"
>
```

## Localization Pattern

```html
<!-- Localize text content -->
<span globalize-get>Randomize word</span>

<!-- Localize placeholder attribute -->
<input globalize-get="input_search" globalize-target="placeholder">

<!-- Change language -->
<select onvaluechange="globalize-set">
  <option value="en">English</option>
  <option value="sv">Svenska</option>
</select>
```