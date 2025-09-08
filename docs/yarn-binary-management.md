# Yarn Binary Management for MetaMask Extension

This document describes the secure yarn binary management system for the MetaMask browser extension.

## Purpose

The MetaMask extension requires a specific version of yarn (currently 4.9.4) for builds. Instead of relying on globally installed yarn versions, we use a local, verified yarn binary to ensure:

- **Reproducible builds** across all environments
- **Security** through checksum verification
- **Consistency** in CI/CD pipelines
- **Supply chain security** by reducing external dependencies

## Quick Start

### Download the Required Yarn Version

```bash
# Download the default version (4.9.4)
yarn yarn-binary:download

# Or use the script directly
node development/download-yarn-binary.js --yarn-version=4.9.4
```

### Verify an Existing Binary

```bash
# Verify the integrity of the downloaded binary
yarn yarn-binary:verify

# Or with a specific version
node development/download-yarn-binary.js --yarn-version=4.9.4 --verify-only
```

## Available Commands

### Package.json Scripts

```bash
# Download yarn binary (uses default version)
yarn yarn-binary:download

# Verify existing yarn binary
yarn yarn-binary:verify
```

### Direct Script Usage

```bash
# Download specific version
node development/download-yarn-binary.js --yarn-version=4.9.4

# Force re-download
node development/download-yarn-binary.js --yarn-version=4.9.4 --force

# Verify only
node development/download-yarn-binary.js --yarn-version=4.9.4 --verify-only

# Show help
node development/download-yarn-binary.js --help
```

### Node.js Script (Advanced)

```bash
# Direct Node.js usage
node development/download-yarn-binary.js --yarn-version=4.9.4
node development/download-yarn-binary.js --yarn-version=4.9.4 --force
node development/download-yarn-binary.js --yarn-version=4.9.4 --verify-only

# For CI/CD: Skip config file creation (lightweight)
node development/download-yarn-binary.js --yarn-version=4.9.4 --no-config=true
```

## Integration Guide

### For Local Development

1. **Download the yarn binary**:
   ```bash
   yarn yarn-binary:download
   ```

2. **Use the local binary** (optional, for consistency):

   ```bash
   # Add to your shell session
   export PATH="$(pwd)/tools/yarn/v4.9.4/bin:$PATH"

   # Verify it's working
   yarn --version  # Should show 4.9.4
   ```

### For CI/CD (GitHub Actions)

#### Option 1: With Config Tracking (Recommended)

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Verify Yarn Binary
        run: |
          # Verify the committed yarn binary
          yarn yarn-binary:verify

      - name: Setup Local Yarn
        run: |
          # Use the verified local yarn binary
          export PATH="$(pwd)/tools/yarn/v4.9.4/bin:$PATH"
          echo "$(pwd)/tools/yarn/v4.9.4/bin" >> $GITHUB_PATH

      - name: Install Dependencies
        run: yarn install --immutable

      - name: Build
        run: yarn build
```

#### Option 2: Lightweight Download (No Config Tracking)

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Download Yarn Binary
        run: |
          # Download yarn without config file (lightweight)
          node development/download-yarn-binary.js --yarn-version=4.9.4 --no-config=true

      - name: Setup Local Yarn
        run: |
          # Use the downloaded yarn binary
          export PATH="$(pwd)/tools/yarn/v4.9.4/bin:$PATH"
          echo "$(pwd)/tools/yarn/v4.9.4/bin" >> $GITHUB_PATH

      - name: Install Dependencies
        run: yarn install --immutable

      - name: Build
        run: yarn build
```

### For Docker Builds

#### Option 1: With Config Verification

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

# Verify and use local yarn binary
RUN yarn yarn-binary:verify
ENV PATH="/app/tools/yarn/v4.9.4/bin:$PATH"

# Install dependencies
RUN yarn install --immutable

