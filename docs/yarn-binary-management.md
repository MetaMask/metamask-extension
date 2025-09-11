# Yarn Binary Management

This document describes how to manage yarn versions for the MetaMask extension project using Corepack, ensuring consistent versions across development and CI/CD environments.

## Overview

The MetaMask extension uses a Corepack-based approach to manage yarn versions. This system:

- **Reads version from package.json** - Single source of truth via `packageManager` field
- **Uses native Node.js tooling** - Leverages built-in `corepack` commands
- **Commits tarballs for offline use** - No network dependencies in CI/CD
- **Activates versions automatically** - No manual configuration needed
- **Works without yarnPath** - Corepack handles version activation

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

### Direct Node.js Scripts

```bash
# Download and activate (same as yarn yarn-binary:download)
node development/yarn-corepack-tarball.js

# Activate existing tarball (same as yarn yarn-binary:hydrate)
node development/yarn-corepack-hydrate.js
```

## How It Works

### 1. Version Detection

The scripts automatically read the yarn version from `package.json`:

```json
{
  "packageManager": "yarn@4.9.4"
}
```

### 2. Tarball Creation (if needed)

Using `corepack prepare -o`:

```bash
corepack prepare yarn@4.9.4 -o
# Creates: corepack.tgz (in current directory)
```

### 3. Storage and Organization

The script moves the tarball to a organized location:

```bash
# Moves: corepack.tgz → .yarn/yarn-4.9.4-corepack.tgz
```

### 4. Activation

Using `corepack hydrate --activate`:

```bash
corepack hydrate .yarn/yarn-4.9.4-corepack.tgz --activate
# Activates the yarn version globally via corepack
```

### 5. Verification

The script verifies the activation worked:

```bash
yarn --version  # Should return 4.9.4
```

## Corepack Commands Used

Our scripts wrap these native Corepack commands:

### Download Process (`yarn-binary:download`)

1. **`corepack prepare yarn@4.9.4 -o`**
   - Downloads yarn version 4.9.4
   - Creates `corepack.tgz` in current directory
   - Contains the complete yarn package manager

2. **File organization** (script handles this)
   - Moves `corepack.tgz` → `.yarn/yarn-4.9.4-corepack.tgz`
   - Provides organized storage for version control

3. **`corepack hydrate .yarn/yarn-4.9.4-corepack.tgz --activate`**
   - Extracts and installs yarn from the tarball
   - Activates it as the current yarn version
   - No configuration files needed

### Hydrate Process (`yarn-binary:hydrate`)

1. **Tarball detection** (script handles this)
   - Reads version from `package.json`
   - Locates `.yarn/yarn-[version]-corepack.tgz`

2. **`corepack hydrate .yarn/yarn-4.9.4-corepack.tgz --activate`**
   - Activates the existing tarball
   - No download needed - uses committed file

3. **Verification** (script handles this)
   - Runs `yarn --version` to confirm activation

## Workflows

### Version Updates

```bash
# 1. Update package.json
{
  "packageManager": "yarn@4.9.5"
}

# 2. Download and commit new version
yarn yarn-binary:download
git add .yarn/yarn-4.9.5-corepack.tgz
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

# 2. Activate
yarn yarn-binary:hydrate

# 3. Verify
yarn --version  # Shows 4.9.1
```

## File Structure

```
.yarn/
├── yarn-4.9.1-corepack.tgz    # Committed tarball for 4.9.1
├── yarn-4.9.4-corepack.tgz    # Committed tarball for 4.9.4
└── [other yarn files...]

development/
├── yarn-corepack-tarball.js   # Download & activate script
└── yarn-corepack-hydrate.js   # Activate existing script

package.json                    # Contains packageManager version
```

## Advantages

| Aspect | Corepack Approach | Traditional Approach |
|--------|------------------|---------------------|
| **Configuration** | ❌ No yarnPath needed | ✅ Requires yarnPath in .yarnrc.yml |
| **Version Source** | ✅ Single source (package.json) | ⚠️ Multiple places to update |
| **CI/CD Setup** | ✅ Just hydrate tarball | ⚠️ Complex binary management |
| **Network Dependency** | ❌ None (committed tarballs) | ⚠️ Downloads in CI |
| **Native Tooling** | ✅ Uses Node.js corepack | ⚠️ Custom scripts |
| **Activation** | ✅ Automatic via corepack | ⚠️ Manual configuration |

## Troubleshooting

### Tarball Not Found

```bash
❌ Tarball not found: .yarn/yarn-4.9.5-corepack.tgz
💡 Run 'yarn yarn-binary:download' to create the tarball first
```

**Solution**: Run `yarn yarn-binary:download` to create the tarball.

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

## Migration from Old System

If migrating from the old binary management system:

1. **Remove old files**:
   ```bash
   rm -rf .yarn/releases/
   rm .yarn/yarn-config.json
   ```

2. **Download new format**:
   ```bash
   yarn yarn-binary:download
   ```

3. **Commit new tarballs**:
   ```bash
   git add .yarn/*-corepack.tgz
   git commit -m "Migrate to corepack-based yarn management"
   ```

4. **Update CI/CD** to use `yarn yarn-binary:hydrate`

## Summary

The Corepack-based yarn management system provides a clean, native approach to version management with minimal configuration and maximum reliability for CI/CD environments.
