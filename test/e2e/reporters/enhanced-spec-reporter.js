// test/e2e/reporters/enhanced-spec-reporter.js
const { inherits } = require('util');
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
  const allTests = [];

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
    const fileInfo = extractFilePathFromTest(test);

    const failureInfo = {
      title: test.title,
      fullTitle: test.fullTitle(),
      file: fileInfo?.path || null,
      error: {
        message: err?.message || 'Unknown error',
        stack: err?.stack || '',
        name: err?.name || 'Error',
        code: err?.code,
        actual: err?.actual,
        expected: err?.expected,
      },
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
  };

  const isCI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const useColors =
    !isCI ||
    process.env.FORCE_COLOR === '1' ||
    process.env.FORCE_COLOR === 'true';

  const colorize = (text, color) => {
    return useColors && colors[color]
      ? `${colors[color]}${text}${colors.reset}`
      : text;
  };

  console.log(`\n${'='.repeat(80)}`, false);
  console.log(colorize('📊 TEST SUMMARY', 'bold'));
  console.log('='.repeat(80), false);

  const total = stats.tests || 0;
  const passed = stats.passes || 0;
  const failed = stats.failures || 0;
  const pending = stats.pending || 0;
  const duration = stats.duration || 0;

  console.log(`\n${colorize('Total Tests:', 'bold')} ${total}`, false);
  console.log(`${colorize(`✅ Passed:`, 'green')} ${passed}`);
  console.log(`${colorize(`❌ Failed:`, 'red')} ${failed}`);
  if (pending > 0) {
    console.log(`${colorize(`⏸️  Pending:`, 'yellow')} ${pending}`);
  }
  console.log(
    `${colorize(`⏱️  Duration:`, 'blue')} ${(duration / 1000).toFixed(2)}s`,
  );

  if (allTests.length > 0) {
    console.log(`\n${'-'.repeat(80)}`, false);
    console.log(colorize('📋 TEST LIST', 'bold'));
    console.log('-'.repeat(80), false);

    const maxTitleLength = Math.max(
      ...allTests.map((test) => test.fullTitle.length),
      40,
    );

    allTests.forEach((test, index) => {
      const statusIcon = test.status === 'pass' ? '✅' : '❌';
      const statusColor = test.status === 'pass' ? 'green' : 'red';
      const statusText = test.status === 'pass' ? 'PASS' : 'FAIL';
      const durationText = `${(test.duration / 1000).toFixed(2)}s`;
      const testTitle = test.fullTitle.padEnd(maxTitleLength);
      const statusDisplay = colorize(statusText.padStart(6), statusColor);

      console.log(
        `${(index + 1).toString().padStart(3)}. ${statusIcon} ${testTitle} ${statusDisplay} ${durationText}`,
        false,
      );
    });
  }

  if (failures.length > 0) {
    console.log(`\n${'-'.repeat(80)}`, false);
    console.log(colorize('❌ FAILED TESTS DETAILS', 'red'));
    console.log('-'.repeat(80), false);

    failures.forEach((failure, index) => {
      console.log(`\n${colorize(`${index + 1}. ${failure.fullTitle}`, 'red')}`);

      if (failure.file) {
        console.log(
          `${colorize('   📄 Test File:', 'green')} ${colorize(failure.file, 'bold')}`,
        );
      } else {
        console.log(
          `${colorize('   ⚠️  Warning:', 'yellow')} Could not extract file path from test object`,
        );
      }

      console.log(
        `${colorize('   ⚠️  Error Type:', 'red')} ${failure.error.name}`,
      );
      console.log(
        `${colorize('   💬 Error Message:', 'red')} ${failure.error.message}`,
      );

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

  const slowTests = failures
    .filter((f) => f.duration > 30000)
    .sort((a, b) => b.duration - a.duration);

  if (slowTests.length > 0) {
    console.log(`\n${'-'.repeat(80)}`, false);
    console.log(colorize('🐌 SLOW TESTS (>30s)', 'yellow'));
    console.log('-'.repeat(80), false);
    slowTests.forEach((test) => {
      console.log(
        `   ${test.title} (${(test.duration / 1000).toFixed(2)}s)`,
        false,
      );
    });
  }

  console.log(`\n${'='.repeat(80)}\n`, false);
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

  let current = test;
  let filePath = test.file || test.fileName;

  while (!filePath && current && current.parent) {
    current = current.parent;
    filePath = current.file || current.fileName;
  }

  if (!filePath) {
    return null;
  }

  filePath = String(filePath);

  const relativePathMatch = filePath.match(
    /(test\/e2e\/(?:tests|page-objects)\/[^:]+\.(?:spec|test|ts|js))$/u,
  );

  if (relativePathMatch) {
    return {
      path: relativePathMatch[1],
    };
  }

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
