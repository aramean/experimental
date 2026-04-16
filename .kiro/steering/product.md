# Product Overview

This is a **Low-Code Framework** project containing multiple standalone web applications ("apps") that share a common infrastructure. Each app is a self-contained web application with its own HTML, CSS, JavaScript, and localization resources.

## Key Characteristics

- **Multiple Apps**: The project contains 10+ distinct web applications (calc, charmap, chat, code, dictionary, map, note, stream, todo, weather)
- **Shared Infrastructure**: All apps use a common `front.js` framework and `front.css` from `../../front/`
- **No Build System per App**: Individual apps don't have their own build processes - they rely on the shared `front.js` framework
- **Static File Structure**: Each app is a self-contained directory with assets, includes, and templates

## App Structure Pattern

Each app follows this structure:
```
app/{app-name}/
├── index.html              # Main entry point
├── assets/
│   ├── css/               # App-specific styles
│   ├── json/              # Configuration and localization data
│   │   ├── locales/       # Language translations
│   │   └── vars/          # API keys, enums, configuration
│   └── fonts/             # Custom fonts (if needed)
├── includes/              # Reusable HTML fragments
└── templates/             # HTML templates
```

## Technology Stack

- **Framework**: `front.js` - A custom low-code framework providing:
  - Declarative UI with data-binding
  - Globalization/localization
  - Data fetching and state management
  - Keyboard navigation
  - Navigation system
- **Styling**: Custom CSS with utility classes from `front.css`
- **Icons**: Material Icons via CDN
- **Fonts**: Custom web fonts for specific apps (dictionary, charmap)

## Development Workflow

- **Git-based**: Uses Makefile for git operations (pull, commit, push)
- **Pre-commit hooks**: Custom pre-commit hook in `.githooks/pre-commit`
- **Nightly releases**: Front framework releases to `../../front/nightly/`