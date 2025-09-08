# Yarn Binary Management

This directory contains locally stored yarn binaries for secure and reproducible builds.

## Overview

The MetaMask extension uses a specific version of yarn to ensure consistent builds across all environments. Instead of relying on externally installed yarn versions, we store verified yarn binaries locally in this repository.

## Security Features

- **Checksum Verification**: All downloaded binaries are verified against official checksums when available
- **Integrity Checks**: Stored binaries can be re-verified at any time
- **Reproducible Builds**: Ensures the same yarn version is used across all environments
- **Supply Chain Security**: Reduces dependency on external package managers during CI/CD

## Directory Structure

```
tools/yarn/
├── README.md                 # This file
├── yarn-config.json         # Configuration with version info and checksums
├── yarn-4.9.4.cjs           # Downloaded yarn binary (Berry v2+, executable)
└── v4.9.4/                  # Extracted yarn binary structure
    ├── bin/
    │   └── yarn.js
    ├── lib/
    ├── package.json
    └── ...
```

## Usage

### Download a Yarn Version

```bash
# Download the default version (4.9.4)
yarn yarn-binary:download

# Download a specific version
node development/download-yarn-binary.js --yarn-version=4.9.4

# Force re-download even if it exists
node development/download-yarn-binary.js --yarn-version=4.9.4 --force

# For CI/CD: Skip config file creation (lightweight)
node development/download-yarn-binary.js --yarn-version=4.9.4 --no-config=true
```

### Verify an Existing Binary

```bash
# Verify the integrity of a stored binary
yarn yarn-binary:verify

# Using the Node.js script directly
node development/download-yarn-binary.js --yarn-version=4.9.4 --verify-only
```

## Configuration File

The `yarn-config.json` file maintains metadata about stored yarn versions:

```json
{
  "versions": {
    "4.9.4": {
      "downloadDate": "2025-09-08T10:44:39.699Z",
      "binaryPath": "tools/yarn/yarn-4.9.4.cjs",
      "extractedPath": "tools/yarn/v4.9.4",
      "checksum": "516deeeced90791213ddcffc8d6712fcea7adff3e8d9879804284ba713462ce2",
      "verified": false,
      "repository": "berry",
      "downloadUrl": "https://repo.yarnpkg.com/4.9.4/packages/yarnpkg-cli/bin/yarn.js"
    }
  },
  "current": "4.9.4",
  "lastUpdated": "2025-09-08T10:44:39.703Z"
}
```

## Using Local Yarn Binary

Once downloaded, you can use the local yarn binary in several ways:

### Method 1: Direct Path Usage

```bash
# Use the main .cjs file directly (now executable!)
./tools/yarn/yarn-4.9.4.cjs install

# Use the extracted yarn binary
./tools/yarn/v4.9.4/bin/yarn.js install

# In scripts
node ./tools/yarn/v4.9.4/bin/yarn.js build
```

### Method 2: Temporary PATH Addition

```bash
# Add to PATH temporarily
export PATH="$(pwd)/tools/yarn/v4.9.4/bin:$PATH"
yarn --version  # Should show the local version
```

### Method 3: Yarnrc Configuration

Create or update `.yarnrc.yml` in the project root:

```yaml
# Point to local yarn binary (choose one)
yarnPath: "./tools/yarn/yarn-4.9.4.cjs"        # Direct .cjs file
# yarnPath: "./tools/yarn/v4.9.4/bin/yarn.js"  # Or use bin directory
```

## CI/CD Integration

For GitHub Actions or other CI environments:

```yaml
# Example GitHub Actions step
- name: Setup Local Yarn
  run: |
    # Verify the binary first
    yarn yarn-binary:verify

    # Use the local binary
    export PATH="$(pwd)/tools/yarn/v4.9.4/bin:$PATH"
    yarn --version
    yarn install
```

## Security Best Practices

1. **Always verify checksums**: The script attempts to verify checksums against official sources
2. **Regular integrity checks**: Run `--verify-only` periodically to ensure binary integrity
3. **Version pinning**: Use exact version numbers, not ranges
4. **Audit trail**: The configuration file maintains download dates and verification status

## Troubleshooting

### Checksum Verification Failed

If checksum verification fails:

1. **Do not use the binary** - it may be compromised
2. Re-download with `--force` flag
3. If the issue persists, check the official yarn releases for updated checksums
4. Consider using a different version temporarily

### Binary Not Found

If you get "binary not found" errors:

1. Verify the binary was downloaded: `ls tools/yarn/`
2. Check the configuration: `cat tools/yarn/yarn-config.json`
3. Re-download: `./development/update-yarn-binary.sh [version] --force`

### Permission Issues

If you encounter permission issues:

```bash
# Make scripts executable
chmod +x development/update-yarn-binary.sh
chmod +x development/download-yarn-binary.js

# Fix yarn binary permissions if needed
chmod +x tools/yarn/v*/bin/yarn.js
```

## Supported Yarn Versions

This tool supports downloading any yarn version from the official GitHub releases. However, we recommend using:

- **4.9.4** (current project requirement)
- **4.x.x** series for modern features
- Avoid very old versions (< 3.0) due to potential security issues

## Development

The yarn binary management system consists of:

- `development/download-yarn-binary.js` - Main Node.js script for downloading and verification
- `development/update-yarn-binary.sh` - Shell wrapper with user-friendly interface
- `tools/yarn/` - Storage directory for binaries and configuration

To extend or modify the system, see the source code comments for detailed implementation notes.

