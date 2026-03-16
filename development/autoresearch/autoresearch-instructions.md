# Autoresearch: Setup & Operations Guide

Automated build performance optimization for MetaMask Extension using an AI agent loop inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) and [Tobi Lutke's Shopify/Liquid optimization](https://github.com/Shopify/liquid/pull/2056).

## Architecture Overview

```
┌─── macOS Host (M4 Max, 128GB RAM) ───────────────────────┐
│                                                          │
│  llama-server :8080                                      │
│  ├─ Qwen 3.5 27B (Q8_K_XL, Unsloth)                      │
│  ├─ Metal GPU acceleration (40 cores)                    │
│  └─ OpenAI-compatible API                                │
│                                                          │
│  ~/metamask-extension/   ← bidirectional sync →    ┐     │
│                                                    │     │
│  ┌─── Docker Sandbox (microVM) ──────────────────  │  ─┐ │
│  │                                                 ↓   │ │
│  │  ~/metamask-extension/  (same absolute path)        │ │
│  │  ├─ autoresearch-loop.sh (orchestrator)             │ │
│  │  │   ├─ Aider (coding agent → calls host:8080)      │ │
│  │  │   ├─ autoresearch.sh (benchmark)                 │ │
│  │  │   └─ autoresearch.checks.sh (correctness)        │ │
│  │  ├─ Node.js v24 + Yarn (build toolchain)            │ │
│  │  └─ Git (experiment tracking)                       │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

This uses [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (microVMs, not plain containers) for hypervisor-level isolation.

**Key design decisions:**

- **Model on host**: Full access to 128GB unified memory + Metal GPU. Zero VRAM sharing with the sandbox.
- **Build in sandbox**: The agent runs inside a microVM with its own kernel — it cannot access host processes, host Docker daemon, or files outside the workspace.
- **Bidirectional workspace sync**: The MetaMask repo lives on the host and syncs into the sandbox at the **same absolute path**. Agent edits appear on the host in real-time. No cloning needed.
- **Credential injection**: Docker's proxy injects API keys into outbound requests transparently. Keys never stored inside the sandbox.
- **Persistence**: Installed packages (node_modules, Aider, etc.) survive between sandbox restarts. Only `docker sandbox rm` destroys them.

## Prerequisites

- macOS with Apple Silicon (M4 Max recommended, M1 Pro minimum)
- **Docker Desktop 4.58+** (required for microVM-based sandboxes)
- 128GB RAM recommended (36GB for model Q8 + sandbox overhead)
- [llama.cpp](https://github.com/ggerganov/llama.cpp) built for Metal

## Step 1: Model Setup (Host)

### Download the Model

Get Qwen 3.5 27B Q8_K_XL from Unsloth (best quality GGUF quantization):

```bash
# Using Hugging Face CLI
huggingface-cli download unsloth/Qwen3.5-27B-GGUF Qwen3.5-27B-Q8_K_XL.gguf --local-dir ~/models/

# The file is approximately 36GB
```

**Why Q8_K_XL from Unsloth?** Their Dynamic 2.0 quantization protects attention layers from quantization loss. The KL Divergence at Q8 is 0.103 vs 0.410 at Q4 — this translates to significantly more reliable structured output (JSON, code edits) in the autoresearch loop. At Q4, ~5% of experiments crash due to malformed edits; at Q8 this drops to <1%.

### Start llama-server

```bash
llama-server \
  --model ~/models/Qwen3.5-27B-Q8_K_XL.gguf \
  --host 0.0.0.0 \
  --port 8080 \
  --ctx-size 32768 \
  --n-gpu-layers 99 \
  --threads 8 \
  --flash-attn on
```

**Configuration notes:**

- `--ctx-size 32768`: 32K context. Fits autoresearch.md + full `scripts.js` (1327 lines, ~15K tokens) + ideas backlog + results history with room to grow. 64K (`65536`) also works on 128GB hardware with negligible speed cost — use it if results.tsv grows large over many experiments.
- `--n-gpu-layers 99`: All layers on Metal GPU. With 128GB unified memory this fits easily.
- `--threads 8`: CPU threads for prompt processing. Good default for M4 Max.
- `--flash-attn`: Flash Attention for faster inference.
- `--host 0.0.0.0`: Listen on all interfaces so the sandbox can reach it.

### Verify the Server

```bash
curl http://localhost:8080/v1/models
# Should return a list containing your model

curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3.5-27b", "messages": [{"role": "user", "content": "Say hello"}], "max_tokens": 50}'
# Should return a chat completion
```

## Step 2: Docker Sandbox Setup

> **Important**: Use a regular git clone, NOT a git worktree. Docker Sandboxes
> only sync the workspace directory — a worktree's `.git` file points to the
> parent repo's `.git/worktrees/` directory, which won't exist inside the sandbox.

```bash
# Clone the repo (on the host)
git clone https://github.com/MetaMask/metamask-extension.git ~/metamask-autoresearch
```

### Option A: Custom Template (Recommended)

Build a custom template with Aider and Node.js 24 pre-installed:

```bash
# From the repo root
docker build -t metamask-autoresearch-template \
  -f development/autoresearch/Dockerfile ~/metamask-autoresearch
```

Create and enter the sandbox:

```bash
docker sandbox run \
  -t metamask-autoresearch-template \
  shell ~/metamask-autoresearch
```

This creates a microVM, syncs your workspace, and drops you into a bash shell. Aider, Node.js 24, Yarn, and Git are all ready.

### Configure Sandbox Network Policies

Docker Sandboxes route all HTTP/HTTPS through a MITM proxy that re-signs TLS certificates. This corrupts Yarn package checksums and zip archives. Apply bypass rules so npm traffic is tunneled without interception, and allow the local LLM server:

```bash
# On the HOST — find your sandbox name first
docker sandbox ls

# Apply network policies
docker sandbox network proxy <sandbox-name> \
  --bypass-host "*.npmjs.org" \
  --bypass-host "*.yarnpkg.com" \
  --bypass-host "github.com" \
  --bypass-host "*.githubusercontent.com" \
  --allow-host "localhost:8080"
```

The `--bypass-host` rules tunnel traffic without MITM interception (preserving original TLS certificates and package integrity). The `--allow-host` rule permits the sandbox to reach the llama-server running on the host.

These policies persist across sandbox restarts. You only need to set them once per sandbox.

### Option B: Shell Sandbox (No Custom Template)

If you prefer not to build a template, use the default shell sandbox and install tools on first run:

```bash
# Create sandbox with your workspace
docker sandbox run shell ~/metamask-autoresearch

# Inside the sandbox — install tools (persists between runs)
sudo pip3 install aider-chat
sudo corepack enable
yarn install
```

### Verify Setup Inside Sandbox

```bash
# Check tools
node --version     # Should be v24.x
aider --version    # Should print version
yarn --version     # Should print version

# Check model connectivity
# Docker Sandbox proxy handles host access. Try:
curl http://host.docker.internal:8080/v1/models

# If that doesn't work, the sandbox may route differently.
# Check the sandbox networking docs for your Docker Desktop version.

# Configure Aider for the local model
export OPENAI_API_BASE=http://host.docker.internal:8080/v1
export OPENAI_API_KEY=not-needed

# Quick Aider test
aider --openai-api-base $OPENAI_API_BASE \
      --model openai/qwen3.5-27b \
      --message "Say hello" \
      --no-git --yes
```

### Install Dependencies (First Run Only)

Docker Sandboxes route all traffic through a MITM proxy that breaks Node.js TLS,
Yarn checksums, and any package that downloads binaries directly (like `@metamask/foundryup`).
The setup script handles all of these automatically:

```bash
# Inside the sandbox, in the workspace directory
bash development/autoresearch/sandbox-setup.sh

# This persists — you won't need to reinstall unless you remove the sandbox
```

If the setup script isn't available (e.g., using Option B without the custom template),
you can also run it directly from the workspace since it's synced from the host.

<details>
<summary>What the setup script does</summary>

1. Sets `NODE_EXTRA_CA_CERTS` to trust the sandbox proxy's CA certificate
2. Configures Yarn Berry's `httpProxy`/`httpsProxy` (Yarn ignores standard `HTTP_PROXY` env vars)
3. Pre-downloads the Foundry binary via `curl` (which respects the proxy) and places it in
   `@metamask/foundryup`'s cache directory — foundryup's own downloader uses raw `node:https`
   with zero proxy support
4. Runs `yarn install` with `YARN_CHECKSUM_BEHAVIOR=ignore` (the MITM proxy corrupts checksums)

</details>

### Configure Git for Experiments

```bash
git config user.email "autoresearch@metamask.local"
git config user.name "Autoresearch Agent"
git checkout -b autoresearch/browserify-build-perf
```

## Step 3: Running the Autoresearch Loop

### Establish Baseline

Before running experiments, record the sandbox-specific baseline:

```bash
# Make scripts executable
chmod +x development/autoresearch/*.sh

# Run the full benchmark — this records the baseline in results.tsv
bash development/autoresearch/autoresearch.sh
```

**Note**: Build times in the sandbox may differ from native macOS. This is fine — all experiments run in the same environment, so relative improvements are valid and transferable.

### Start the Loop

```bash
# Run with defaults (100 experiments, Qwen 3.5 27B)
bash development/autoresearch/autoresearch-loop.sh

# Or customize
bash development/autoresearch/autoresearch-loop.sh \
  --max-experiments 50 \
  --model openai/qwen3.5-27b \
  --api-base http://host.docker.internal:8080/v1

# Dry run (print the prompt without executing)
bash development/autoresearch/autoresearch-loop.sh --dry-run
```

### What Happens Per Experiment

```
Experiment N:
  1. Loop builds a prompt with:
     - autoresearch.md (objective, metrics, constraints)
     - autoresearch.ideas.md (idea backlog)
     - Recent results from results.tsv
     - Current best build time
  2. Aider reads the prompt + in-scope files
  3. Aider proposes and applies ONE code change
  4. autoresearch.checks.sh validates:
     - Modified files are within allowed scope
     - No syntax errors
     - Dependencies unchanged
     - Frozen files untouched
  5. yarn dist runs (full build with LavaMoat)
  6. autoresearch.sh captures metrics:
     - build_time_seconds
     - bundle_size_total_kb
     - standard_entry_points_seconds
  7. If build_time < current_best:
     -> git commit (keep the improvement)
     -> Update current best
  8. If build_time >= current_best:
     -> git checkout -- . (revert)
  9. Results appended to results.tsv
  10. Repeat
```

### Overnight Run

```bash
# Start the loop in the background with logging
nohup bash development/autoresearch/autoresearch-loop.sh \
  --max-experiments 150 \
  > /tmp/autoresearch-run-$(date +%Y%m%d).log 2>&1 &

# Monitor from host (changes sync back in real-time)
# On host terminal:
tail -f ~/path/to/metamask-extension/development/autoresearch/results.tsv

# Or from another sandbox shell:
docker sandbox exec -it <sandbox-name> bash
tail -f development/autoresearch/results.tsv
```

At ~3 minutes per experiment, 150 experiments = ~7.5 hours.

## Step 4: Analyzing Results

### After the Loop

Since the workspace syncs bidirectionally, you can analyze results from the **host** (no need to enter the sandbox):

```bash
# View all results
column -t -s$'\t' development/autoresearch/results.tsv

# View only successful experiments (committed)
git log --oneline --grep="autoresearch:"

# See what changed in each successful experiment
git log --oneline --grep="autoresearch:" | while read sha msg; do
  echo "=== $msg ==="
  git show "$sha" --stat
  echo ""
done

# Compare final build time vs baseline
head -2 development/autoresearch/results.tsv  # baseline
tail -1 development/autoresearch/results.tsv  # latest

# View the ideas backlog to see what worked / didn't
cat development/autoresearch/autoresearch.ideas.md
```

### Cherry-Picking Winners into a Clean PR

```bash
# From the main branch on host
git checkout main
git checkout -b build/optimize-browserify-performance

# Review and cherry-pick individual winners
git log --oneline autoresearch/browserify-build-perf --grep="autoresearch:"
git cherry-pick <sha1> <sha2> <sha3>

# Or squash all autoresearch commits into one
git merge --squash autoresearch/browserify-build-perf

# Final verification on host (native performance, production-valid)
yarn dist
yarn lint:changed:fix
```

## Experiment 2: Bundle Size Optimization

Run on a separate branch with a different primary metric:

```bash
git checkout -b autoresearch/bundle-size-optimization
```

Edit `autoresearch.md`:

- **Primary metric**: `bundle_size_total_kb` (lower is better)
- **Success condition**: `bundle_size_total_kb` < current best AND build succeeds
- **Strategic direction**: Dead code elimination, tree shaking, Terser compression settings

The `autoresearch.sh` and `autoresearch.checks.sh` already capture bundle size metrics — you only need to change which metric the loop compares in `autoresearch-loop.sh`.

## Model Alternatives

| Model                                  | GGUF Size | Quality    | Notes                                    |
| -------------------------------------- | --------- | ---------- | ---------------------------------------- |
| **Qwen 3.5 27B Q8_K_XL** (recommended) | 36 GB     | Best local | Unsloth Dynamic quant, IFEval 95%        |
| Qwen 3.5 27B Q4_K_XL                   | 19 GB     | Good       | Use Unsloth Dynamic, not standard Q4_K_M |
| Qwen3-Coder-Next 80B-A3B               | ~50 GB    | Excellent  | MoE, only 3B active — needs 64GB+ RAM    |
| Qwen 3.5 Plus API                      | N/A       | Excellent  | $0.50/M tokens, ~$3 per 100 experiments  |

All work with llama-server's OpenAI-compatible API. Change the `--model` flag in the loop script.

## Sandbox Management

```bash
# List all sandboxes
docker sandbox ls

# Re-enter an existing sandbox
docker sandbox run <sandbox-name>

# Execute a command inside a running sandbox
docker sandbox exec -it <sandbox-name> bash

# Remove a sandbox (destroys all installed packages)
docker sandbox rm <sandbox-name>

# Start fresh
docker sandbox rm <sandbox-name>
docker sandbox run -t metamask-autoresearch-template shell ~/path/to/metamask-extension
```

Sandboxes persist until explicitly removed. `yarn install`, Aider, node_modules — all survive between runs.

## Troubleshooting

### yarn install fails with ECONNREFUSED

The sandbox MITM proxy is likely not configured. Run the setup script:

```bash
bash development/autoresearch/sandbox-setup.sh
```

If you've already run it and still see errors, verify the proxy is reachable:

```bash
curl -v -x http://host.docker.internal:3128 https://registry.npmjs.org
```

### Sandbox can't reach llama-server

```bash
# Inside the sandbox
curl http://host.docker.internal:8080/v1/models

# If it fails:
# 1. Ensure llama-server runs with --host 0.0.0.0
# 2. Restart Docker Desktop (sandbox daemon may need to pick up network changes)
# 3. Check Docker Desktop Settings > Resources > Network
```

### Build fails in sandbox but works on host

Platform difference (Linux microVM vs macOS). Common fix:

```bash
# Regenerate LavaMoat policies inside the sandbox
yarn lavamoat:auto
git add lavamoat/
git commit -m "autoresearch: regenerate LavaMoat policies for sandbox env"
```

### Aider produces malformed edits

- Use Q8 quantization (more reliable structured output than Q4)
- Increase `--ctx-size` on llama-server if context is being truncated
- Check `/tmp/autoresearch-aider-*.log` for the specific failure
- The loop automatically reverts and continues on failures

### Workspace sync issues

Files should sync bidirectionally in real-time. If changes aren't appearing:

```bash
# On host: check Docker Desktop is running
docker sandbox ls

# Force sync by touching a file
touch development/autoresearch/.sync-check
```

## File Reference

```
development/autoresearch/
├── autoresearch.md              # Agent reads this: objective, metrics, scope, strategy
├── autoresearch.sh              # Benchmark runner (FROZEN — do not modify)
├── autoresearch.checks.sh       # Correctness gate (FROZEN — do not modify)
├── autoresearch.ideas.md        # Ideas backlog (agent maintains this)
├── autoresearch-loop.sh         # Main orchestration loop
├── autoresearch-instructions.md # This file
├── Dockerfile                   # Custom sandbox template (optional)
└── results.tsv                  # Experiment log (auto-generated, gitignored)
```
