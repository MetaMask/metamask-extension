#!/usr/bin/env ts-node

/**
 * Console Output to Markdown Report Generator
 *
 * This script parses console output from E2E test runs and generates
 * a comprehensive, self-explanatory markdown report.
 */

import * as fs from 'fs';
import * as path from 'path';

type TestStep = {
  step: string;
  status: 'success' | 'failure' | 'info' | 'warning';
  timestamp?: string;
  details?: string;
};

type TestReport = {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: TestStep[];
  errors: string[];
  warnings: string[];
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
  };
};

class ConsoleReportGenerator {
  private report: TestReport;

  private outputFile: string;

  constructor(testName: string, outputFile?: string) {
    this.report = {
      testName,
      status: 'RUNNING',
      startTime: new Date(),
      steps: [],
      errors: [],
      warnings: [],
      summary: {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
      },
    };
    this.outputFile =
      outputFile ||
      path.join(__dirname, `${testName.replace(/\s+/g, '-')}-REPORT.md`);
  }

  /**
   * Parse console output and extract test information
   * @param consoleOutput
   */
  public parseConsoleOutput(consoleOutput: string): void {
    const lines = consoleOutput.split('\n');

    for (const line of lines) {
      // Parse [PROD TEST] log lines
      if (line.includes('[PROD TEST]')) {
        this.parseTestLog(line);
      }
      // Parse error lines
      else if (line.includes('Error:') || line.includes('❌')) {
        this.report.errors.push(line.trim());
      }
      // Parse warning lines
      else if (line.includes('⚠️') || line.includes('Warning:')) {
        this.report.warnings.push(line.trim());
      }
    }

    // Update summary
    this.updateSummary();
  }

