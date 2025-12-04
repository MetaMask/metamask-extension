/**
 * Unified Jest reporter for console baseline capture and enforcement.
 *
 * This reporter operates in two modes:
 * - **enforce** (default): Compares current warnings against baseline and fails on violations
 * - **capture**: Collects console warnings/errors and writes them to a baseline file
 *
 * The baseline is tracked PER TEST FILE for granular violation detection.
 * The baseline file path is automatically determined based on testType:
 * - 'unit' -> test/jest/console-baseline-unit.json
 * - 'integration' -> test/jest/console-baseline-integration.json
 *
 * Uses shared categorization rules from console-categorizer.js.
 *
 * Note: This file is intentionally JavaScript (not TypeScript) because Jest
 * reporters and configuration files are traditionally JS. The main jest.config.js
 * is also JavaScript. Converting to TypeScript would require additional build
 * steps for Jest infrastructure files.
 *
 * @example Update baseline using dedicated scripts
 * ```bash
 * yarn test:unit:update-baseline
 * yarn test:unit:update-baseline path/to/file
 * yarn test:integration:update-baseline
 * yarn test:integration:update-baseline path/to/file
 * ```
 * @example jest.config.js
 * {
 *   reporters: [
 *     ['<rootDir>/test/jest/console-baseline-reporter.js', {
 *       testType: 'unit',
 *     }]
 *   ]
 * }
 * @module console-baseline-reporter
 */

const fs = require('fs');
const path = require('path');
const {
  categorizeUnitTestMessage,
  categorizeIntegrationTestMessage,
  createFallbackCategory,
} = require('./console-categorizer');

class ConsoleBaselineReporter {
  /**
   * Create a new ConsoleBaselineReporter.
   *
   * @param {object} globalConfig - Jest global configuration
   * @param {object} options - Reporter options
   * @param {string} [options.testType] - 'unit' or 'integration' (default: 'unit')
   * @param {boolean} [options.failOnViolation] - Fail tests when baseline is violated (default: true)
   * @param {boolean} [options.showImprovements] - Show when warnings are reduced (default: true)
   */
  constructor(globalConfig, options = {}) {
    this._globalConfig = globalConfig;

    // Mode is determined by UPDATE_BASELINE environment variable
    // - UPDATE_BASELINE=true → 'capture' (write baseline)
    // - Otherwise → 'enforce' (compare against baseline)
    const mode = process.env.UPDATE_BASELINE === 'true' ? 'capture' : 'enforce';

    this._options = {
      testType: options.testType || 'unit',
      mode,
      failOnViolation: options.failOnViolation !== false,
      showImprovements: options.showImprovements !== false,
    };

    // Load baseline (needed for both modes - enforce reads it, capture may update it)
    this.baseline = this._loadBaseline();

    // Track warnings per file: { 'path/to/file.test.ts': { 'category': count } }
    this.warningsByFile = {};

    // Track violations and improvements (enforce mode)
    this.violations = [];
    this.improvements = [];
    this.newFiles = [];

    // Store error to return from getLastError()
    this._error = null;
  }

  // ===========================================================================
  // BASELINE FILE OPERATIONS
  // ===========================================================================

  /**
   * Resolve the baseline path based on test type.
   *
   * @returns {string} Resolved absolute path to baseline file
   */
  _resolveBaselinePath() {
    let filename;
    if (this._options.testType === 'unit') {
      filename = 'console-baseline-unit.json';
    } else if (this._options.testType === 'integration') {
      filename = 'console-baseline-integration.json';
    } else {
      throw new Error(
        `Invalid testType (${this._options.testType}): must be 'unit' or 'integration'`,
      );
    }

    return path.resolve(this._globalConfig.rootDir, 'test/jest', filename);
  }

