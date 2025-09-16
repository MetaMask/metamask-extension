# Yarn Binary Management

This document describes how to manage yarn versions for the MetaMask extension project using native Corepack commands, ensuring consistent versions across development and CI/CD environments.

## Overview

The MetaMask extension uses native Corepack commands to manage yarn versions. This system:

- **Reads version from package.json** - Single source of truth via `packageManager` field
- **Uses native corepack commands** - Direct use of built-in `corepack prepare` and `corepack hydrate`
- **Commits tarballs for offline use** - No network dependencies in CI/CD
- **Activates versions automatically** - No manual configuration needed

## Quick Start

```bash
# Download and activate yarn version (reads from package.json)
yarn yarn-binary:download

# Or activate existing committed version
yarn yarn-binary:hydrate

# Verify installation
yarn --version  # Should show version from package.json packageManager field
```

## Available Commands

### Package.json Scripts

```bash
# Download yarn tarball and activate version
yarn yarn-binary:download

# Activate existing committed tarball
yarn yarn-binary:hydrate
```

These scripts are implemented as native corepack commands in package.json:

```json
{
  "scripts": {
    "yarn-binary:download": "corepack pack -o .yarn/yarn-corepack.tgz && corepack hydrate .yarn/yarn-corepack.tgz --activate",
    "yarn-binary:hydrate": "corepack hydrate .yarn/yarn-corepack.tgz --activate"
  }
}
```

## How It Works

### 1. Version Detection

The scripts automatically read the yarn version from `package.json`:

```json
{
  "packageManager": "yarn@4.9.4"
}
```

### 2. Download Process (`yarn-binary:download`)

The download command performs these steps:

1. **`corepack pack -o .yarn/yarn-corepack.tgz`**
   - Automatically reads version from package.json packageManager field
   - Downloads the specified yarn version
   - Creates `yarn-corepack.tgz` directly in the .yarn directory

2. **`corepack hydrate .yarn/yarn-corepack.tgz --activate`**
   - Activates the yarn version from the tarball
   - No configuration files needed

### 3. Hydrate Process (`yarn-binary:hydrate`)

The hydrate command activates an existing tarball:

1. **`corepack hydrate .yarn/yarn-corepack.tgz --activate`**
   - Activates the existing committed tarball
   - No download needed - uses committed file
   - Version is determined automatically from the tarball contents

## Workflows

### Version Updates

```bash
# 1. Update package.json
{
  "packageManager": "yarn@4.9.5"
}

# 2. Download and commit new version
yarn yarn-binary:download
yarn yarn-binary:hydrate  # Activate the new version
git add .yarn/yarn-corepack.tgz
git commit -m "Update yarn to 4.9.5"
```

### CI/CD Setup

```yaml
# GitHub Actions example
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'

  - name: Activate committed yarn version
    run: yarn yarn-binary:hydrate

  - name: Install dependencies
    run: yarn install

  - name: Build
    run: yarn build
```

### Development - Version Switching

```bash
# Switch to different committed version
# 1. Edit package.json
"packageManager": "yarn@4.9.1"

# 3. Download the new version
yarn yarn-binary:download

# 2. Activate
yarn yarn-binary:hydrate

# 3. Verify
yarn --version  # Shows 4.9.1
```

## File Structure

```text
.yarn/
├── yarn-corepack.tgz          # Committed tarball (version determined by package.json)
└── [other yarn files...]

package.json                   # Contains packageManager version and scripts
```

## Troubleshooting

### Tarball Not Found

If you get an error about missing tarball:

```bash
# Download and create the tarball first
yarn yarn-binary:download
```

### Version Mismatch

If `yarn --version` doesn't match `package.json`, corepack might be auto-managing based on the `packageManager` field. This is expected behavior.

### First Time Setup

If you get errors about missing tarballs:

```bash
# Download and activate current version
yarn yarn-binary:download
```

## Security

- **Committed tarballs** - Stored in version control for audit trail
- **Corepack verification** - Uses Node.js built-in package manager
- **No external downloads** - CI/CD uses committed files only
- **Version pinning** - Exact versions specified in package.json

## Native Corepack Commands

For reference, the underlying corepack commands being used:

```bash
# Pack (download) yarn version from package.json to specific location
corepack pack -o .yarn/yarn-corepack.tgz

# Hydrate (activate) from a tarball
corepack hydrate .yarn/yarn-corepack.tgz --activate
```