# Build
RUN yarn build
```

#### Option 2: Lightweight Download

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

# Download yarn binary without config tracking
RUN node development/download-yarn-binary.js --yarn-version=4.9.4 --no-config=true
ENV PATH="/app/tools/yarn/v4.9.4/bin:$PATH"

# Install dependencies
RUN yarn install --immutable

# Build
RUN yarn build
```

## Security Features

### Checksum Verification

The system provides comprehensive checksum verification with multiple fallback sources:

1. **Multiple Hash Algorithms**: Supports SHA-256, SHA-512, and SHA-1 verification
2. **NPM Registry**: Checks official npm registry for package checksums (for reference)
3. **PGP Signatures**: Attempts to verify against PGP-signed releases (Yarn v1)
4. **GitHub Release Assets**: Searches for dedicated checksum files
5. **Integrity Checks**: All downloads are checksummed and stored for later verification

**Note for Yarn Berry (v2+)**: Standalone binaries from `repo.yarnpkg.com` don't provide separate checksum files. The system shows npm registry checksums for reference but explains these are for different files (npm tarball vs standalone binary).

### Security Best Practices

- **Always verify** binaries before use in production
- **Re-verify periodically** to ensure integrity
- **Use exact versions** rather than version ranges
- **Audit the download process** through the configuration file

## Configuration Options

### Default Configuration with Tracking

By default, the system creates a `yarn-config.json` file with portable relative paths:

```json
{
  "versions": {
    "4.9.4": {
      "downloadDate": "2025-09-08T08:44:39.699Z",
      "binaryPath": "tools/yarn/yarn-4.9.4.cjs",
      "extractedPath": "tools/yarn/v4.9.4",
      "checksum": "516deeeced90791213ddcffc8d6712fcea7adff3e8d9879804284ba713462ce2",
      "verified": false,
      "repository": "berry",
      "downloadUrl": "https://repo.yarnpkg.com/4.9.4/packages/yarnpkg-cli/bin/yarn.js"
    }
  },
  "current": "4.9.4",
  "lastUpdated": "2025-09-08T08:44:39.703Z"
}
```
This file can be avoided using the `--no-config=true` parameter.
**Benefits:**

- ✅ **Portable paths**: Works in any environment (CI/CD, Docker, etc.)
- ✅ **Version tracking**: Keeps history of all downloaded versions
- ✅ **Checksum verification**: Enables integrity checking with `--verify-only`
- ✅ **Audit trail**: Records download dates and sources

### No-Config Mode for CI/CD

For lightweight CI/CD usage, use `--no-config=true`:

```bash
node development/download-yarn-binary.js --yarn-version=4.9.4 --no-config=true
```

**Benefits:**

- ✅ **Faster**: No config file I/O operations
- ✅ **Cleaner**: No tracking files in containerized environments
- ✅ **Simple**: Just downloads the binary and exits
- ✅ **CI-friendly**: Perfect for throwaway build environments

## File Structure

```text
metamask-extension/
├── development/
│   ├── download-yarn-binary.js    # Core download and verification logic
│   └── update-yarn-binary.sh      # User-friendly shell wrapper
├── tools/
│   └── yarn/
│       ├── README.md              # Detailed usage documentation
│       ├── yarn-config.json       # Version metadata with portable paths
│       ├── yarn-4.9.4.cjs         # Downloaded yarn binary (Berry)
│       └── v4.9.4/                # Extracted yarn files
│           └── bin/
│               └── yarn.js        # Executable yarn binary
├── docs/
│   └── yarn-binary-management.md  # This file
├── .yarnrc.yml.example           # Example yarn configuration
└── package.json                  # Updated with yarn-binary scripts
```

## Troubleshooting

### Common Issues

#### "Binary not found" errors

1. Ensure the binary was downloaded:
   ```bash
   ls tools/yarn/
   cat tools/yarn/yarn-config.json
   ```

2. Re-download if needed:
   ```bash
   yarn yarn-binary:download --force
   ```

