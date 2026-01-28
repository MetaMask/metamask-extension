// test/e2e/reporters/enhanced-spec-reporter.js
const { inherits } = require('util');
const fs = require('fs');
const path = require('path');
const Spec = require('mocha/lib/reporters/spec');

// Enhance stack traces to include more frames and better test file detection
// Increase stack trace limit to capture more frames (default is 10)
Error.stackTraceLimit = 50;

// Store original prepareStackTrace if it exists
const originalPrepareStackTrace = Error.prepareStackTrace;

// Custom stack trace formatter that preserves V8 CallSite objects for better analysis
Error.prepareStackTrace = (error, stack) => {
  // If there's an original formatter, use it, otherwise format manually
  if (originalPrepareStackTrace) {
    return originalPrepareStackTrace(error, stack);
  }

  // Format stack with enhanced information
  let stackString = `${error.name}: ${error.message}\n`;
  stack.forEach((frame) => {
    const functionName = frame.getFunctionName() || '<anonymous>';
    const fileName = frame.getFileName() || '';
    const lineNumber = frame.getLineNumber();
    const columnNumber = frame.getColumnNumber();

    // Format: at functionName (fileName:lineNumber:columnNumber)
    stackString += `    at ${functionName}`;
    if (fileName) {
      stackString += ` (${fileName}`;
      if (lineNumber !== null) {
        stackString += `:${lineNumber}`;
        if (columnNumber !== null) {
          stackString += `:${columnNumber}`;
        }
      }
      stackString += ')';
    }
    stackString += '\n';
  });

  return stackString;
};

/**
 * Enhanced Spec Reporter with detailed error reporting and summary
 * Extends Mocha's spec reporter to add:
 * - Detailed failure information
 * - Test summary at the end
 * - Color support for both local and CI environments
 *
 * @param {object} runner - Mocha test runner instance
 * @param {object} options - Reporter options
 */
function EnhancedSpecReporter(runner, options) {
  Spec.call(this, runner, options);

  const { stats } = runner;
  const failures = [];
  const allTests = []; // Track all tests (pass and fail)
  const testHierarchy = new Map(); // Track describe blocks

  // Track describe blocks to build hierarchy
  runner.on('suite', (suite) => {
    if (suite.title) {
      testHierarchy.set(suite, suite.title);
    }
  });

  // Track passing tests
  runner.on('pass', (test) => {
    allTests.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      status: 'pass',
      duration: test.duration || 0,
    });
  });

  runner.on('fail', (test, err) => {
    // Build test hierarchy path
    const hierarchy = [];
    let currentSuite = test.parent;
    while (currentSuite && currentSuite.title) {
      hierarchy.unshift(currentSuite.title);
      currentSuite = currentSuite.parent;
    }

    // Parse error to extract useful information
    const parsedError = parseError(err);

    // Get file path from test object (most reliable source)
    const fileInfo = extractFilePathFromTest(test);

    // Try to extract line number from test file by searching for the failing method
    let lineNumber = null;
    if (fileInfo?.path && parsedError?.failingAction) {
      lineNumber = extractLineNumberFromTestFile(
        fileInfo.path,
        test.title,
        parsedError.failingAction,
      );
    }

    const failureInfo = {
      title: test.title,
      fullTitle: test.fullTitle(),
      hierarchy,
      file: fileInfo?.path || null,
      lineNumber,
      error: {
        message: err?.message || 'Unknown error',
        stack: err?.stack || '',
        name: err?.name || 'Error',
        // Capture additional error properties if available
        code: err?.code,
        actual: err?.actual,
        expected: err?.expected,
      },
      parsedError,
      duration: test.duration || 0,
    };

    failures.push(failureInfo);
    allTests.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      status: 'fail',
      duration: test.duration || 0,
    });
  });

  runner.on('end', () => {
    try {
      printSummary(stats, failures, allTests);
    } catch (error) {
      // Fallback to stderr if stdout fails, but don't let errors break the reporter
      process.stderr.write(
        `\n[Enhanced Reporter Error] ${error.message}\n${error.stack}\n`,
      );
    }
  });
}

