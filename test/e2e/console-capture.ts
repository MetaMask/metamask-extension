/**
 * E2E console warnings/errors capture system
 *
 * This module captures browser console warnings and errors during e2e test execution
 * and integrates with the snapshot system for validation.
 */

import {
  normalizeMessage,
  loadSnapshot,
  compareWithSnapshot,
  formatComparisonResults,
} from '../helpers/console-snapshot';

// E2E tests use 'e2e' snapshot type
if (!process.env.WARNINGS_SNAPSHOT_TYPE) {
  process.env.WARNINGS_SNAPSHOT_TYPE = 'e2e';
}

// Store captured console messages from browser
type CapturedEntry = {
  message: string;
  normalized: string;
  stackTrace: string;
  timestamp: number;
};

type CapturedMessages = {
  warnings: CapturedEntry[];
  errors: CapturedEntry[];
};

const captured: CapturedMessages = {
  warnings: [],
  errors: [],
};

/**
 * Capture a browser console warning
 *
 * @param message - The warning message
 * @param stackTrace - Optional stack trace
 */
export function captureWarning(message: string, stackTrace: string = ''): void {
  if (!message) {
    return;
  }

  // Normalize FIRST to handle paths before truncation
  const messageStr = String(message);
  const normalizedMessage = normalizeMessage(messageStr);

  // THEN enforce maximum message length (2KB per message)
  const trimmedMessage =
    normalizedMessage.length > 2000
      ? `${normalizedMessage.substring(0, 2000)}... [truncated]`
      : normalizedMessage;

  // Normalize and limit stack trace
  const normalizedStack = stackTrace ? normalizeMessage(stackTrace) : '';
  const trimmedStackTrace =
    normalizedStack.length > 1000
      ? `${normalizedStack.substring(0, 1000)}... [truncated]`
      : normalizedStack;

  captured.warnings.push({
    message: trimmedMessage,
    normalized: trimmedMessage, // Already normalized
    stackTrace: trimmedStackTrace,
    timestamp: Date.now(),
  });
}

/**
 * Capture a browser console error
 *
 * @param message - The error message
 * @param stackTrace - Optional stack trace
 */
export function captureError(message: string, stackTrace: string = ''): void {
  if (!message) {
    return;
  }

  // Normalize FIRST to handle paths before truncation
  const messageStr = String(message);
  const normalizedMessage = normalizeMessage(messageStr);

  // THEN enforce maximum message length (2KB per message)
  const trimmedMessage =
    normalizedMessage.length > 2000
      ? `${normalizedMessage.substring(0, 2000)}... [truncated]`
      : normalizedMessage;

  // Normalize and limit stack trace
  const normalizedStack = stackTrace ? normalizeMessage(stackTrace) : '';
  const trimmedStackTrace =
    normalizedStack.length > 1000
      ? `${normalizedStack.substring(0, 1000)}... [truncated]`
      : normalizedStack;

  captured.errors.push({
    message: trimmedMessage,
    normalized: trimmedMessage, // Already normalized
    stackTrace: trimmedStackTrace,
    timestamp: Date.now(),
  });
}

/**
 * Get current captured messages
 *
 * @returns Object with warnings and errors arrays
 */
export function getCaptured(): CapturedMessages {
  return captured;
}

/**
 * Clear captured messages
 */
export function clearCaptured(): void {
  captured.warnings = [];
  captured.errors = [];
}

/**
 * Save captured data to temp file (for aggregation later)
 * Used during snapshot generation to accumulate data from all tests
 *
 * @param testName - Optional test name to create unique file per test
 */
export function saveCapturedToTemp(testName?: string): void {
  if (process.env.GENERATE_WARNINGS_SNAPSHOT === 'true') {
    // Convert to CapturedData format expected by saveTestSnapshot
    const capturedData = {
      warnings: captured.warnings.map((e) => ({
        message: e.message,
        stackTrace: e.stackTrace,
      })),
      errors: captured.errors.map((e) => ({
        message: e.message,
        stackTrace: e.stackTrace,
      })),
    };

    // Save to test-specific file (testName extracted from call stack)
    // Only save if there's actual data - don't overwrite with empty data
    if (
      testName &&
      (capturedData.warnings.length > 0 || capturedData.errors.length > 0)
    ) {
      saveTestSnapshot(capturedData, testName);
    }
  }
}

/**
 * Save captured data to a test-specific temp file
 * This allows incremental snapshot generation - re-run only failed tests
 *
 * @param data - The captured warnings/errors
 * @param data.warnings - Array of captured warnings
 * @param data.errors - Array of captured errors
 * @param testIdentifier - The test identifier (file path or test name)
 */
function saveTestSnapshot(
  data: { warnings: unknown[]; errors: unknown[] },
  testIdentifier: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const path = require('path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { getTempDir } = require('../helpers/console-snapshot');

  const tempDir = getTempDir();
  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'e2e';

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // If testIdentifier looks like a file path, extract just the filename
  let identifier = testIdentifier;
  if (testIdentifier.includes('/') || testIdentifier.includes('\\')) {
    // It's a file path - extract basename without extension
    const basename = path.basename(testIdentifier);
    identifier = basename.replace(/\.(spec|test)\.(ts|js)$/iu, '');
  }

  // Create sanitized filename from identifier
  const sanitizedName = identifier
    .replace(/[^a-z0-9]+/giu, '-') // Replace non-alphanumeric with dash
    .replace(/^-|-$/gu, '') // Remove leading/trailing dashes
    .substring(0, 100); // Limit length

  const tempFile = path.join(
    tempDir,
    `warnings-${snapshotType}-test-${sanitizedName}.json`,
  );

  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Validate captured messages against snapshot
 *
 * @param testName - Optional test name for incremental snapshot generation
 * @returns Promise that resolves when validation is complete
 * @throws Error if new warnings/errors detected
 */
export async function validateSnapshot(testName?: string): Promise<void> {
  // Check if we're in snapshot generation mode
  if (process.env.GENERATE_WARNINGS_SNAPSHOT === 'true') {
    // In generation mode, save to temp file instead of final snapshot
    // The final snapshot will be saved only if all tests pass
    saveCapturedToTemp(testName);
    return;
  }

  // Normal validation mode
  const snapshot = loadSnapshot();
  const comparison = compareWithSnapshot(captured, snapshot);

  const hasNewIssues =
    comparison.newWarnings.length > 0 || comparison.newErrors.length > 0;

  if (hasNewIssues) {
    const errorMessage = formatComparisonResults(comparison, testName);
    console.error(errorMessage);
    throw new Error('New console warnings or errors detected in e2e tests');
  }
}
