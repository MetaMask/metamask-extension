# Yarn Binary Management

This document describes how to manage yarn versions for the MetaMask extension project using native Corepack commands, ensuring consistent versions across development and CI/CD environments.

## Overview

The MetaMask extension uses native Corepack commands to manage yarn versions. This system:

- **Reads version from package.json** - Single source of truth via `packageManager` field
- **Uses native corepack commands** - Direct use of built-in `corepack pack` and `corepack hydrate`
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

## Package.json Scripts

```bash
# Download yarn tarball and activate version
yarn yarn-binary:download

# Activate existing committed tarball
yarn yarn-binary:hydrate
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

### Development - Version Switching

```bash
# Switch to different committed version
# 1. Update the project Yarn version
yarn set version 4.9.4

# 3. Download the new version
yarn yarn-binary:download

# 2. Activate
yarn yarn-binary:hydrate

# 3. Verify
yarn --version  # Shows 4.9.4
```

## File Structure

```text
.yarn/
├── yarn-corepack.tgz          # Committed tarball (version determined by package.json)
└── [other yarn files...]

package.json                   # Contains packageManager version and scripts
```
