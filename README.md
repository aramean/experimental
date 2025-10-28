# Front: Low-Code Framework

This project automates builds and Git workflow using `Makefile`. It provides commands for pulling, committing, pushing code, installing Git hooks, building releases, and minifying JavaScript files.

---

## Table of Contents

- [Root Makefile](#root-makefile)
- [Front Makefile](#front-makefile)
- [Setup](#setup)
- [Usage](#usage)
- [Project Workflow](#project-workflow)
- [Notes](#notes)

---

## Root Makefile

The root `Makefile` handles Git operations and installing Git hooks.

### Targets

- **default**  
  Pulls the latest changes, stages all changes, commits (even if empty), and pushes.

  ```bash
  make
  ```

- **install-hooks**  
  Installs the pre-commit Git hook located in `.githooks/pre-commit`.

  ```bash
  make install-hooks
  ```

---

## Front Makefile

The `front/Makefile` manages JavaScript builds and releases.

### Variables

- **JS_FILE**: Source JavaScript file (`front.js`)  
- **MIN_FILE**: Minified JavaScript output (`front.min.js`)  
- **TAG**: Automatically increments the build number in `front.js`  

### Targets

- **release**  
  Runs precommit, minifies JS, updates the build number, copies files to the nightly folder, commits, and pushes.

  ```bash
  make release
  ```

- **precommit**  
  Adds all changes and commits with an empty message.

  ```bash
  make precommit
  ```

- **minify**  
  Minifies the JavaScript file using pure Bash (removes comments, extra spaces, and blank lines).

  ```bash
  make minify
  ```

---

## Setup

1. Install Git hooks:

   ```bash
   make install-hooks
   ```

2. Ensure the pre-commit hook is executable:

   ```bash
   chmod +x .git/hooks/pre-commit
   ```

---

## Usage

- **Pull, commit, and push changes**

  ```bash
  make
  ```

- **Build and release front-end**

  ```bash
  cd front
  make release
  ```

- **Minify JavaScript manually**

  ```bash
  cd front
  make minify
  ```

---

## Project Workflow

1. **Root folder**  
   - Handles Git operations (pull, commit, push)  
   - Installs pre-commit hooks  

2. **Front folder**  
   - Builds and minifies `front.js`  
   - Automatically increments build number  
   - Copies files to nightly folder (`../../front/nightly/`)  
   - Commits and pushes release  

3. **Nightly folder**  
   - Contains the latest JS files, plugins, and modules ready for nightly deployment  

```
Root Makefile
   │
   ├─ install-hooks → .git/hooks/pre-commit
   │
   └─ default → git pull, add, commit, push
Front Makefile
   │
   ├─ precommit → add & commit
   ├─ minify → front.min.js
   └─ release → update build, copy to nightly, git commit & push
```

---

## Notes

- Nightly release folder: `../../front/nightly/`
- Build numbers in `front.js` are automatically incremented on each release.
- Pre-commit ensures all changes are staged before release.
- The minify step uses only Bash, removing comments, extra whitespace, and empty lines.