# Release Testing Plan Generator

A production-quality tool that analyzes release PRs and generates comprehensive testing plans with risky areas that need focused exploratory testing.

## Overview

This tool:

1. Fetches PR information and changed files from GitHub
2. Categorizes files by type (controllers, UI components, migrations, etc.)
3. Uses LLM (GPT-5 by default, with Claude/Gemini fallback) to analyze changes and identify risky areas
4. Generates a structured testing plan with specific scenarios
5. Validates output quality and completeness

## Prerequisites

### Required Dependencies

Install the following packages if not already present:

```bash
# Core dependency (always required)
yarn add @octokit/rest

# For Claude provider (default)
yarn add @anthropic-ai/sdk

# For OpenAI provider (optional)
yarn add openai

# For Gemini provider (optional)
yarn add @google/genai
```

### Environment Variables

**Provider Selection (with automatic fallback)**:

- `E2E_OPENAI_API_KEY` - OpenAI API key (default provider: GPT-5)
- `E2E_CLAUDE_API_KEY` - Claude API key (fallback: Claude Opus 4.5)
- `E2E_GEMINI_API_KEY` - Gemini API key (fallback: Gemini 3 Pro)

The tool automatically selects providers in this order: GPT-5 → Claude → Gemini
You can override this by using `--provider` flag.

**Common**:

- `GITHUB_TOKEN` (recommended) - GitHub token for authenticated API access
  - **Without token**: 60 requests/hour (may hit rate limits)
  - **With token**: 5,000 requests/hour (recommended for frequent use)
  - Create token at: https://github.com/settings/tokens (no special permissions needed for public repos)

## Usage

### Basic Usage

```bash
# Set API key as environment variable (default: GPT-5)
export E2E_OPENAI_API_KEY="your-openai-api-key-here"

# Generate testing plan for a PR (uses GPT-5 by default)
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts <PR_NUMBER>

# Or use Claude (fallback)
export E2E_CLAUDE_API_KEY="your-claude-api-key-here"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts <PR_NUMBER>
```

### With Command Line Arguments

```bash
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts <PR_NUMBER> \
  --provider openai \
  --github-token "your-github-token" \
  --output "testing-plan.json"
```

### Options

- `PR_NUMBER` (required) - The GitHub PR number to analyze
- `--provider <PROVIDER>` - LLM provider: `openai` (default), `claude`, or `gemini`
  - Default: Automatically selects based on available API keys (GPT-5 → Claude → Gemini)
  - API keys are read from environment variables (see Environment Variables section)
- `--model <MODEL>` - Model name
  - OpenAI default: `gpt-5`
  - Claude default: `claude-opus-4-5-20251101`
  - Gemini default: `gemini-3-pro-preview`
- `--github-token <TOKEN>` - GitHub token (overrides `GITHUB_TOKEN` env var)
- `--output <FILE>` - Save JSON output to file

## Examples

### Using GPT-5 (default)

```bash
# Analyze release PR #39655 (release 13.17.0) with GPT-5 (default)
export E2E_OPENAI_API_KEY="your-openai-api-key"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --output test-plan-39655.json

# Or explicitly specify OpenAI provider (API key read from environment)
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider openai
```

### Using Claude (fallback)

```bash
# Analyze with Claude (will be used if E2E_OPENAI_API_KEY is not set)
export E2E_CLAUDE_API_KEY="your-claude-api-key"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --output test-plan-39655.json

# Or explicitly specify Claude provider
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider claude
```

### Using Gemini (fallback)

```bash
# Analyze with Gemini (will be used if E2E_OPENAI_API_KEY and E2E_CLAUDE_API_KEY are not set)
export E2E_GEMINI_API_KEY="your-gemini-api-key"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --output test-plan-39655.json

# Or explicitly specify Gemini provider
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider gemini
```

### Provider Fallback

The tool automatically falls back to available providers if the primary provider fails:

```bash
# If GPT-5 fails, automatically tries Claude, then Gemini
export E2E_OPENAI_API_KEY="your-openai-key"
export E2E_CLAUDE_API_KEY="your-claude-key"
export E2E_GEMINI_API_KEY="your-gemini-key"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655
```

### Explicit Provider Selection

```bash
# Force a specific provider (no fallback)
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider openai
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider claude
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --provider gemini
```

## Output

The tool generates:

1. **Console Output**: Formatted testing plan with:
   - Summary statistics
   - High/Medium/Low risk scenarios grouped by priority
   - Each scenario includes:
     - Area affected
     - Risk level
     - Description
     - Test steps
     - Affected files
     - Rationale

2. **JSON Output** (if `--output` specified): Complete structured data including:
   - PR metadata
   - File categories
   - All scenarios with full details
   - Validation results

## Output Validation

The tool automatically validates the generated plan and provides:

- Quality score (0-100)
- List of issues found
- Strengths identified
- Exit code: 0 if valid (score ≥ 70), 1 otherwise

## Architecture

### Components

**Main Script**:

- **`generate-release-testing-plan.ts`**: Main script that orchestrates everything