  /**
   * Load the baseline JSON file.
   *
   * @returns {object} Baseline object with files property
   */
  _loadBaseline() {
    const baselinePath = this._resolveBaselinePath();

    try {
      if (!fs.existsSync(baselinePath)) {
        if (this._options.mode === 'enforce') {
          const updateCmd = `yarn test:${this._options.testType}:update-baseline`;
          console.warn(
            `\n⚠️  Baseline file not found: ${baselinePath}\n` +
              `   Run "${updateCmd}" to create it.\n`,
          );
        }
        return { files: {} };
      }

      const content = fs.readFileSync(baselinePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`\n❌ Failed to load baseline: ${error.message}\n`);
      return { files: {} };
    }
  }

  /**
   * Write the baseline JSON file (capture mode).
   * Merges new results with existing baseline - only updates files that ran.
   */
  _writeBaseline() {
    const baselinePath = this._resolveBaselinePath();

    // Start with existing baseline files (to preserve files that didn't run)
    const existingFiles = this.baseline.files || {};

    // Merge: update files that ran, keep files that didn't run
    const mergedFiles = { ...existingFiles };
    for (const [filePath, warnings] of Object.entries(this.warningsByFile)) {
      if (Object.keys(warnings).length > 0) {
        // File has warnings - update it
        mergedFiles[filePath] = warnings;
      } else if (mergedFiles[filePath]) {
        // File ran but has no warnings - remove from baseline
        delete mergedFiles[filePath];
      }
      // Files that didn't run are preserved as-is
    }

    const baseline = {
      files: mergedFiles,
      generated: new Date().toISOString(),
      nodeVersion: process.version,
    };

    if (JSON.stringify(mergedFiles) === JSON.stringify(this.baseline.files)) {
      console.log(`\n✅ Baseline is up-to-date, no changes needed.\n`);
    } else {
      // Write JSON with 2-space indentation and trailing newline (matches Prettier)
      const jsonString = `${JSON.stringify(baseline, null, 2)}\n`;
      fs.writeFileSync(baselinePath, jsonString);

      const filesUpdated = Object.keys(this.warningsByFile).length;
      const totalFilesInBaseline = Object.keys(mergedFiles).length;
      console.log(
        `\n✅ Baseline updated: ${filesUpdated} file(s) updated, ${totalFilesInBaseline} total in baseline`,
      );
      console.log(`   Written to: ${baselinePath}\n`);
    }
  }

  // ===========================================================================
  // MESSAGE CATEGORIZATION
  // ===========================================================================

  /**
   * Get relative path from root directory for cleaner display.
   *
   * @param {string} absolutePath - Absolute file path
   * @returns {string} Relative path from project root
   */
  _getRelativePath(absolutePath) {
    return path.relative(this._globalConfig.rootDir, absolutePath);
  }

  /**
   * Categorize a console message using shared rules.
   *
   * @param {string} type - Console message type (log, warn, error, etc.)
   * @param {string} text - Console message text
   * @returns {string} Category name for this message
   */
  _categorizeMessage(type, text) {
    let categorizer;
    if (this._options.testType === 'unit') {
      categorizer = categorizeUnitTestMessage;
    } else if (this._options.testType === 'integration') {
      categorizer = categorizeIntegrationTestMessage;
    } else {
      throw new Error(
        `Invalid testType (${this._options.testType}): must be 'unit' or 'integration'`,
      );
    }

    const category = categorizer(type, text);

    // If category is null (suppressed by rules), use fallback for baseline tracking
    if (category === null) {
      return createFallbackCategory(type, text);
    }
    return category;
  }

  // ===========================================================================
  // JEST REPORTER LIFECYCLE
  // ===========================================================================

  /**
   * Called once per test FILE (not per test case!) when the file starts.
   *
   * @param {object} _testInfo - Test information (unused)
   */
  onTestStart(_testInfo) {
    // No-op - we only need onTestResult for console capture
  }

