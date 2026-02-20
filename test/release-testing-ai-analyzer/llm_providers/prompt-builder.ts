/**
 * Shared prompt builder for all LLM analyzers
 * Extracted from ClaudeAnalyzer to avoid code duplication
 */

import type {
  PullRequestInfo,
  PullRequestCommit,
  FileCategories,
  PullRequestFile,
} from '../types';

/** Regex to detect cherry-pick commits (release(cp):, cherry-pick, cp-X.Y.Z, release(runway):) */
const CHERRY_PICK_PATTERN =
  /release\s*\(\s*cp\s*\)|cherry-pick|release\s*\(\s*runway\s*\)|cp-\d+\.\d+/iu;

function isCherryPickCommit(commit: PullRequestCommit): boolean {
  return CHERRY_PICK_PATTERN.test(commit.message);
}

export class PromptBuilder {
  /**
   * Builds the analysis prompt for LLM analyzers
   *
   * @param prInfo
   * @param fileCategories
   */
  buildAnalysisPrompt(
    prInfo: PullRequestInfo,
    fileCategories: FileCategories,
  ): string {
    const highRiskAreas = this.identifyHighRiskAreas(fileCategories);
    const fileSummary = this.buildFileSummary(prInfo.files, fileCategories);
    const cherryPickCommits = (prInfo.commits ?? []).filter(isCherryPickCommit);
    const hasCherryPicks = cherryPickCommits.length > 0;

    const cherryPickSection = hasCherryPicks
      ? `
## Cherry-Pick Commits (${cherryPickCommits.length} commits)

This release includes cherry-picked fixes. Generate scenarios in \`cherryPickScenarios\` ONLY for cherry-picks that are HIGH or MEDIUM risk (e.g. fix: security, migration, controller, transaction flow). Skip low-risk cherry-picks (chore, bump, minor config). Prioritize initial release scenarios - they are the main focus.

${cherryPickCommits.map((c) => `- ${c.message.split('\n')[0]}`).join('\n')}
`
      : '';

    return `You are a QA automation engineer specializing in browser extension testing, specifically for MetaMask extension releases.

Your task is to analyze a release PR and identify risky areas that need focused exploratory testing.

## PR Information
- PR #${prInfo.number}: ${prInfo.title}
- Author: ${prInfo.author}
- Total Commits: ${prInfo.commitCount}
- Files Changed: ${prInfo.files.length}
${cherryPickSection}
## Changed Files Summary

${fileSummary}

## High-Risk Areas Identified
${highRiskAreas.map((area) => `- ${area}`).join('\n')}

## Your Task

Analyze the changes and generate a comprehensive testing plan. Split scenarios into TWO sections:

1. **scenarios** (initialScenarios): Scenarios from analyzing ALL initial commits on the release branch - PRIORITIZE these; they are the main focus.
2. **cherryPickScenarios**: ONLY for cherry-picks that are risky (fix: security, migration, controller, transaction flow). Skip low-risk cherry-picks (chore, bump, minor config). If no risky cherry-picks, use empty array [].

For each scenario, provide:
- **Area**: The functional area affected (e.g., "Token Management", "Transaction Signing")
- **Risk Level**: high or medium only (exclude low risk scenarios)
- **Test Steps**: Specific, actionable test steps (3-5 steps per scenario)
- **Why This Matters**: Concise explanation of why this area needs testing focus

## Focus Areas for MetaMask Extension Testing

Focus ONLY on user-facing and functional changes. EXCLUDE build/configuration changes.

Consider: Wallet Operations, Transaction Signing, Token Management, Network Management, State Migrations, Security, UI/UX, Performance, State Management.

**EXCLUDE**: Build system, config files, linting, CI/CD, documentation, Storybook, Changelog.

## Output Format

Return a JSON object with this exact structure:
{
  "scenarios": [
    {
      "area": "string",
      "riskLevel": "high" | "medium",
      "testSteps": ["1. first step", "2. second step", "3. third step"],
      "whyThisMatters": "concise explanation"
    }
  ],
  "cherryPickScenarios": [
    {
      "area": "string",
      "riskLevel": "high" | "medium",
      "testSteps": ["1. step", "2. step"],
      "whyThisMatters": "MUST start with 'Cherry-pick PR_NUMBER' (e.g. 'Cherry-pick 39766 fixes...') - include the PR number from the commit message"
    }
  ],
  "summary": "Brief 2-3 sentence summary of the overall risk profile"
}

**IMPORTANT**:
- \`scenarios\` = initial release testing (PRIORITY - main focus)
- \`cherryPickScenarios\` = ONLY for risky cherry-picks (fix: security/migration/controller/transaction). Skip chore/bump/config. Empty [] if none are risky.
- For cherryPickScenarios: ALWAYS start whyThisMatters with "Cherry-pick" followed by PR number (e.g. "Cherry-pick 39766 fixes..." - extract from commit message which often contains the number in parens).
- Order HIGH risk first, then MEDIUM
- Number each test step: "1. ", "2. ", "3. "
- Focus on UI/UX and user-facing functionality

Return ONLY valid JSON, no markdown formatting or code blocks.`;
  }