**Utilities** (`utils/`):

- **`github-client.ts`**: Fetches PR information from GitHub API
- **`file-categorizer.ts`**: Categorizes changed files by type
- **`output-validator.ts`**: Validates output quality and completeness

**LLM Providers** (`release-testing-ai-analyzer/providers/`):

- **`claude-analyzer.ts`**: Integrates with Claude API for analysis
- **`openai-analyzer.ts`**: Integrates with OpenAI GPT API for analysis
- **`gemini-analyzer.ts`**: Integrates with Google Gemini API for analysis
- **`llm-analyzer.ts`**: Abstract LLM analyzer interface

**Types**:

- **`types.ts`**: TypeScript type definitions

### How It Works

1. **Fetch PR Data**: Uses GitHub API to get PR details and changed files
2. **Categorize Files**: Groups files into controllers, UI, migrations, tests, config, other
3. **Analyze with LLM**: Sends structured prompt to selected LLM provider (GPT-5 default, with Claude/Gemini fallback) with:
   - PR summary
   - File categories
   - High-risk area indicators
   - MetaMask-specific testing focus areas
4. **Build Plan**: Structures LLM response into a testing plan
5. **Validate**: Checks for completeness, quality, and coverage

## Integration

### Adding secrets for CI (GitHub Actions)

The script runs in CI from the **publish-prerelease** workflow (on release PRs). To make it work:

1. **Open repository secrets**
   - GitHub repo → **Settings** → **Secrets and variables** → **Actions**.

2. **Create these repository secrets** (optional; at least one LLM key is needed for the script to run):
   - `E2E_OPENAI_API_KEY` – OpenAI API key (recommended as default).
   - `E2E_CLAUDE_API_KEY` – Claude/Anthropic API key (fallback).
   - `E2E_GEMINI_API_KEY` – Google Gemini API key (fallback).

3. **Click “New repository secret”** for each, set **Name** (e.g. `E2E_OPENAI_API_KEY`) and **Secret** (the API key value). Never commit keys to the repo.

4. **How they’re used in CI**
   - `main.yml` passes these secrets into the reusable workflow `publish-prerelease.yml`.
   - The “AI generated test plan” step in `publish-prerelease.yml` runs the script with those env vars. If none are set, the step will fail with “No API key found”; if at least one is set, the script runs (with provider fallback).

### CI/CD Integration

Can be integrated into GitHub Actions:

```yaml
- name: Generate Testing Plan
  env:
    E2E_CLAUDE_API_KEY: ${{ secrets.E2E_CLAUDE_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts ${{ github.event.pull_request.number }} \
      --output testing-plan.json
```

### As a GitHub Action Comment

The tool can be extended to post results as a PR comment (similar to `identify-codeowners.ts`).

## Model Information

### Supported Providers

**OpenAI (default)**:

- Default model: `gpt-5`
- OpenAI GPT-5 model
- Primary provider with automatic fallback to Claude/Gemini if unavailable

**Claude (fallback)**:

- Default model: `claude-opus-4-5-20251101`
- Claude Opus 4.5, Anthropic's frontier reasoning model optimized for complex software engineering tasks
- Used as fallback if GPT-5 is unavailable

**Gemini (fallback)**:

- Default model: `gemini-3-pro-preview`
- Google Gemini 3 Pro model
- Used as final fallback if GPT-5 and Claude are unavailable

The model name and provider are tracked in the output for transparency. The tool automatically selects providers in order: GPT-5 → Claude → Gemini. You can override this by using the `--provider` flag to force a specific provider.

## Error Handling

The tool includes comprehensive error handling:

- Validates PR exists and is accessible
- Handles API rate limits and errors
- Validates Claude response format
- Provides clear error messages

## Troubleshooting

### GitHub API Rate Limit Exceeded

**Error**: `API rate limit exceeded for 104.28.211.187`

**Solution**: Provide a GitHub token to increase rate limits:

1. **Create a GitHub token** (no special permissions needed for public repos):
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it (e.g., "Testing Plan Generator")
   - No scopes needed for public repos
   - Click "Generate token" and copy it

2. **Use the token**:

   ```bash
   # Option 1: Environment variable (recommended)
   export GITHUB_TOKEN="your-token-here"
   yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655

   # Option 2: Command line argument
   yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655 --github-token "your-token-here"
   ```

**Rate Limits**:

- Without token: 60 requests/hour
- With token: 5,000 requests/hour

### Other Common Issues

**"Cannot find module '@octokit/rest'"**:

```bash
yarn add @octokit/rest @anthropic-ai/sdk
```

**"No API key found"**:
Set at least one of the environment variables (`E2E_OPENAI_API_KEY`, `E2E_CLAUDE_API_KEY`, or `E2E_GEMINI_API_KEY`):

```bash
export E2E_OPENAI_API_KEY="your-key"
yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts 39655
```

## Code Quality

This tool follows MetaMask coding standards:

- ✅ TypeScript (no JavaScript)
- ✅ Comprehensive error handling
- ✅ Type definitions
- ✅ Production-ready code quality
