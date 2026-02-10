#!/usr/bin/env node
/**
 * Release Testing Plan Generator
 *
 * Analyzes a release PR and generates a comprehensive testing plan with risky areas
 * that need focused exploratory testing.
 *
 * Usage:
 * yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts <PR_NUMBER> [options]
 *
 * Environment Variables:
 * E2E_OPENAI_API_KEY - OpenAI API key (default provider)
 * E2E_CLAUDE_API_KEY - Claude API key (fallback)
 * E2E_GEMINI_API_KEY - Gemini API key (fallback)
 * GITHUB_TOKEN - GitHub token for PR access (optional, uses public access if not provided)
 */

import { GitHubClient } from './utils/github-client';
import { ClaudeAnalyzer } from './llm_providers/claude-analyzer';
import { OpenAIAnalyzer } from './llm_providers/openai-analyzer';
import { GeminiAnalyzer } from './llm_providers/gemini-analyzer';
import { FileCategorizer } from './utils/file-categorizer';
import { OutputValidator } from './utils/output-validator';
import { getApiKeyForProvider, LLM_CONFIG } from './llm_providers/config';
import type {
  TestingPlan,
  PullRequestInfo,
  LLMAnalysisResponse,
} from './types';
import type { LLMAnalyzer, LLMProvider } from './llm_providers/llm-analyzer';

type CliOptions = {
  prNumber: number;
  githubToken?: string;
  model?: string;
  provider?: LLMProvider;
  outputFile?: string;
};

