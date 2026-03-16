/**
 * Generates consolidated markdown reports from send transaction test results
 * Creates human-readable documentation of test execution with step-by-step details
 */

import fs from 'fs';
import path from 'path';
import {
  SendTransactionReport,
  SendTransactionResult,
} from './send-transaction-types';

/**
 * Generate a consolidated report from send transaction results
 * Creates a markdown file with detailed information about each transaction and step
 *
 * @param results - Array of SendTransactionResult objects from test execution
 * @param reportPath - File path where the markdown report will be written
 */
export function generateSendConsolidatedReport(
  results: SendTransactionResult[],
  reportPath: string,
): void {
  if (!results || results.length === 0) {
    console.warn('[PROD TEST] ⚠️  No results to generate report from');
    return;
  }

  // Build markdown content
  const lines: string[] = [];

  // Header
  const reportDate = new Date().toISOString();
  lines.push('# Send Transaction Test Report');
  lines.push('');
  lines.push(`**Generated:** ${reportDate}`);
  lines.push('');

  // Summary section
  const summary = calculateSummary(results);
  lines.push('## Test Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Networks Tested | ${summary.totalNetworks} |`);
  lines.push(`| Passed Networks | ${summary.passedNetworks} |`);
  lines.push(`| Failed Networks | ${summary.failedNetworks} |`);
  lines.push(`| Pass Rate | ${summary.passRate} |`);
  lines.push(`| Total Steps | ${summary.totalSteps} |`);
  lines.push(`| Successful Steps | ${summary.successfulSteps} |`);
  lines.push(`| Failed Steps | ${summary.failedSteps} |`);
  lines.push('');

  // Results by network
  lines.push('## Network Results');
  lines.push('');

  results.forEach((result, index) => {
    lines.push(`### ${index + 1}. ${result.networkName}`);
    lines.push('');

    // Network metadata
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    lines.push(`| Chain ID | \`${result.chainId}\` |`);
    lines.push(`| Symbol | ${result.nativeSymbol} |`);
    lines.push(`| Status | ${result.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'} |`);
    if (result.duration) {
      lines.push(
        `| Duration | ${(result.duration / 1000).toFixed(2)}s |`,
      );
    }
    if (result.transactionHash) {
      lines.push(
        `| Transaction | [\`${result.transactionHash.substring(0, 10)}...\`](${result.blockExplorerUrl}/tx/${result.transactionHash}) |`,
      );
    }
    if (result.initialBalance) {
      lines.push(`| Initial Balance | ${result.initialBalance} ${result.nativeSymbol} |`);
    }
    if (result.finalBalance) {
      lines.push(`| Final Balance | ${result.finalBalance} ${result.nativeSymbol} |`);
    }
    lines.push('');

    // Steps table
    if (result.steps.length > 0) {
      lines.push('#### Steps');
      lines.push('');
      lines.push(
        '| # | Step | Expected | Actual | Status | Duration | Error |',
      );
      lines.push('|---|------|----------|--------|--------|----------|-------|');

      result.steps.forEach((step, stepIndex) => {
        const statusIcon =
          step.status === 'success'
            ? '✅'
            : step.status === 'failure'
              ? '❌'
              : '⏭️';
        const duration = step.duration ? `${step.duration}ms` : '—';
        const error = step.error ? `\`${escapeMarkdown(step.error)}\`` : '—';

        lines.push(
          `| ${stepIndex + 1} | ${escapeMarkdown(step.stepName)} | ${escapeMarkdown(step.expectedOutcome)} | ${escapeMarkdown(step.actualOutcome || 'N/A')} | ${statusIcon} | ${duration} | ${error} |`,
        );
      });

      lines.push('');
    }

    // Step summary for this network
    lines.push('#### Step Summary');
    lines.push('');
    lines.push(`- **Total Steps:** ${result.summary.totalSteps}`);
    lines.push(`- **Successful:** ${result.summary.successfulSteps}`);
    lines.push(`- **Failed:** ${result.summary.failedSteps}`);
    lines.push(`- **Skipped:** ${result.summary.skippedSteps}`);
    lines.push('');

    // Failed steps details
    const failedSteps = result.steps.filter((s) => s.status === 'failure');
    if (failedSteps.length > 0) {
      lines.push('#### ❌ Failed Steps Details');
      lines.push('');
      failedSteps.forEach((step) => {
        lines.push(`**${step.stepName}**`);
        lines.push('');
        lines.push(`  - **Expected:** ${step.expectedOutcome}`);
        lines.push(`  - **Actual:** ${step.actualOutcome || 'N/A'}`);
        if (step.error) {
          lines.push(`  - **Error:** ${step.error}`);
        }
        lines.push('');
      });
    }

    lines.push('---');
    lines.push('');
  });

  // Write to file
  try {
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
    console.log(`[PROD TEST] 📄 Report generated: ${reportPath}`);
  } catch (error) {
    console.error(`[PROD TEST] ❌ Failed to write report: ${error}`);
    throw error;
  }
}

/**
 * Calculate overall summary statistics from all results
 */
function calculateSummary(results: SendTransactionResult[]) {
  const totalNetworks = results.length;
  const passedNetworks = results.filter((r) => r.overallStatus === 'passed').length;
  const failedNetworks = totalNetworks - passedNetworks;
  const totalSteps = results.reduce((sum, r) => sum + r.summary.totalSteps, 0);
  const successfulSteps = results.reduce(
    (sum, r) => sum + r.summary.successfulSteps,
    0,
  );
  const failedSteps = results.reduce((sum, r) => sum + r.summary.failedSteps, 0);
  const passRate =
    totalNetworks > 0
      ? `${((passedNetworks / totalNetworks) * 100).toFixed(1)}%`
      : '0%';

  return {
    totalNetworks,
    passedNetworks,
    failedNetworks,
    totalSteps,
    successfulSteps,
    failedSteps,
    passRate,
  };
}

/**
 * Escape special markdown characters in strings
 */
function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '\\n')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}
