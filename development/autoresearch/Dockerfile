# Custom Docker Sandbox Template for MetaMask Autoresearch
#
# Only Aider runs inside the sandbox (code changes by untrusted AI agent).
# Builds, benchmarks, and git operations run on the host with full RAM.
#
# Build:
#   docker build -t metamask-autoresearch-template -f development/autoresearch/Dockerfile .
#
# Use:
#   docker sandbox run -t metamask-autoresearch-template shell ~/metamask-autoresearch

FROM docker/sandbox-templates:shell

USER root

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