  /**
   * Identifies high-risk areas based on file categories
   *
   * @param fileCategories
   */
  private identifyHighRiskAreas(fileCategories: FileCategories): string[] {
    const areas: string[] = [];

    if (fileCategories.controllers.length > 0) {
      areas.push('Controller logic changes (business logic)');
    }
    if (fileCategories.migrations.length > 0) {
      areas.push('State migrations (data format changes)');
    }
    if (fileCategories.uiComponents.length > 0) {
      areas.push('UI component changes (user-facing)');
    }
    if (fileCategories.config.length > 0) {
      areas.push('Configuration changes (build/system)');
    }

    return areas;
  }

  /**
   * Builds a summary of changed files organized by category
   *
   * @param files
   * @param categories
   */
  private buildFileSummary(
    files: PullRequestInfo['files'],
    categories: FileCategories,
  ): string {
    let summary = '';

    if (categories.controllers.length > 0) {
      summary += `\n### Controllers (${categories.controllers.length} files)\n`;
      categories.controllers.slice(0, 10).forEach((file: string) => {
        const fileInfo = files.find(
          (f: PullRequestFile) => f.filename === file,
        );
        summary += `- ${file} (+${fileInfo?.additions || 0} -${fileInfo?.deletions || 0})\n`;
      });
      if (categories.controllers.length > 10) {
        summary += `- ... and ${categories.controllers.length - 10} more\n`;
      }
    }

    if (categories.uiComponents.length > 0) {
      summary += `\n### UI Components (${categories.uiComponents.length} files)\n`;
      categories.uiComponents.slice(0, 10).forEach((file: string) => {
        const fileInfo = files.find(
          (f: PullRequestFile) => f.filename === file,
        );
        summary += `- ${file} (+${fileInfo?.additions || 0} -${fileInfo?.deletions || 0})\n`;
      });
      if (categories.uiComponents.length > 10) {
        summary += `- ... and ${categories.uiComponents.length - 10} more\n`;
      }
    }

    if (categories.migrations.length > 0) {
      summary += `\n### Migrations (${categories.migrations.length} files)\n`;
      categories.migrations.forEach((file: string) => {
        const fileInfo = files.find(
          (f: PullRequestFile) => f.filename === file,
        );
        summary += `- ${file} (+${fileInfo?.additions || 0} -${fileInfo?.deletions || 0})\n`;
      });
    }

    if (categories.tests.length > 0) {
      summary += `\n### Tests (${categories.tests.length} files)\n`;
      summary += `Summary: ${categories.tests.length} test files modified\n`;
    }

    if (categories.config.length > 0) {
      summary += `\n### Config (${categories.config.length} files)\n`;
      categories.config.slice(0, 5).forEach((file: string) => {
        const fileInfo = files.find(
          (f: PullRequestFile) => f.filename === file,
        );
        summary += `- ${file} (+${fileInfo?.additions || 0} -${fileInfo?.deletions || 0})\n`;
      });
      if (categories.config.length > 5) {
        summary += `- ... and ${categories.config.length - 5} more\n`;
      }
    }

    if (categories.other.length > 0) {
      summary += `\n### Other (${categories.other.length} files)\n`;
      categories.other.slice(0, 5).forEach((file: string) => {
        const fileInfo = files.find(
          (f: PullRequestFile) => f.filename === file,
        );
        summary += `- ${file} (+${fileInfo?.additions || 0} -${fileInfo?.deletions || 0})\n`;
      });
      if (categories.other.length > 5) {
        summary += `- ... and ${categories.other.length - 5} more\n`;
      }
    }

    return summary;
  }
}
