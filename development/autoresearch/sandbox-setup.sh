#!/bin/bash
# sandbox-setup.sh — First-time setup inside the Docker Sandbox
#
# Docker Sandboxes route ALL outbound HTTP/HTTPS through a MITM proxy at
# host.docker.internal:3128. This causes three problems for yarn install:
#
#   1. Node.js doesn't trust the proxy's CA cert (ECONNREFUSED / TLS errors)
#   2. Yarn Berry ignores standard HTTP_PROXY env vars (needs its own config)
#   3. @metamask/foundryup uses raw node:https with zero proxy support,
#      so it can't download Foundry binaries from GitHub
#   4. The MITM proxy re-signs TLS, corrupting Yarn's package checksums
#
# This script works around all four issues. Run it ONCE after creating the
# sandbox — installed packages persist across sandbox restarts.
#
# Usage:
#   chmod +x development/autoresearch/sandbox-setup.sh
#   bash development/autoresearch/sandbox-setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== Docker Sandbox Setup for MetaMask Autoresearch ==="
echo ""

# ============================================================================
# 1. Trust the MITM proxy CA certificate
# ============================================================================

PROXY_CA="/usr/local/share/ca-certificates/proxy-ca.crt"

if [ -f "$PROXY_CA" ]; then
    export NODE_EXTRA_CA_CERTS="$PROXY_CA"
    echo "[1/4] NODE_EXTRA_CA_CERTS=$PROXY_CA"
else
    echo "[1/4] SKIP: No proxy CA cert found at $PROXY_CA (not in a Docker Sandbox?)"
fi

# ============================================================================
# 2. Configure Yarn Berry to use the sandbox proxy
# ============================================================================
# Yarn Berry has its own httpProxy/httpsProxy config and does NOT reliably
# read the standard HTTP_PROXY/HTTPS_PROXY env vars. We write to ~/.yarnrc.yml
# (--home) to avoid modifying the project's .yarnrc.yml.

echo "[2/4] Configuring Yarn proxy..."
yarn config set --home httpProxy "http://host.docker.internal:3128"
yarn config set --home httpsProxy "http://host.docker.internal:3128"

# ============================================================================
# 3. Pre-cache Foundry binary (foundryup has no proxy support)
# ============================================================================
# @metamask/foundryup's download.mjs uses raw node:http/node:https request()
# which doesn't go through the proxy. We download via curl (which respects
# HTTPS_PROXY) and place the binary in foundryup's cache directory so it
# finds it and skips the download.

echo "[3/4] Pre-caching Foundry binary..."

FOUNDRY_VERSION="v0.3.0"
ARCH=$(node -e "
const os = require('os');
const arch = os.arch();
const map = { x64: 'amd64', arm64: 'arm64' };
console.log(map[arch] || arch);
")
PLATFORM=$(node -e "
const os = require('os');
const map = { darwin: 'darwin', linux: 'linux', win32: 'win32' };
console.log(map[os.platform()] || os.platform());
")

FOUNDRY_URL="https://github.com/foundry-rs/foundry/releases/download/${FOUNDRY_VERSION}/foundry_${FOUNDRY_VERSION}_${PLATFORM}_${ARCH}.tar.gz"
BINS="anvil"

# Compute the cache key the same way foundryup does:
#   sha256("${BIN_ARCHIVE_URL}-${binaries.join(', ')}")
CACHE_KEY=$(node -e "
const { createHash } = require('crypto');
const key = createHash('sha256')
  .update('${FOUNDRY_URL}-${BINS}')
  .digest('hex');
console.log(key);
")

# foundryup uses: enableGlobalCache=false → join(cwd(), '.metamask', 'cache', cacheKey)
CACHE_DIR=".metamask/cache/${CACHE_KEY}"

if [ -d "$CACHE_DIR" ] && [ -f "$CACHE_DIR/anvil" ]; then
    echo "  Foundry already cached at $CACHE_DIR"
else
    echo "  Downloading from $FOUNDRY_URL"
    curl -fSL "$FOUNDRY_URL" -o /tmp/foundry.tar.gz
    mkdir -p "$CACHE_DIR"
    tar xzf /tmp/foundry.tar.gz -C "$CACHE_DIR" anvil
    chmod +x "$CACHE_DIR/anvil"
    rm -f /tmp/foundry.tar.gz
    echo "  Cached at $CACHE_DIR"
fi

# ============================================================================
# 4. Run yarn install
# ============================================================================
# Native ARM64 binaries (@swc/core, anvil) crash in Docker microVMs with
# SIGBUS/SIGSEGV. Neither is needed for yarn dist (Browserify production build).
# Yarn fetches and links all packages before postinstall scripts run, so
# node_modules is usable even when these postinstall scripts crash.

echo "[4/4] Running yarn install..."

INSTALL_LOG="/tmp/yarn-install.log"
if YARN_CHECKSUM_BEHAVIOR=ignore yarn install > "$INSTALL_LOG" 2>&1; then
    echo "  yarn install succeeded."
else
    if grep -qE "Bus error|SIGSEGV" "$INSTALL_LOG"; then
        echo "  ⚠ Postinstall crashed for native ARM64 binaries (known Docker VM issue)."
        grep -oE "pkgid: '[^']+'" "$INSTALL_LOG" | sort -u | while read -r pkg; do
            echo "    - $pkg"
        done
        echo "  These are not needed for 'yarn dist'. node_modules is ready."
        echo "  Full log: $INSTALL_LOG"
    else
        echo "  yarn install failed. Log:"
        tail -30 "$INSTALL_LOG"
        exit 1
    fi
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "You can now run the autoresearch loop:"
echo "  bash development/autoresearch/autoresearch-loop.sh"