  /**
   * Parse individual test log line
   * @param line
   */
  private parseTestLog(line: string): void {
    const cleanLine = line.replace('[PROD TEST]', '').trim();

    let status: 'success' | 'failure' | 'info' | 'warning' = 'info';

    if (
      cleanLine.includes('✅') ||
      cleanLine.toLowerCase().includes('success')
    ) {
      status = 'success';
    } else if (
      cleanLine.includes('❌') ||
      cleanLine.toLowerCase().includes('failure') ||
      cleanLine.toLowerCase().includes('failed')
    ) {
      status = 'failure';
    } else if (
      cleanLine.includes('⚠️') ||
      cleanLine.toLowerCase().includes('warning')
    ) {
      status = 'warning';
    }

    this.report.steps.push({
      step: cleanLine,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update summary statistics
   */
  private updateSummary(): void {
    this.report.summary.totalSteps = this.report.steps.length;
    this.report.summary.successfulSteps = this.report.steps.filter(
      (s) => s.status === 'success',
    ).length;
    this.report.summary.failedSteps = this.report.steps.filter(
      (s) => s.status === 'failure',
    ).length;

    // Determine overall status
    if (this.report.errors.length > 0 || this.report.summary.failedSteps > 0) {
      this.report.status = 'FAILED';
    } else if (this.report.summary.totalSteps > 0) {
      this.report.status = 'PASSED';
    }
  }

  /**
   * Mark test as complete
   * @param success
   */
  public complete(success: boolean): void {
    this.report.endTime = new Date();
    this.report.duration =
      this.report.endTime.getTime() - this.report.startTime.getTime();
    this.report.status = success ? 'PASSED' : 'FAILED';
    this.updateSummary();
  }

  /**
   * Generate markdown report
   */
  public generateMarkdown(): string {
    const statusIcon =
      this.report.status === 'PASSED'
        ? '✅'
        : this.report.status === 'FAILED'
          ? '❌'
          : '🔄';
    const durationText = this.report.duration
      ? `${(this.report.duration / 1000).toFixed(2)}s`
      : 'In Progress';

    let markdown = `# E2E Test Report: ${this.report.testName}

${statusIcon} **Status:** ${this.report.status}
📅 **Started:** ${this.report.startTime.toISOString().replace('T', ' ').slice(0, 19)}
${this.report.endTime ? `🏁 **Completed:** ${this.report.endTime.toISOString().replace('T', ' ').slice(0, 19)}` : ''}
⏱️ **Duration:** ${durationText}

---

## Executive Summary

`;

    // Add summary table
    markdown += `| Metric | Value |
|--------|-------|
| **Total Steps** | ${this.report.summary.totalSteps} |
| **Successful Steps** | ✅ ${this.report.summary.successfulSteps} |
| **Failed Steps** | ❌ ${this.report.summary.failedSteps} |
| **Warnings** | ⚠️ ${this.report.warnings.length} |
| **Errors** | 🚨 ${this.report.errors.length} |
| **Success Rate** | ${this.report.summary.totalSteps > 0 ? ((this.report.summary.successfulSteps / this.report.summary.totalSteps) * 100).toFixed(1) : '0.0'}% |

---

`;

    // Add errors section if any
    if (this.report.errors.length > 0) {
      markdown += `## 🚨 Errors

`;
      this.report.errors.forEach((error, index) => {
        markdown += `### Error ${index + 1}

\`\`\`
${error}
\`\`\`

`;
      });
      markdown += `---

`;
    }

    // Add warnings section if any
    if (this.report.warnings.length > 0) {
      markdown += `## ⚠️ Warnings

`;
      this.report.warnings.forEach((warning, index) => {
        markdown += `${index + 1}. ${warning}\n`;
      });
      markdown += `
---

`;
    }

    // Add detailed test steps
    markdown += `## 📋 Detailed Test Steps

`;

    let stepNumber = 1;
    for (const step of this.report.steps) {
      const icon =
        step.status === 'success'
          ? '✅'
          : step.status === 'failure'
            ? '❌'
            : step.status === 'warning'
              ? '⚠️'
              : 'ℹ️';

      markdown += `### Step ${stepNumber}: ${icon} ${step.step.substring(0, 100)}${step.step.length > 100 ? '...' : ''}

**Status:** ${step.status.toUpperCase()}
${step.timestamp ? `**Time:** ${step.timestamp.replace('T', ' ').slice(0, 19)}` : ''}

<details>
<summary>Full Details</summary>

\`\`\`
${step.step}
\`\`\`

</details>

`;
      stepNumber++;
    }

    markdown += `---

## 📊 Test Flow Visualization

\`\`\`
`;

    // Create a simple ASCII flow
    for (let i = 0; i < this.report.steps.length; i++) {
      const step = this.report.steps[i];
      const icon =
        step.status === 'success'
          ? '✅'
          : step.status === 'failure'
            ? '❌'
            : step.status === 'warning'
              ? '⚠️'
              : 'ℹ️';

      const shortStep = step.step.substring(0, 60);
      markdown += `${i + 1}. ${icon} ${shortStep}${step.step.length > 60 ? '...' : ''}\n`;

      if (i < this.report.steps.length - 1) {
        markdown += `   |\n   v\n`;
      }
    }

    markdown += `\`\`\`

---

## 🔧 Environment Information

- **Test Framework:** Mocha + Playwright
- **Browser:** Chrome
- **Node Version:** ${process.version}
- **Platform:** ${process.platform}
- **Architecture:** ${process.arch}

---

## 📝 Notes

`;

    if (this.report.status === 'PASSED') {
      markdown += `✅ **All test steps completed successfully!**

This test validates:
- Network addition and configuration
- Account import functionality
- Token sending capabilities
- Transaction confirmation
- Activity list verification

`;
    } else if (this.report.status === 'FAILED') {
      markdown += `❌ **Test failed with errors.**

Please review the errors section above for details on what went wrong.

Common issues:
- Network connectivity problems
- RPC endpoint timeouts
- Insufficient balance
- Transaction confirmation delays
- UI element not found

`;
    }

    markdown += `
---

*Report generated on ${new Date().toISOString().replace('T', ' ').slice(0, 19)}*
`;

    return markdown;
  }

  /**
   * Save report to file
   */
  public saveReport(): void {
    const markdown = this.generateMarkdown();
    fs.writeFileSync(this.outputFile, markdown, 'utf-8');
    console.log(`\n📄 Report saved to: ${this.outputFile}\n`);
  }

  /**
   * Add a custom step
   * @param step
   * @param status
   */
  public addStep(
    step: string,
    status: 'success' | 'failure' | 'info' | 'warning' = 'info',
  ): void {
    this.report.steps.push({
      step,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add an error
   * @param error
   */
  public addError(error: string): void {
    this.report.errors.push(error);
  }

  /**
   * Add a warning
   * @param warning
   */
  public addWarning(warning: string): void {
    this.report.warnings.push(warning);
  }
}

// Export for use in tests
export type { TestReport, TestStep };
export { ConsoleReportGenerator };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: ts-node generate-report-from-console.ts <console-output-file> [output-report-file]

Example:
  ts-node generate-report-from-console.ts test-output.txt TEST_REPORT.md

Or pipe console output:
  yarn test:e2e:single test.spec.ts 2>&1 | ts-node generate-report-from-console.ts
`);
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'TEST_REPORT.md';

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const consoleOutput = fs.readFileSync(inputFile, 'utf-8');
  const generator = new ConsoleReportGenerator('E2E Test', outputFile);

  generator.parseConsoleOutput(consoleOutput);
  generator.complete(
    consoleOutput.includes('passing') && !consoleOutput.includes('failing'),
  );
  generator.saveReport();

  console.log('✅ Report generated successfully!');
}