inherits(EnhancedSpecReporter, Spec);

/**
 * Print comprehensive test summary
 *
 * @param {object} stats - Test statistics from Mocha runner
 * @param {Array} failures - Array of failed test information
 * @param {Array} allTests - Array of all tests (pass and fail)
 */
function printSummary(stats, failures, allTests) {
  // Color codes for terminal
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
  };

  const isCI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  // Support FORCE_COLOR for CI environments that support colors (like GitHub Actions)
  const useColors =
    !isCI ||
    process.env.FORCE_COLOR === '1' ||
    process.env.FORCE_COLOR === 'true';

  const colorize = (text, color) => {
    return useColors && colors[color]
      ? `${colors[color]}${text}${colors.reset}`
      : text;
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log(colorize('📊 TEST SUMMARY', 'bold'));
  console.log('='.repeat(80));

  // Overall stats
  const total = stats.tests || 0;
  const passed = stats.passes || 0;
  const failed = stats.failures || 0;
  const pending = stats.pending || 0;
  const duration = stats.duration || 0;

  console.log(`\n${colorize('Total Tests:', 'bold')} ${total}`);
  console.log(`${colorize(`✅ Passed:`, 'green')} ${passed}`);
  console.log(`${colorize(`❌ Failed:`, 'red')} ${failed}`);
  if (pending > 0) {
    console.log(`${colorize(`⏸️  Pending:`, 'yellow')} ${pending}`);
  }
  console.log(
    `${colorize(`⏱️  Duration:`, 'blue')} ${(duration / 1000).toFixed(2)}s`,
  );

  // Test list table
  if (allTests.length > 0) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(colorize('📋 TEST LIST', 'bold'));
    console.log('-'.repeat(80));

    // Find the longest test title for formatting
    const maxTitleLength = Math.max(
      ...allTests.map((test) => test.fullTitle.length),
      40, // Minimum width
    );

    allTests.forEach((test, index) => {
      const statusIcon = test.status === 'pass' ? '✅' : '❌';
      const statusColor = test.status === 'pass' ? 'green' : 'red';
      const statusText = test.status === 'pass' ? 'PASS' : 'FAIL';
      const durationText = `${(test.duration / 1000).toFixed(2)}s`;

      // Format: "#. [ICON] Test Name                    [STATUS] Duration"
      const testTitle = test.fullTitle.padEnd(maxTitleLength);
      const statusDisplay = colorize(statusText.padStart(6), statusColor);

      console.log(
        `${(index + 1).toString().padStart(3)}. ${statusIcon} ${testTitle} ${statusDisplay} ${durationText}`,
      );
    });
  }

  // Detailed failure report
  if (failures.length > 0) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(colorize('❌ FAILED TESTS DETAILS', 'red'));
    console.log('-'.repeat(80));

    failures.forEach((failure, index) => {
      console.log(`\n${colorize(`${index + 1}. ${failure.fullTitle}`, 'red')}`);

      // Show file path with icon if available
      if (failure.file) {
        const fileDisplay = failure.lineNumber
          ? `${failure.file}:${failure.lineNumber}`
          : failure.file;
        console.log(
          `${colorize('   📄 Test File:', 'cyan')} ${colorize(fileDisplay, 'bold')}`,
        );
      } else {
        // Show warning when file path cannot be extracted
        console.log(
          `${colorize('   ⚠️  Warning:', 'yellow')} Could not extract file path from test object`,
        );
      }

      // Show parsed error details (failing step)
      if (failure.parsedError) {
        if (failure.parsedError.failingAction) {
          const stepDisplay = failure.lineNumber
            ? `${failure.parsedError.failingAction} (line ${failure.lineNumber})`
            : failure.parsedError.failingAction;
          console.log(
            `${colorize('   🔍 Failing Step:', 'yellow')} ${colorize(stepDisplay, 'bold')}`,
          );
        }
        if (failure.parsedError.selector) {
          // Truncate very long selectors for readability
          const displaySelector =
            failure.parsedError.selector.length > 150
              ? `${failure.parsedError.selector.substring(0, 150)}... (truncated)`
              : failure.parsedError.selector;
          console.log(
            `${colorize('   🎯 Element Selector:', 'cyan')} ${displaySelector}`,
          );
        }
        if (failure.parsedError.timeout) {
          console.log(
            `${colorize('   ⏱️  Timeout:', 'yellow')} ${failure.parsedError.timeout}`,
          );
        }
        if (failure.parsedError.expectedValue) {
          console.log(
            `${colorize('   📊 Expected Value:', 'cyan')} ${failure.parsedError.expectedValue}`,
          );
        }
      }

      console.log(
        `${colorize('   ⚠️  Error Type:', 'yellow')} ${failure.error.name}`,
      );
      console.log(
        `${colorize('   💬 Error Message:', 'yellow')} ${failure.error.message}`,
      );

      // Show actual/expected for assertion errors
      if (
        failure.error.actual !== undefined ||
        failure.error.expected !== undefined
      ) {
        if (failure.error.expected !== undefined) {
          console.log(
            `${colorize('   Expected:', 'cyan')} ${formatValue(failure.error.expected)}`,
          );
        }
        if (failure.error.actual !== undefined) {
          console.log(
            `${colorize('   Actual:', 'cyan')} ${formatValue(failure.error.actual)}`,
          );
        }
      }
    });
  }

  // Slow tests warning (if any test took more than 30 seconds)
  const slowTests = failures
    .filter((f) => f.duration > 30000)
    .sort((a, b) => b.duration - a.duration);

  if (slowTests.length > 0) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(colorize('🐌 SLOW TESTS (>30s)', 'yellow'));
    console.log('-'.repeat(80));
    slowTests.forEach((test) => {
      console.log(`   ${test.title} (${(test.duration / 1000).toFixed(2)}s)`);
    });
  }

  console.log(`\n${'='.repeat(80)}\n`);
}

