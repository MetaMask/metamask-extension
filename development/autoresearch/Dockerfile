# Custom Docker Sandbox Template for MetaMask Autoresearch
#
# Extends the shell sandbox with Aider and Node.js 24 / Yarn.
# Used with `docker sandbox` (microVM), NOT `docker run`.
#
# Build:
#   docker build -t metamask-autoresearch-template -f development/autoresearch/Dockerfile .
#
# Use:
#   docker sandbox run -t metamask-autoresearch-template shell ~/path/to/metamask-extension

FROM docker/sandbox-templates:shell

USER root

# ============================================================================
# Node.js 24 (matches MetaMask's .nvmrc)
# ============================================================================

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable

# ============================================================================
# Aider build dependencies + install
# ============================================================================

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Python 3.13 removed audioop (needed by aider's pydub dep) — pin to 3.12
RUN UV_HTTP_TIMEOUT=120 uv tool install --no-cache --python 3.12 aider-chat && \
    ln -s /root/.local/bin/aider /usr/local/bin/aider

# ============================================================================
# Docker Sandbox proxy compatibility
# ============================================================================
# Docker Sandboxes route all HTTP/HTTPS through a MITM proxy that re-signs
# TLS with its own CA. Node.js uses its own CA bundle (not the system store),
# so it rejects the proxy's certificates unless we point it at the proxy CA.
# The cert file is injected into the sandbox at runtime by Docker.
#
# YARN_CHECKSUM_BEHAVIOR=ignore: The MITM proxy can alter response bytes,
# causing checksum mismatches for packages in yarn.lock.

ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/proxy-ca.crt
ENV YARN_CHECKSUM_BEHAVIOR=ignore

# Pre-configure Yarn Berry to use the sandbox proxy. Yarn has its own
# httpProxy/httpsProxy config and does NOT read HTTP_PROXY env vars reliably.
RUN mkdir -p /root && \
    echo 'httpProxy: "http://host.docker.internal:3128"' >> /root/.yarnrc.yml && \
    echo 'httpsProxy: "http://host.docker.internal:3128"' >> /root/.yarnrc.yml

# Copy the setup script (handles foundry cache + yarn install at first run)
COPY development/autoresearch/sandbox-setup.sh /usr/local/bin/sandbox-setup.sh
RUN chmod +x /usr/local/bin/sandbox-setup.sh

# ============================================================================
# Git config for autoresearch commits
# ============================================================================

RUN git config --global user.email "autoresearch@metamask.local" && \
    git config --global user.name "Autoresearch Agent"