  /**
   * Called once per test FILE after it completes.
   * testResult.console contains all console messages from that file!
   *
   * @param {object} _testInfo - Test information (unused)
   * @param {object} testResult - Test result containing console messages
   */
  onTestResult(_testInfo, testResult) {
    const filePath = this._getRelativePath(testResult.testFilePath);

    // Initialize warnings for this file
    if (!this.warningsByFile[filePath]) {
      this.warningsByFile[filePath] = {};
    }

    // Collect only warnings and errors from this test file
    // Note: testResult.console requires verbose: false in jest.config.js
    if (testResult.console) {
      for (const msg of testResult.console) {
        if (msg.type === 'warn' || msg.type === 'error') {
          const category = this._categorizeMessage(msg.type, msg.message);

          if (!this.warningsByFile[filePath][category]) {
            this.warningsByFile[filePath][category] = 0;
          }
          this.warningsByFile[filePath][category] += 1;
        }
      }
    }
  }

  /**
   * Called once after ALL tests complete.
   * Handles both capture and enforce modes.
   */
  onRunComplete() {
    if (this._options.mode === 'capture') {
      this._writeBaseline();
    } else if (this._options.mode === 'enforce') {
      this._enforceBaseline();
    } else {
      throw new Error(
        `Invalid mode (${this._options.mode}): must be 'capture' or 'enforce'`,
      );
    }
  }

  /**
   * Jest calls this to check for errors.
   * Returns an error if baseline violations were detected.
   *
   * @returns {Error|null} Error if violations detected, null otherwise
   */
  getLastError() {
    return this._error;
  }

  // ===========================================================================
  // ENFORCE MODE: COMPARISON AND REPORTING
  // ===========================================================================

  /**
   * Enforce baseline - compare current warnings and report violations.
   */
  _enforceBaseline() {
    // Compare against baseline (per file)
    this._compareWithBaseline();

    // Print results
    this._printResults();

    // Fail if violations found (getLastError() will return this error to Jest)
    if (this._options.failOnViolation && this.violations.length > 0) {
      this._error = new Error(
        `Console baseline violated: ${this.violations.length} violation(s) detected. ` +
          'Fix the warnings or update the baseline.',
      );
    }
  }

  /**
   * Compare current warnings with baseline (per file).
   */
  _compareWithBaseline() {
    const baselineFiles = this.baseline.files || {};

    // Check each file that was run
    for (const [filePath, currentWarnings] of Object.entries(
      this.warningsByFile,
    )) {
      const baselineForFile = baselineFiles[filePath] || {};
      const isNewFile = !baselineFiles[filePath];

      // Track if this is a new file (not in baseline)
      if (isNewFile && Object.keys(currentWarnings).length > 0) {
        this.newFiles.push({
          filePath,
          warnings: currentWarnings,
        });
      }

      // Check for violations (increased counts or new categories)
      for (const [category, currentCount] of Object.entries(currentWarnings)) {
        const baselineCount = baselineForFile[category] || 0;

        if (currentCount > baselineCount) {
          this.violations.push({
            filePath,
            category,
            baseline: baselineCount,
            current: currentCount,
            increase: currentCount - baselineCount,
            isNew: baselineCount === 0,
            isNewFile,
          });
        } else if (currentCount < baselineCount) {
          this.improvements.push({
            filePath,
            category,
            baseline: baselineCount,
            current: currentCount,
            decrease: baselineCount - currentCount,
          });
        }
      }

      // Check for categories that disappeared from this file
      for (const [category, baselineCount] of Object.entries(baselineForFile)) {
        if (!currentWarnings[category]) {
          this.improvements.push({
            filePath,
            category,
            baseline: baselineCount,
            current: 0,
            decrease: baselineCount,
            fixed: true,
          });
        }
      }
    }
  }

  /**
   * Print comparison results.
   */
  _printResults() {
    const hasViolations = this.violations.length > 0;
    const hasNewFiles = this.newFiles.length > 0;
    const hasImprovements =
      this._options.showImprovements && this.improvements.length > 0;
    const isClean = !hasViolations && !hasImprovements && !hasNewFiles;

    if (isClean) {
      console.log('\n✅ Console baseline matches exactly!\n');
      return;
    }

    console.log('\n');
    console.log('═'.repeat(80));
    console.log('  Console Baseline Report (Per-File)');
    console.log('═'.repeat(80));

    if (hasViolations) {
      this._printViolations();
    }

    if (hasNewFiles) {
      this._printNewFiles();
    }

    if (hasImprovements) {
      this._printImprovements();
    }

    this._printSummary();

    console.log('═'.repeat(80));
    console.log('\n');
  }

