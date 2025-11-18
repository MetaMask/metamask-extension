/**
 * Jest console capture setup
 *
 * This module hooks into Jest's test lifecycle to capture console warnings
 * and errors, then compares them against a snapshot at the end of all tests.
 */

import {
  normalizeMessage,
  saveTestSnapshot,
} from '../helpers/console-snapshot';

type CapturedEntry = {
  message: string;
  normalized: string;
  stackTrace?: string;
  timestamp: number;
};

type CapturedData = {
  warnings: CapturedEntry[];
  errors: CapturedEntry[];
};

// Store captured console messages
const captured: CapturedData = {
  warnings: [],
  errors: [],
};

// Store original console methods
const originalConsole = {
  warn: console.warn,
  error: console.error,
};

/**
 * Convert an argument to a string for logging, with size limits.
 *
 * @param arg - The argument to convert
 * @param maxLength - Maximum length of the resulting string
 * @returns A string representation of the argument
 */
function argToString(arg: unknown, maxLength: number = 500): string {
  if (typeof arg === 'string') {
    return arg.length > maxLength ? `${arg.substring(0, maxLength)}...` : arg;
  }
  if (typeof arg === 'object' && arg !== null) {
    try {
      const str = JSON.stringify(arg);
      if (str.length > maxLength) {
        // For large objects, just return the constructor name or type
        const constructorName = (arg as { constructor?: { name?: string } })
          .constructor?.name;
        return `[${constructorName || 'Object'}: ${str.substring(0, 100)}...]`;
      }
      return str;
    } catch {
      return String(arg).substring(0, maxLength);
    }
  }
  const str = String(arg);
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

/**
 * Setup console capture hooks
 * This should be called early in the test setup process
 */
export function setupConsoleCapture(): void {
  // Clean up any stale temp file for this test before starting
  if (typeof beforeAll !== 'undefined') {
    beforeAll(() => {
      // Try to get the test file path
      const globalWithJasmine = global as {
        jasmine?: { testPath?: string };
      };
      const expectWithState = expect as {
        getState?: () => { testPath?: string };
      };
      const testPath =
        globalWithJasmine.jasmine?.testPath ||
        expectWithState.getState?.()?.testPath ||
        undefined;

      if (testPath) {
        // Delete stale test-specific temp file before starting
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const path = require('path');
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { getTempDir } = require('../helpers/console-snapshot');

        const tempDir = getTempDir();
        const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';
        const basename = path.basename(testPath);
        const testName = basename.replace(
          /\.(spec|test)\.(ts|tsx|js|jsx)$/iu,
          '',
        );
        const sanitizedName = testName
          .replace(/[^a-z0-9]+/giu, '-')
          .replace(/^-|-$/gu, '');

        const testTempFile = path.join(
          tempDir,
          `warnings-${snapshotType}-test-${sanitizedName}.json`,
        );

        if (fs.existsSync(testTempFile)) {
          fs.unlinkSync(testTempFile);
        }
      }
    });
  }

  // Only setup if not already done
  if (console.warn === originalConsole.warn) {
    // Capture console.warn
    console.warn = function (...args: unknown[]) {
      const message = args.map((arg) => argToString(arg)).join(' ');

      // Normalize FIRST to handle paths before truncation
      const normalizedMessage = normalizeMessage(message);

      // THEN enforce maximum message length (2KB per message)
      const trimmedMessage =
        normalizedMessage.length > 2000
          ? `${normalizedMessage.substring(0, 2000)}... [truncated]`
          : normalizedMessage;

      captured.warnings.push({
        message: trimmedMessage,
        normalized: trimmedMessage, // Already normalized
        timestamp: Date.now(),
      });

      // Call original console.warn so output still appears
      originalConsole.warn.apply(console, args as never[]);
    };

    // Capture console.error
    console.error = function (...args: unknown[]) {
      const message = args.map((arg) => argToString(arg)).join(' ');

      // Normalize FIRST to handle paths before truncation
      const normalizedMessage = normalizeMessage(message);

      // THEN enforce maximum message length (2KB per message)
      const trimmedMessage =
        normalizedMessage.length > 2000
          ? `${normalizedMessage.substring(0, 2000)}... [truncated]`
          : normalizedMessage;

      // Try to extract stack trace if it's an Error object
      let stackTrace = '';
      if (args[0] instanceof Error) {
        stackTrace = args[0].stack || '';
        // Normalize stack trace too
        const normalizedStack = normalizeMessage(stackTrace);
        // Then limit size
        if (normalizedStack.length > 1000) {
          stackTrace = `${normalizedStack.substring(0, 1000)}... [truncated]`;
        } else {
          stackTrace = normalizedStack;
        }
      }

      captured.errors.push({
        message: trimmedMessage,
        normalized: trimmedMessage, // Already normalized
        stackTrace,
        timestamp: Date.now(),
      });

      // Call original console.error so output still appears
      originalConsole.error.apply(console, args as never[]);
    };
  }

  // Register afterAll hook to handle snapshot saving
  if (typeof afterAll !== 'undefined') {
    afterAll(() => {
      // Save captured data to temp files (both generation and validation modes)
      // In generation mode: used by generate script to build final snapshot
      // In validation mode: used by global teardown to validate against snapshot
      if (captured.warnings.length > 0 || captured.errors.length > 0) {
        // Try to get the test file path from Jest's global context
        const globalWithJasmine = global as {
          jasmine?: { testPath?: string };
        };
        const expectWithState = expect as {
          getState?: () => { testPath?: string };
        };
        let testPath =
          globalWithJasmine.jasmine?.testPath ||
          expectWithState.getState?.()?.testPath ||
          undefined;

        // Try to extract from stack trace as fallback
        if (!testPath) {
          try {
            const { stack } = new Error();
            if (stack) {
              const matchResult = stack.match(
                /\((.*\.(test|spec)\.(ts|tsx|js|jsx)):/u,
              );
              if (matchResult) {
                testPath = matchResult[1];
              }
            }
          } catch {
            // Ignore
          }
        }

        // Convert to the format expected by saveTestSnapshot
        const capturedData = {
          warnings: captured.warnings.map((e) => ({
            message: e.message,
            stackTrace: e.stackTrace || '',
          })),
          errors: captured.errors.map((e) => ({
            message: e.message,
            stackTrace: e.stackTrace || '',
          })),
        };

        // Always use test-specific files (both generation and validation modes)
        if (testPath) {
          // Add testFilePath to the data for better error messages
          const dataWithPath = {
            ...capturedData,
            testFilePath: testPath,
          };
          saveTestSnapshot(dataWithPath, testPath);
        }
        // If no testPath, we can't save (shouldn't happen in practice)
        // Jest always provides test file path in modern versions
      }
    });
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole(): void {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

// Validation removed from per-file hook - now only happens in global-teardown.ts
// after ALL workers complete. This prevents false positives from incomplete
// worker aggregation during parallel test execution.

/**
 * Get current capture state (for updating snapshots)
 */
export function getCaptured(): CapturedData {
  return captured;
}

/**
 * Clear captured messages (useful for test isolation)
 */
export function clearCaptured(): void {
  captured.warnings = [];
  captured.errors = [];
}