#### Checksum verification failures

1. **For Yarn v1**: Do not use the binary - it may be compromised
2. **For Yarn Berry (v2+)**: Check if it's a "no checksums available" warning (common and expected)
3. Re-download with force:
   ```bash
   node development/download-yarn-binary.js --yarn-version=4.9.4 --force
   ```
4. For Yarn Berry, manually verify the download is from an official release:
   ```bash
   # The script provides a link to verify the release manually
   # Example: https://github.com/yarnpkg/berry/releases/tag/@yarnpkg%2Fcli%2F4.9.4
   ```
5. Check official yarn releases for updated checksums
6. Consider using a different version temporarily

#### Permission errors

```bash
# Fix script permissions
chmod +x development/update-yarn-binary.sh
chmod +x development/download-yarn-binary.js

# Fix yarn binary permissions
chmod +x tools/yarn/v*/bin/yarn.js
```

### Debug Information

To debug issues with the yarn binary management:

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Verify script can run
node development/download-yarn-binary.js --help

# Check downloaded files
ls -la tools/yarn/
cat tools/yarn/yarn-config.json

# Test binary directly
./tools/yarn/v4.9.4/bin/yarn.js --version
```

## Recent Improvements

### Enhanced Checksum Verification (v2024)

- ✅ **Multiple hash algorithms**: Now supports SHA-256, SHA-512, and SHA-1
- ✅ **NPM registry integration**: Checks official npm registry for additional verification
- ✅ **Better error handling**: Clearer messages about checksum availability
- ✅ **Yarn Berry support**: Proper handling of Berry's different distribution model

### CI/CD Optimizations (v2024)

- ✅ **Portable paths**: Config files now use relative paths for cross-platform compatibility
- ✅ **No-config mode**: `--no-config=true` option for lightweight CI/CD usage
- ✅ **Backward compatibility**: Existing absolute paths still work

### Enhanced Security (v2024)

- ✅ **Manual verification guidance**: Provides GitHub release links for manual verification
- ✅ **Multiple verification sources**: Attempts multiple checksum sources before giving up
- ✅ **Clear security messaging**: Explains when checksums aren't available and why

## Development Notes

### Extending the System

The yarn binary management system is designed to be extensible:

- **Add new versions**: Simply run with a different version number
- **Support other tools**: The pattern can be adapted for other binaries
- **Custom verification**: Extend the checksum verification logic
- **Integration hooks**: Add pre/post download hooks as needed

### Implementation Details

- **Download source**: Official yarn repositories (`repo.yarnpkg.com` for Berry, GitHub for v1)
- **Verification**: Multi-algorithm checksums (SHA-256, SHA-512, SHA-1) with multiple sources
- **Checksum sources**: NPM registry, PGP signatures, GitHub release assets
- **Storage**: Local tools/yarn directory with portable relative paths
- **Configuration**: JSON-based version and checksum tracking with CI/CD options

## Migration Guide

### From Global Yarn

If you're currently using a globally installed yarn:

1. **Download the local binary**:

   ```bash
   yarn yarn-binary:download
   ```

2. **Update scripts** (optional):

   ```bash
   # Instead of: yarn install
   # Use: ./tools/yarn/v4.9.4/bin/yarn.js install
   ```

3. **Update CI/CD** to use the local binary

### From Different Yarn Version

If you need to switch to a different yarn version:

1. **Download the new version**:

   ```bash
   ./development/update-yarn-binary.sh 4.10.0
   ```

2. **Update package.json** engines field if needed

3. **Test thoroughly** with the new version

## Support

For issues with the yarn binary management system:

1. **Check this documentation** and the tools/yarn/README.md
2. **Verify Node.js version** is compatible (>= 18.0.0)
3. **Check file permissions** on scripts and binaries
4. **Review the configuration** in tools/yarn/yarn-config.json
5. **Test with --verify-only** to isolate download vs verification issues
