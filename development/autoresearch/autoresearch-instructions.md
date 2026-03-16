# Autoresearch: Setup & Operations Guide

Automated build performance optimization for MetaMask Extension using an AI agent loop inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) and [Tobi Lutke's Shopify/Liquid optimization](https://github.com/Shopify/liquid/pull/2056).

## Architecture Overview

```
┌─── macOS Host (M4 Max, 128GB RAM) ──────────────────────────┐
│                                                              │
│  llama-server :8080                                          │
│  ├─ Qwen 3.5 27B (Q8_K_XL, Unsloth)                        │
│  ├─ Metal GPU acceleration (40 cores)                        │
│  └─ OpenAI-compatible API                                    │
│                                                              │
│  autoresearch-loop.sh (orchestrator, runs on host)           │
│  ├─ docker sandbox exec → Aider (isolated code changes)     │
│  ├─ autoresearch.checks.sh (correctness gate)                │
│  ├─ yarn dist (benchmark, full 128GB RAM)                    │
│  └─ git commit/revert (experiment tracking)                  │
│                                                              │
│  ~/metamask-autoresearch/ ← bidirectional sync →             │
│                                                              │
│  ┌─── Docker Sandbox (microVM, 4GB) ───────────────────────┐ │
│  │  ~/metamask-autoresearch/ (same absolute path)           │ │
│  │  └─ Aider (the ONLY thing that runs here)                │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

This uses [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (microVMs, not plain containers) for hypervisor-level isolation of the AI agent.

**Key design decisions:**

- **Model on host**: Full access to 128GB unified memory + Metal GPU. Zero VRAM sharing with the sandbox.
- **Agent in sandbox, build on host**: Aider (untrusted AI) runs inside a microVM with its own kernel. Builds and benchmarks run on the host where they have full RAM (the microVM is capped at 4GB, insufficient for `yarn dist`).
- **Bidirectional workspace sync**: The MetaMask repo lives on the host and syncs into the sandbox at the **same absolute path**. Agent edits appear on the host in real-time.
- **Credential injection**: Docker's proxy injects API keys into outbound requests transparently. Keys never stored inside the sandbox.
- **Persistence**: Aider and its dependencies survive between sandbox restarts. Only `docker sandbox rm` destroys them.

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
  --ctx-size 65536 \
  --parallel 1 \
  --n-gpu-layers 99 \
  --threads 8 \
  --flash-attn on
```

**Configuration notes:**

- `--ctx-size 65536`: 64K context. The input prompt (all in-scope files + strategy + ideas + results history) uses ~30K tokens, so 32K is too tight — the model runs out of output tokens and Aider hangs retrying malformed edits. 64K gives ample headroom on 128GB hardware with negligible speed cost.
- `--parallel 1`: **Critical.** llama-server defaults to `--parallel 4` with a shared (unified) KV cache. When Aider's reflection retries fire concurrent requests, multiple 30K+ token prompts compete for the same 65K pool, causing `Context size has been exceeded` (HTTP 500) errors and infinite retry loops. Single-slot mode eliminates this — requests queue instead of crashing.
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

A clone or a git worktree both work. With the split architecture, only Aider runs
inside the sandbox (with `--no-git`), so the `.git` reference is never used there.
Git operations and builds all run on the host.

```bash
# Option 1: Clone
git clone https://github.com/MetaMask/metamask-extension.git ~/metamask-autoresearch

# Option 2: Worktree (if you already have the repo)
cd ~/metamask-extension
git worktree add ~/metamask-autoresearch
```

### Option A: Custom Template (Recommended)

Build a custom template with Aider pre-installed:

```bash
docker build -t metamask-autoresearch-template \
  -f development/autoresearch/Dockerfile ~/metamask-autoresearch
```

Create the sandbox:

```bash
docker sandbox run \
  -t metamask-autoresearch-template \
  shell ~/metamask-autoresearch
```

### Option B: Shell Sandbox (No Custom Template)

```bash
docker sandbox run shell ~/metamask-autoresearch

# Inside the sandbox — install Aider (persists between restarts)
pip install aider-chat
```

### Configure Sandbox Network Policy

Allow the sandbox to reach the LLM server running on the host:

```bash
# On the HOST
docker sandbox ls  # get sandbox name

docker sandbox network proxy <sandbox-name> \
  --allow-host "localhost:8080"
```

This persists across sandbox restarts. You only need to set it once per sandbox.

### Verify Sandbox

```bash
# Inside the sandbox
aider --version
curl http://host.docker.internal:8080/v1/models
```

### Install Dependencies and Configure Git (on the Host)

Builds and benchmarks run on the host. Install dependencies there:

```bash
# On the HOST
cd ~/metamask-autoresearch
corepack enable
yarn install
git checkout -b autoresearch/browserify-build-perf
```

## Step 3: Running the Autoresearch Loop

The loop script runs **on the host**. It uses `docker sandbox exec` to invoke Aider
inside the sandbox, then runs builds and benchmarks locally with full RAM.

### Establish Baseline

```bash
# On the HOST — make scripts executable and record the baseline
chmod +x development/autoresearch/*.sh
bash development/autoresearch/autoresearch.sh
```

### Start the Loop

```bash
# Find your sandbox name
docker sandbox ls

# Run with defaults (100 experiments, Qwen 3.5 27B)
bash development/autoresearch/autoresearch-loop.sh --sandbox <name>

# Or customize
bash development/autoresearch/autoresearch-loop.sh \
  --sandbox <name> \
  --max-experiments 50 \
  --model openai/qwen3.5-27b

# Dry run (print the prompt without executing)
bash development/autoresearch/autoresearch-loop.sh --sandbox <name> --dry-run
```

### What Happens Per Experiment

```
Experiment N:
  1. Loop (on host) builds a prompt with:
     - autoresearch.md (objective, metrics, constraints)
     - autoresearch.ideas.md (idea backlog)
     - Recent results from results.tsv
     - Current best build time
  2. Aider runs INSIDE THE SANDBOX, reads the prompt + in-scope files
  3. Aider proposes and applies ONE code change
  4. autoresearch.checks.sh validates:
     - Modified files are within allowed scope
     - No syntax errors
     - Dependencies unchanged
     - Frozen files untouched
  5. Changes sync to host via bidirectional workspace sync
  6. Correctness checks run ON HOST (autoresearch.checks.sh)
  7. yarn dist runs ON HOST (full build with LavaMoat, full RAM)
  8. autoresearch.sh captures metrics:
     - build_time_seconds
     - bundle_size_total_kb
     - standard_entry_points_seconds
  9. If build_time < current_best:
     -> git commit (keep the improvement)
     -> Update current best
  10. If build_time >= current_best:
     -> git checkout -- . (revert)
  11. Results appended to results.tsv
  12. Repeat
```

### Overnight Run

```bash
# Start the loop on the HOST in the background with logging
nohup bash development/autoresearch/autoresearch-loop.sh \
  --sandbox <name> \
  --max-experiments 150 \
  > /tmp/autoresearch-run-$(date +%Y%m%d).log 2>&1 &

# Monitor progress
tail -f ~/metamask-autoresearch/development/autoresearch/results.tsv
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

With the split architecture, `yarn install` runs on the host — not inside the sandbox.
If it fails on the host, check your network connection. If you're running it inside
the sandbox by mistake, note that the sandbox MITM proxy and 4GB RAM limit make
`yarn install` and `yarn dist` unreliable there.

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
