/**
 * Shared prompt builder for all LLM analyzers
 * Extracted from ClaudeAnalyzer to avoid code duplication
 */

import type {
  PullRequestInfo,
  FileCategories,
  PullRequestFile,
} from '../types';

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

    return `You are a QA automation engineer specializing in browser extension testing, specifically for MetaMask extension releases.

Your task is to analyze a release PR and identify risky areas that need focused exploratory testing.

## PR Information
- PR #${prInfo.number}: ${prInfo.title}
- Author: ${prInfo.author}
- Commits: ${prInfo.commitCount}
- Files Changed: ${prInfo.files.length}
- Total Changes: +${prInfo.files.reduce((sum: number, f: PullRequestFile) => sum + f.additions, 0)} -${prInfo.files.reduce((sum: number, f: PullRequestFile) => sum + f.deletions, 0)}

## Changed Files Summary

${fileSummary}

## High-Risk Areas Identified
${highRiskAreas.map((area) => `- ${area}`).join('\n')}

## Your Task

Analyze the changes and generate a comprehensive testing plan with specific testing scenarios. For each scenario, provide:

1. **Area**: The functional area affected (e.g., "Token Management", "Transaction Signing", "Network Configuration")
2. **Risk Level**: high or medium only (exclude low risk scenarios)
3. **Test Steps**: Specific, actionable test steps (3-5 steps per scenario)
4. **Why This Matters**: Concise explanation of why this area needs testing focus based on the changes

## Focus Areas for MetaMask Extension Testing

Focus ONLY on user-facing and functional changes. EXCLUDE build/configuration changes.

Consider these critical areas when analyzing:
- **Wallet Operations**: Account creation, import, backup, restore
- **Transaction Signing**: ERC20, ERC721, ERC1155, contract interactions
- **Token Management**: Adding, removing, detecting tokens/NFTs
- **Network Management**: Adding custom networks, switching networks
- **State Migrations**: Data format changes, backward compatibility
- **Security**: Permission changes, encryption, key management
- **UI/UX**: Component changes, user flows, accessibility (PRIORITY)
- **Performance**: Large data sets, rendering optimizations
- **Cross-browser**: Chrome MV3 vs Firefox MV2 differences
- **State Management**: Redux state changes, controller updates

**EXCLUDE these areas** (do not create scenarios for):
- Build system changes (webpack, browserify, build scripts)
- Configuration files (package.json, yarn.lock, tsconfig.json)
- Linting/formatting changes (Prettier, ESLint configs)
- CI/CD changes (.github/workflows, GitHub Actions)
- Documentation-only changes
- Test infrastructure changes (unless they affect test behavior)
- Storybook configuration
- Changelog updates

## Output Format

Return a JSON object with this exact structure:
{
  "scenarios": [
    {
      "area": "string",
      "riskLevel": "high" | "medium",
      "testSteps": ["1. first step", "2. second step", "3. third step"],
      "whyThisMatters": "concise explanation of why this needs testing focus"
    }
  ],
  "summary": "Brief 2-3 sentence summary of the overall risk profile"
}

**IMPORTANT**:
- Always order scenarios with HIGH risk scenarios FIRST, followed by MEDIUM risk scenarios
- Number each test step starting with "1. ", "2. ", "3. ", etc. (include the number and period in each step string)
- Focus on UI/UX and user-facing functionality changes
- Exclude build, configuration, and infrastructure-only changes

Focus on areas with:
- State migrations or data format changes
- Controller logic changes (business logic)
- Security-sensitive code (encryption, key management)
- User-facing flows (onboarding, transactions, settings)
- Cross-component dependencies
- Performance-critical paths

Prioritize scenarios that could cause:
- Data loss or corruption
- Security vulnerabilities
- User-facing bugs
- State inconsistencies
- Performance regressions

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