async function main(): Promise<void> {
  const options = parseArguments();

  console.log(`\n🔍 Analyzing Release PR #${options.prNumber}...\n`);

  // Warn if no GitHub token is provided
  if (!options.githubToken && !process.env.GITHUB_TOKEN) {
    console.log(
      '⚠️  Note: No GitHub token provided. Using unauthenticated requests (60 req/hour limit).',
    );
    console.log(
      '   For higher limits (5,000 req/hour), set GITHUB_TOKEN or use --github-token\n',
    );
  }

  try {
    // Initialize clients
    const githubClient = new GitHubClient(options.githubToken);
    const fileCategorizer = new FileCategorizer();
    const validator = new OutputValidator();

    // Step 1: Fetch PR information
    console.log('📥 Fetching PR information from GitHub...');
    const prInfo = await githubClient.getPullRequestInfo(options.prNumber);
    console.log(`   ✓ Found PR: ${prInfo.title}`);
    console.log(`   ✓ ${prInfo.files.length} files changed`);
    console.log(`   ✓ ${prInfo.commitCount} commits\n`);

    // Step 2: Categorize files
    console.log('📂 Categorizing changed files...');
    const fileCategories = fileCategorizer.categorizeFiles(prInfo.files);
    console.log(`   ✓ Controllers: ${fileCategories.controllers.length}`);
    console.log(`   ✓ UI Components: ${fileCategories.uiComponents.length}`);
    console.log(`   ✓ Migrations: ${fileCategories.migrations.length}`);
    console.log(`   ✓ Tests: ${fileCategories.tests.length}`);
    console.log(`   ✓ Config: ${fileCategories.config.length}`);
    console.log(`   ✓ Other: ${fileCategories.other.length}\n`);

    // Step 3: Analyze with LLM (with fallback: GPT-5 → Claude → Gemini)
    const providerNames: Record<LLMProvider, string> = {
      claude: 'Claude',
      openai: 'OpenAI GPT',
      gemini: 'Google Gemini',
    };

    let analysis: LLMAnalysisResponse | undefined;
    let analyzer: LLMAnalyzer | null = null;
    let providerUsed: LLMProvider | undefined;
    let modelUsed: string = '';

    // Determine provider with fallback if not explicitly specified
    if (options.provider) {
      providerUsed = options.provider;
    } else {
      // Use fallback chain from config: GPT-5 → Claude → Gemini
      const foundProvider = LLM_CONFIG.providerPriority.find(
        (provider) => getApiKeyForProvider(provider) !== undefined,
      );

      if (!foundProvider) {
        throw new Error(
          'No API key found. Please set E2E_OPENAI_API_KEY, E2E_CLAUDE_API_KEY, or E2E_GEMINI_API_KEY environment variable, or use --provider flag.',
        );
      }
      providerUsed = foundProvider;
    }

    const providerName = providerNames[providerUsed];

    // Verify API key is available for the selected provider
    const apiKeyForProvider = getApiKeyForProvider(providerUsed);
    if (!apiKeyForProvider) {
      throw new Error(
        `API key required for ${providerName}. Set E2E_${providerUsed.toUpperCase()}_API_KEY environment variable.`,
      );
    }

    try {
      analyzer = createAnalyzer(providerUsed, options.model);
      console.log(
        `🤖 Analyzing changes with ${providerName} (${analyzer.getModelName()})...`,
      );
      console.log('   This may take 30-60 seconds...\n');
      analysis = await analyzer.analyzePR(prInfo, fileCategories);
      modelUsed = analyzer.getModelName();
      if (analysis) {
        console.log(
          `   ✓ Generated ${analysis.scenarios.length} testing scenarios\n`,
        );
      }
    } catch (error) {
      // If explicit provider fails, try fallback chain
      if (options.provider) {
        throw error; // Don't fallback if user explicitly specified provider
      }

      console.log(`⚠️  ${providerName} failed, trying fallback providers...\n`);

      // Try fallback providers in order from config: GPT-5 → Claude → Gemini
      const currentProviderIndex =
        LLM_CONFIG.providerPriority.indexOf(providerUsed);
      const fallbackProviders = LLM_CONFIG.providerPriority.slice(
        currentProviderIndex + 1,
      );

      let success = false;
      for (const fallbackProvider of fallbackProviders) {
        const fallbackApiKey = getApiKeyForProvider(fallbackProvider);

        if (!fallbackApiKey) {
          console.log(
            `   ⏭️  Skipping ${providerNames[fallbackProvider]} (no API key)\n`,
          );
          continue;
        }

        try {
          console.log(`   🔄 Trying ${providerNames[fallbackProvider]}...`);
          analyzer = createAnalyzer(fallbackProvider, options.model);
          analysis = await analyzer.analyzePR(prInfo, fileCategories);
          providerUsed = fallbackProvider;
          modelUsed = analyzer.getModelName();
          if (analysis) {
            console.log(
              `   ✓ Generated ${analysis.scenarios.length} testing scenarios with ${providerNames[fallbackProvider]}\n`,
            );
          }
          success = true;
          break;
        } catch (fallbackError) {
          console.log(
            `   ✗ ${providerNames[fallbackProvider]} failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}\n`,
          );
          continue;
        }
      }

      if (!success) {
        throw new Error(
          `All providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Step 4: Build testing plan
    if (!analysis) {
      throw new Error('Analysis failed - no scenarios generated');
    }
    console.log('📋 Building testing plan...');
    const testingPlan = buildTestingPlan(prInfo, analysis, modelUsed);
    console.log('   ✓ Testing plan complete\n');

    // Step 5: Validate output quality
    console.log('✅ Validating output quality...');
    const validation = validator.validatePlan(testingPlan);
    console.log(`   Quality Score: ${validation.score}/100`);
    if (validation.strengths.length > 0) {
      console.log(`   ✓ ${validation.strengths.join('\n   ✓ ')}`);
    }
    if (validation.issues.length > 0) {
      console.log(`   ⚠️  ${validation.issues.join('\n   ⚠️  ')}`);
    }
    console.log('');

    // Step 6: Output results
    if (validation.isValid) {
      console.log('✨ Testing plan validation passed!\n');
    } else {
      console.log(
        '⚠️  Testing plan validation had issues, but proceeding...\n',
      );
    }

    const output = formatTestingPlan(testingPlan);
    console.log(output);

    // Save to file if requested
    if (options.outputFile) {
      const fs = await import('fs/promises');
      await fs.writeFile(
        options.outputFile,
        JSON.stringify(testingPlan, null, 2),
      );
      console.log(`\n💾 Saved JSON output to ${options.outputFile}`);
    }

    // Exit with appropriate code
    process.exit(validation.isValid ? 0 : 1);
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Parses command line arguments
 */
function parseArguments(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      'Usage: yarn tsx test/release-testing-ai-analyzer/generate-release-testing-plan.ts <PR_NUMBER> [options]',
    );
    console.error('\nOptions:');
    console.error(
      '  --provider <PROVIDER>  LLM provider: openai (default), claude, or gemini',
    );
    console.error(
      '                        Default: Uses E2E_OPENAI_API_KEY → E2E_CLAUDE_API_KEY → E2E_GEMINI_API_KEY',
    );
    console.error('  --model <MODEL>        Model name');
    console.error('                        - OpenAI default: gpt-5');
    console.error(
      '                        - Claude default: claude-opus-4-5-20251101',
    );
    console.error(
      '                        - Gemini default: gemini-3-pro-preview',
    );
    console.error('  --github-token <TOKEN> GitHub token (optional)');
    console.error('  --output <FILE>        Save JSON output to file');
    console.error('\nEnvironment Variables:');
    console.error('  E2E_OPENAI_API_KEY - OpenAI API key (default provider)');
    console.error('  E2E_CLAUDE_API_KEY - Claude API key (fallback)');
    console.error('  E2E_GEMINI_API_KEY - Gemini API key (fallback)');
    console.error('  GITHUB_TOKEN - GitHub token (optional)');
    process.exit(1);
  }

  const prNumber = parseInt(args[0], 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a positive integer');
    process.exit(1);
  }

  // Determine provider (default: openai with fallback)
  let provider: LLMProvider | undefined;
  let githubToken = process.env.GITHUB_TOKEN;
  let outputFile: string | undefined;
  let model: string | undefined;

  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === '--provider' && i + 1 < args.length) {
      const providerArg = args[i + 1].toLowerCase();
      if (
        providerArg === 'claude' ||
        providerArg === 'openai' ||
        providerArg === 'gemini'
      ) {
        provider = providerArg as LLMProvider;
      } else {
        console.error(
          `Error: Invalid provider "${providerArg}". Must be "claude", "openai", or "gemini"`,
        );
        process.exit(1);
      }
      i += 1;
    } else if (args[i] === '--github-token' && i + 1 < args.length) {
      githubToken = args[i + 1];
      i += 1;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputFile = args[i + 1];
      i += 1;
    } else if (args[i] === '--model' && i + 1 < args.length) {
      model = args[i + 1];
      i += 1;
    }
  }

  // Verify API key is available if provider is specified
  if (provider) {
    const apiKey = getApiKeyForProvider(provider);
    if (!apiKey) {
      console.error(
        `Error: API key required for ${provider}. Set E2E_${provider.toUpperCase()}_API_KEY environment variable.`,
      );
      process.exit(1);
    }
  }

  // If no provider specified, verify at least one API key is available
  if (!provider) {
    const hasAnyApiKey = LLM_CONFIG.providerPriority.some(
      (p) => getApiKeyForProvider(p) !== undefined,
    );
    if (!hasAnyApiKey) {
      throw new Error(
        'No API key found. Please set at least one of: E2E_OPENAI_API_KEY, E2E_CLAUDE_API_KEY, or E2E_GEMINI_API_KEY.',
      );
    }
  }

  // Set default model if not provided (only if provider is specified)
  if (!model && provider) {
    const defaultModels: Record<LLMProvider, string> = {
      claude: 'claude-opus-4-5-20251101',
      openai: 'gpt-5',
      gemini: 'gemini-3-pro-preview',
    };
    model = defaultModels[provider];
  }

  return {
    prNumber,
    githubToken,
    outputFile,
    model,
    provider,
  };
}

/**
 * Creates the appropriate LLM analyzer based on provider
 *
 * @param provider
 * @param model
 */
function createAnalyzer(provider: LLMProvider, model?: string): LLMAnalyzer {
  if (provider === 'claude') {
    return new ClaudeAnalyzer(model);
  } else if (provider === 'openai') {
    return new OpenAIAnalyzer(model);
  } else if (provider === 'gemini') {
    return new GeminiAnalyzer(model);
  }
  throw new Error(`Unsupported provider: ${String(provider)}`);
}

/**
 * Builds the complete testing plan from analysis results
 *
 * @param prInfo
 * @param analysis
 * @param analysis.scenarios
 * @param analysis.summary
 * @param modelUsed
 */
function buildTestingPlan(
  prInfo: PullRequestInfo,
  analysis: { scenarios: TestingPlan['scenarios']; summary: string },
  modelUsed: string,
): TestingPlan {
  // Ensure scenarios are sorted: high risk first, then medium risk
  const sortedScenarios = [...analysis.scenarios].sort((a, b) => {
    if (a.riskLevel === 'high' && b.riskLevel === 'medium') {
      return -1;
    }
    if (a.riskLevel === 'medium' && b.riskLevel === 'high') {
      return 1;
    }
    return 0;
  });

  const highRiskScenarios = sortedScenarios.filter(
    (s) => s.riskLevel === 'high',
  ).length;
  const mediumRiskScenarios = sortedScenarios.filter(
    (s) => s.riskLevel === 'medium',
  ).length;

  const totalAdditions = prInfo.files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = prInfo.files.reduce((sum, f) => sum + f.deletions, 0);

  return {
    prNumber: prInfo.number,
    prTitle: prInfo.title,
    generatedAt: new Date().toISOString(),
    modelUsed,
    summary: {
      totalFilesChanged: prInfo.files.length,
      totalAdditions,
      totalDeletions,
      highRiskScenarios,
      mediumRiskScenarios,
    },
    scenarios: sortedScenarios,
  };
}

/**
 * Formats the testing plan for console output
 *
 * @param plan
 */
function formatTestingPlan(plan: TestingPlan): string {
  let output = '\n';
  output += `${'═'.repeat(80)}\n`;
  output += '  RELEASE TESTING PLAN\n';
  output += `${'═'.repeat(80)}\n\n`;
  output += `PR #${plan.prNumber}: ${plan.prTitle}\n`;
  output += `Generated: ${new Date(plan.generatedAt).toLocaleString()}\n`;
  output += `Model: ${plan.modelUsed}\n\n`;
  output += `${'─'.repeat(80)}\n`;
  output += 'SUMMARY\n';
  output += `${'─'.repeat(80)}\n\n`;
  output += `Files Changed: ${plan.summary.totalFilesChanged}\n`;
  output += `Code Changes: +${plan.summary.totalAdditions} -${plan.summary.totalDeletions}\n`;
  output += `High Risk Scenarios: ${plan.summary.highRiskScenarios}\n`;
  output += `Medium Risk Scenarios: ${plan.summary.mediumRiskScenarios}\n\n`;

  // Group scenarios by risk level (only high and medium)
  const highRisk = plan.scenarios.filter((s) => s.riskLevel === 'high');
  const mediumRisk = plan.scenarios.filter((s) => s.riskLevel === 'medium');

  if (highRisk.length > 0) {
    output += `${'─'.repeat(80)}\n`;
    output += '🔴 HIGH RISK SCENARIOS\n';
    output += `${'─'.repeat(80)}\n\n`;
    highRisk.forEach((scenario, index) => {
      output += formatScenario(scenario, index + 1);
    });
  }

  if (mediumRisk.length > 0) {
    output += `${'─'.repeat(80)}\n`;
    output += '🟡 MEDIUM RISK SCENARIOS\n';
    output += `${'─'.repeat(80)}\n\n`;
    mediumRisk.forEach((scenario, index) => {
      output += formatScenario(scenario, index + 1);
    });
  }

  output += `\n${'═'.repeat(80)}\n`;

  return output;
}

/**
 * Formats a single testing scenario
 *
 * @param scenario
 * @param index
 */
function formatScenario(
  scenario: TestingPlan['scenarios'][0],
  index: number,
): string {
  let output = `${index}. ${scenario.area} [${scenario.riskLevel.toUpperCase()}]\n\n`;
  output += `   Why This Matters: ${scenario.whyThisMatters}\n\n`;
  output += `   Test Steps:\n`;
  scenario.testSteps.forEach((step) => {
    // Steps are already numbered in the JSON (e.g., "1. step"), so use as-is
    output += `   ${step}\n`;
  });
  output += '\n';
  return output;
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, buildTestingPlan, formatTestingPlan };