/**
 * Parse error to extract useful debugging information
 *
 * @param {Error} err - Error object to parse
 * @returns {object|null} Parsed error information or null
 */
function parseError(err) {
  if (!err || !err.message) {
    return null;
  }

  const result = {};
  const { message } = err;

  // Parse Selenium/WebDriver timeout errors
  // Pattern: "Waiting for element to be located By(xpath, ...)"
  const waitingMatch = message.match(
    /Waiting for element to be located By\((\w+),\s*(.+?)\)/u,
  );
  if (waitingMatch) {
    result.failingAction = `Waiting for element (${waitingMatch[1]})`;
    result.selector = waitingMatch[2].trim();

    // Extract data-testid if present (handles both @data-testid and ./@data-testid)
    const testIdMatch = result.selector.match(
      /(?:\.\/)?@data-testid\s*=\s*['"]([^'"]+)['"]/u,
    );
    if (testIdMatch) {
      result.testId = testIdMatch[1];
      // Try to infer the page object method from testId
      result.failingAction = inferPageObjectMethod(
        result.testId,
        result.selector,
      );
    }

    // Extract expected value from contains() or text matching
    // Handles patterns like: contains(string(.), '24') or contains(string(.), "24")
    const containsMatch = result.selector.match(
      /contains\(string\(\.\),\s*['"]([^'"]+)['"]\)/u,
    );
    if (containsMatch) {
      result.expectedValue = containsMatch[1];
      // If we have a testId and expectedValue, enhance the failing action
      if (
        result.testId &&
        result.failingAction.includes('checkExpectedBalanceIsDisplayed')
      ) {
        result.failingAction = `checkExpectedBalanceIsDisplayed('${containsMatch[1]}')`;
      }
    }
  }

  // Parse timeout duration
  const timeoutMatch = message.match(/Wait timed out after (\d+)ms/u);
  if (timeoutMatch) {
    result.timeout = `${(parseInt(timeoutMatch[1], 10) / 1000).toFixed(2)}s`;
  }

  // Parse element not found errors
  const notFoundMatch = message.match(
    /no such element|Unable to locate element|Element not found/iu,
  );
  if (notFoundMatch) {
    result.failingAction = 'Element not found';
  }

  // Parse assertion errors
  if (err.actual !== undefined || err.expected !== undefined) {
    result.failingAction = 'Assertion failed';
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Infer page object method name from testId and selector patterns
 *
 * @param {string} testId - Test ID from data-testid attribute
 * @param {string} _selector - Selector string (unused, kept for API consistency)
 * @returns {string} Inferred page object method name
 */
function inferPageObjectMethod(testId, _selector) {
  // Common patterns in MetaMask E2E tests
  const methodMap = {
    'eth-overview__primary-currency': 'checkExpectedBalanceIsDisplayed',
    'home__asset-tab': 'checkPageIsLoaded',
    'account-overview__asset-tab': 'checkPageIsLoaded',
    'account-overview__account-menu-icon': 'checkPageIsLoaded',
    'transaction-status': 'checkTransactionStatus',
    'confirmation-page': 'checkPageIsLoaded',
    'permission-connect-button': 'clickConnectButton',
    'permission-approve-button': 'clickApproveButton',
    'home__asset-tab__nft-tab': 'checkNftTabIsDisplayed',
  };

  if (methodMap[testId]) {
    return `${methodMap[testId]}()`;
  }

  // Try to infer from testId pattern
  if (testId.includes('balance') || testId.includes('currency')) {
    return 'checkExpectedBalanceIsDisplayed()';
  }
  if (testId.includes('modal') || testId.includes('dialog')) {
    return 'checkModalIsDisplayed() or checkModalIsNotDisplayed()';
  }
  if (testId.includes('page') || testId.includes('tab')) {
    return 'checkPageIsLoaded()';
  }

  return 'Waiting for element';
}

/**
 * Extract file path from Mocha test object
 *
 * @param {object} test - Mocha test object
 * @returns {{path: string}|null} File path or null if not found
 */
function extractFilePathFromTest(test) {
  if (!test) {
    return null;
  }

  // Walk up the suite tree to find file path
  // Mocha stores file info on the root suite, not necessarily on the test
  let current = test;
  let filePath = null;

  // Check test itself first
  filePath = test.file || test.fileName;

  // Walk up parent suites to find file
  while (!filePath && current && current.parent) {
    current = current.parent;
    filePath = current.file || current.fileName;
  }

  if (!filePath) {
    return null;
  }

  // Convert to string if it's not already
  filePath = String(filePath);

  // Mocha test.file is usually an absolute path
  // Convert to relative path if it contains test/e2e/tests
  const relativePathMatch = filePath.match(
    /(test\/e2e\/(?:tests|page-objects)\/[^:]+\.(?:spec|test|ts|js))$/u,
  );

  if (relativePathMatch) {
    return {
      path: relativePathMatch[1],
    };
  }

  // If no relative path match, try to extract from absolute path
  // Pattern: /Users/.../test/e2e/tests/.../file.spec.ts
  const absoluteMatch = filePath.match(
    /.*\/(test\/e2e\/(?:tests|page-objects)\/[^:]+\.(?:spec|test|ts|js))$/u,
  );

  if (absoluteMatch) {
    return {
      path: absoluteMatch[1],
    };
  }

  return null;
}

/**
 * Extract line number from test file by searching within the specific test case
 *
 * @param {string} testFilePath - Path to the test file
 * @param {string} testTitle - The test title (e.g., "should not show the shield entry modal...")
 * @param {string} failingAction - The failing action/method name (e.g., "checkExpectedBalanceIsDisplayed('24')")
 * @returns {number|null} Line number or null if not found
 */
function extractLineNumberFromTestFile(testFilePath, testTitle, failingAction) {
  if (!testFilePath || !testTitle || !failingAction) {
    return null;
  }

  try {
    // Resolve absolute path if needed
    const absolutePath = path.isAbsolute(testFilePath)
      ? testFilePath
      : path.join(process.cwd(), testFilePath);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const lines = fileContent.split('\n');

    // Extract method name from failing action
    // e.g., "checkExpectedBalanceIsDisplayed('24')" -> "checkExpectedBalanceIsDisplayed"
    const methodMatch = failingAction.match(/^(\w+)/u);
    if (!methodMatch) {
      return null;
    }

    const methodName = methodMatch[1];

    // Extract method arguments if available
    const argsMatch = failingAction.match(/\(['"]([^'"]+)['"]\)/u);
    const methodArg = argsMatch ? argsMatch[1] : null;

    // Find the test case boundaries by searching for the it() block
    // Escape special regex characters in test title
    // eslint-disable-next-line require-unicode-regexp
    const escapedTitle = testTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let testStartLine = null;
    let testEndLine = null;
    let braceDepth = 0;
    let inTestBlock = false;

    // Find the it() block that matches the test title
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for it() block with matching title
      if (
        inTestBlock === false &&
        line.match(new RegExp(`it\\s*\\(['"]${escapedTitle}['"]`, 'u'))
      ) {
        testStartLine = i;
        inTestBlock = true;
        // Count opening braces to find the end of the test block
        // eslint-disable-next-line require-unicode-regexp
        const openCount = (line.match(/\{/g) || []).length;
        // eslint-disable-next-line require-unicode-regexp
        const closeCount = (line.match(/\}/g) || []).length;
        braceDepth = openCount - closeCount;
        continue;
      }

      if (inTestBlock) {
        // Track brace depth to find when test block ends
        // eslint-disable-next-line require-unicode-regexp
        const openBraces = (line.match(/\{/g) || []).length;
        // eslint-disable-next-line require-unicode-regexp
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;

        // When brace depth returns to 0, we've found the end of the test block
        if (braceDepth <= 0 && line.includes('});')) {
          testEndLine = i;
          break;
        }
      }
    }

    // If we couldn't find test boundaries, fall back to searching entire file
    const searchStart = testStartLine === null ? 0 : testStartLine;
    const searchEnd = testEndLine === null ? lines.length : testEndLine;

    // Search for the method call within the test boundaries
    const candidates = [];
    for (let i = searchStart; i < searchEnd; i++) {
      const line = lines[i];

      // Check if line contains the method name
      if (
        line.includes(methodName) &&
        (line.includes('await') || line.includes(`.${methodName}`))
      ) {
        // If we have method arguments, prefer lines that contain those arguments
        if (methodArg && line.includes(methodArg)) {
          candidates.unshift({ line: i + 1, priority: 1 }); // Higher priority
        } else {
          candidates.push({ line: i + 1, priority: 2 }); // Lower priority
        }
      }
    }

    // Return the highest priority match (first in list if args matched, otherwise first match)
    if (candidates.length > 0) {
      // Sort by priority (lower number = higher priority)
      candidates.sort((a, b) => a.priority - b.priority);
      return candidates[0].line;
    }
  } catch (error) {
    // Silently fail - file might not exist or be unreadable
    return null;
  }

  return null;
}

/**
 * Format values for display (truncate long strings, format objects)
 *
 * @param {*} value - Value to format
 * @returns {string} Formatted string representation
 */
function formatValue(value) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  const str =
    typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

  // Truncate very long values
  if (str.length > 200) {
    return `${str.substring(0, 200)}... (truncated)`;
  }

  return str;
}

module.exports = EnhancedSpecReporter;
