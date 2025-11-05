/**
 * Jest console capture setup
 *
 * This module hooks into Jest's test lifecycle to capture console warnings
 * and errors, then compares them against a snapshot at the end of all tests.
 */

import {
  loadSnapshot,
  compareWithSnapshot,
  formatComparisonResults,
  normalizeMessage,
  saveWorkerSnapshot,
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

  // Register afterAll hook to handle snapshot saving/validation
  if (typeof afterAll !== 'undefined') {
    afterAll(() => {
      if (process.env.GENERATE_WARNINGS_SNAPSHOT === 'true') {
        // In generation mode, save accumulated data after each test file
        // The last file's save will have all accumulated data from this worker
        if (captured.warnings.length > 0 || captured.errors.length > 0) {
          saveWorkerSnapshot(captured);
        }
      } else {
        // In validation mode, check against snapshot
        try {
          validateSnapshot();
        } finally {
          // Don't restore console here - let it stay for other cleanup
        }
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

/**
 * Validate captured messages against snapshot
 */
function validateSnapshot(): void {
  // Check if we're in snapshot generation mode
  if (process.env.GENERATE_WARNINGS_SNAPSHOT === 'true') {
    // Save to worker-specific temp file instead of final snapshot
    // This avoids race conditions when multiple Jest workers run in parallel
    // Note: We save after each test file, and the last save will have all accumulated data
    if (captured.warnings.length > 0 || captured.errors.length > 0) {
      saveWorkerSnapshot(captured);
    }
    // Note: Final aggregation will happen via the generate script
    return;
  }

  // Normal validation mode - aggregate from all workers first
  // In validation mode, we need to check against the snapshot after all workers finish
  // This will be handled in global teardown, but we can do per-worker validation too
  const snapshot = loadSnapshot();
  const comparison = compareWithSnapshot(captured, snapshot);

  const hasNewIssues =
    comparison.newWarnings.length > 0 || comparison.newErrors.length > 0;

  if (hasNewIssues) {
    const errorMessage = formatComparisonResults(comparison);
    restoreConsole(); // Restore so error message appears
    console.error(errorMessage);
    throw new Error('New console warnings or errors detected');
  }
}

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