  /**
   * Print violations section.
   */
  _printViolations() {
    console.log('\n❌ BASELINE VIOLATIONS DETECTED\n');

    const violationsByFile = this._groupByFile(this.violations);

    for (const [filePath, fileViolations] of Object.entries(violationsByFile)) {
      console.log(`  📁 ${filePath}`);
      for (const violation of fileViolations) {
        if (violation.isNew) {
          console.log(`     🆕 NEW: ${violation.category}`);
          console.log(`        Current: ${violation.current} occurrences`);
        } else {
          console.log(`     ⬆️  ${violation.category}`);
          console.log(
            `        Baseline: ${violation.baseline}, Current: ${violation.current} (+${violation.increase})`,
          );
        }
      }
      console.log('');
    }

    const updateCmd = `yarn test:${this._options.testType}:update-baseline`;
    console.log('  💡 Next steps:');
    console.log('     1. Fix the warnings in your code, OR');
    console.log(
      `     2. Update baseline: ${updateCmd} (requires justification)\n`,
    );
  }

  /**
   * Print new files section.
   */
  _printNewFiles() {
    console.log('\n📋 NEW FILES (not in baseline)\n');
    console.log('  The following test files are not in the baseline yet:\n');

    for (const { filePath, warnings } of this.newFiles) {
      const totalWarnings = Object.values(warnings).reduce(
        (sum, count) => sum + count,
        0,
      );
      console.log(`  📁 ${filePath}`);
      console.log(`     Total warnings: ${totalWarnings}`);
      for (const [category, count] of Object.entries(warnings)) {
        console.log(`       • ${category}: ${count}`);
      }
      console.log('');
    }

    const updateCmd = `yarn test:${this._options.testType}:update-baseline`;
    console.log(`  💡 Run "${updateCmd}" to add these files to baseline.\n`);
  }

  /**
   * Print improvements section.
   */
  _printImprovements() {
    console.log('\n✨ CONSOLE IMPROVEMENTS DETECTED\n');
    console.log('  Great job! The following warnings were reduced:\n');

    const improvementsByFile = this._groupByFile(this.improvements);

    for (const [filePath, fileImprovements] of Object.entries(
      improvementsByFile,
    )) {
      console.log(`  📁 ${filePath}`);
      for (const improvement of fileImprovements) {
        if (improvement.fixed) {
          console.log(`     🎉 FIXED: ${improvement.category}`);
          console.log(
            `        All ${improvement.baseline} occurrences eliminated!`,
          );
        } else {
          console.log(`     ⬇️  ${improvement.category}`);
          console.log(
            `        Baseline: ${improvement.baseline}, Current: ${improvement.current} (-${improvement.decrease})`,
          );
        }
      }
      console.log('');
    }

    const updateCmd = `yarn test:${this._options.testType}:update-baseline`;
    console.log('  💡 Lock in improvements:');
    console.log(`     ${updateCmd}\n`);
  }

  /**
   * Group items by file path.
   *
   * @param {Array} items - Array of items with filePath property
   * @returns {object} Object keyed by filePath
   */
  _groupByFile(items) {
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.filePath]) {
        grouped[item.filePath] = [];
      }
      grouped[item.filePath].push(item);
    }
    return grouped;
  }

  /**
   * Print summary statistics.
   */
  _printSummary() {
    const totalViolations = this.violations.length;
    const totalImprovements = this.improvements.length;
    const totalNewFiles = this.newFiles.length;
    const filesRun = Object.keys(this.warningsByFile).length;

    console.log('  ─'.repeat(39));
    console.log('  SUMMARY');
    console.log(`    Files analyzed: ${filesRun}`);
    console.log(`    Violations: ${totalViolations}`);
    console.log(`    Improvements: ${totalImprovements}`);
    console.log(`    New files: ${totalNewFiles}`);
  }
}

module.exports = ConsoleBaselineReporter;
