/**
 * Console warnings/errors snapshot system
 *
 * This module captures console warnings and errors during test execution
 * and compares them against a snapshot file to prevent new warnings/errors
 * from being introduced.
 */

import fs from 'fs';
import path from 'path';

// Snapshot file path can be configured via environment variable
/**
 * Get the snapshot file path for the current snapshot type
 * Snapshot type is determined by WARNINGS_SNAPSHOT_TYPE env variable
 *
 * @returns The full path to the snapshot file
 */
function getSnapshotFilePath(): string {
  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';
  const snapshotFileName = `test-warnings-snapshot-${snapshotType}.json`;
  return path.join(process.cwd(), 'test', snapshotFileName);
}

/**
 * Get the temp directory for the current snapshot type
 * Snapshot type is determined by WARNINGS_SNAPSHOT_TYPE env variable
 *
 * @returns The full path to the temp directory
 */
function getTempDir(): string {
  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';
  // Save temporary files in project directory for visibility
  // This directory is gitignored (via .tmp pattern)
  return path.join(
    process.cwd(),
    'test',
    `.warnings-snapshot-temp-${snapshotType}`,
  );
}

type CapturedEntry = {
  message: string;
  normalized?: string;
  stackTrace?: string;
  timestamp?: number;
};

export type CapturedData = {
  warnings: CapturedEntry[];
  errors: CapturedEntry[];
};

type SnapshotData = {
  _metadata?: {
    generatedAt: string;
    lastUpdatedAt?: string;
    description: string;
    note?: string;
  };
  errors: string[];
  warnings: string[];
};

type ComparisonResult = {
  newWarnings: string[];
  newErrors: string[];
  capturedSnapshot: SnapshotData;
};

/**
 * Normalize a console message for comparison
 * This helps avoid false positives from timestamps, random IDs, etc.
 *
 * @param message - The message to normalize
 * @returns The normalized message
 */
export function normalizeMessage(message: string): string {
  if (typeof message !== 'string') {
    return String(message);
  }

  // Use aggressive pattern-based replacements to normalize all variations
  const normalized = message
    // Replace timestamps (various formats) - do this early
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[\d.]*Z?/gu, '<TIMESTAMP>')
    .replace(/\d{13,}/gu, '<TIMESTAMP>') // Unix timestamps
    // Replace random IDs (hex strings, UUIDs, etc.)
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu,
      '<UUID>',
    )
    .replace(/0x[0-9a-f]{40,}/giu, '<ADDRESS>')
    .replace(/[0-9a-f]{64}/giu, '<HASH>')
    // Replace network client IDs (short hex strings in JSON keys)
    // Handle truncated values (ends with ...]  not just ")
    .replace(
      /"selectedNetworkClientId":"[0-9a-f]{6,}[^\]]*\.\.\.\]/giu,
      '"selectedNetworkClientId":"<CLIENT_ID>...]',
    )
    // Also handle complete (non-truncated) values
    .replace(
      /"selectedNetworkClientId":"[0-9a-f]{6,}"/giu,
      '"selectedNetworkClientId":"<CLIENT_ID>"',
    )
    // Replace Chrome extension IDs (32-character alphanumeric)
    .replace(
      /chrome-extension:\/\/[a-z]{32}\//giu,
      'chrome-extension://<EXTENSION_ID>/',
    )
    // Replace Solana addresses (base58, typically 32-44 characters)
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/gu, '<SOLANA_ADDRESS>')
    // Replace BIP122/Bitcoin chain IDs and account types
    .replace(/bip122:[0-9a-f]{32,64}/giu, 'bip122:<CHAIN_ID>') // Chain IDs (32-64 hex chars)
    // Replace CAIP chain IDs (namespace:chainId format)
    .replace(/eip155:\d+/gu, 'eip155:<CHAIN_ID>')
    // Collapse all translator warnings (repeated or not) into a single pattern
    .replace(
      /(?:Translator - Unable to find value of key "[^"]+" for locale "[^"]+"\s*)+/gu,
      'Translator - Unable to find value of key "<KEY>" for locale "<LOCALE>" [repeated]',
    )
    // Collapse repeated Solana balance/decimals errors
    .replace(
      /(?:Could not find (?:balances for account|balance for asset): [^\s]+(?:, [^\s]+)*\s*)+/gu,
      'Could not find balance/decimals for Solana account/asset [repeated]',
    )
    // Collapse repeated ObjectMultiplex orphaned data warnings
    .replace(
      /(?:ObjectMultiplex - orphaned data for stream "[^"]+"\s*)+/gu,
      'ObjectMultiplex - orphaned data for stream "<STREAM>" [repeated]',
    )
    // Replace webpack chunk filenames with hashes (common-abc123.js, bootstrap.xyz789.js, etc.)
    .replace(/\/[a-z-]+[.-][0-9a-f]{8,}\.js/giu, '/<CHUNK_FILE>')
    .replace(/[a-z-]+[.-][0-9a-f]{8,}\.js/giu, '<CHUNK_FILE>')
    // Collapse repeated token loading failures into a single pattern
    .replace(
      /(?:failed to load (?:decimals|balance) for token at <ADDRESS>\s*)+/gu,
      'failed to load decimals/balance for token at <ADDRESS> [repeated]',
    )
    // Replace file paths (normalize to relative paths)
    .replace(/[/\\][^/\\]+[/\\]node_modules[/\\][^/\\]+/gu, '<NODE_MODULE>')
    .replace(/[A-Z]:[/\\][^/\\]+/gu, '<ABSOLUTE_PATH>') // Windows paths
    // Replace Unix absolute paths - be very aggressive to catch all variations
    .replace(/\/Users\/[^\s:)]+/gu, '<USER_PATH>') // Any /Users/... path
    .replace(/\/home\/[^\s:)]+/gu, '<USER_PATH>') // Any /home/... path
    .replace(/\/[^\s:)]+\/metamask-extension\//gu, '<PROJECT_ROOT>/') // Project root
    .replace(
      /\/[^\s:)]+\/Repositories\/metamask-extension\//gu,
      '<PROJECT_ROOT>/',
    ) // Repositories variant
    // Replace any remaining long absolute paths
    .replace(/\/[\w.-]+\/[\w.-]+\/[\w.-]+\/[\w.-]+\//gu, '<ABSOLUTE_PATH>/')
    // Replace numbers aggressively - this collapses module graph warnings automatically
    .replace(/:\d+:\d+/gu, ':<LINE>:<COL>') // Line:column numbers first (before general numbers)
    .replace(/"value":\s*\d+/gu, '"value": <NUMBER>') // JSON value fields
    .replace(/"\d+":/gu, '"<NUMBER>":') // JSON numeric keys
    .replace(/"id":\s*\d+/gu, '"id": <NUMBER>') // JSON id fields
    .replace(/"startTime":\s*\d+/gu, '"startTime": <TIMESTAMP>') // JSON timestamps
    .replace(/"endTime":\s*\d+/gu, '"endTime": <TIMESTAMP>') // JSON timestamps
    .replace(/"time":\s*\d+/gu, '"time": <TIMESTAMP>') // Generic time fields
    .replace(/in \d+ms/gu, 'in <DURATION>ms') // Duration in milliseconds
    // Replace ALL numbers (not just large ones) to maximize normalization
    .replace(/\b\d+\b/gu, '<NUMBER>') // Any standalone number
    // After number normalization, catch chunk files like js-<NUMBER>.hash123.js
    .replace(/[a-z-]+-<NUMBER>\.[0-9a-f]{8,}\.js/giu, '<CHUNK_FILE>')
    .replace(/\/[a-z-]+-<NUMBER>\.[0-9a-f]{8,}\.js/giu, '/<CHUNK_FILE>')
    // Normalize whitespace
    .replace(/\s+/gu, ' ')
    .trim();

  return normalized;
}

/**
 * Create a key for a warning/error entry
 *
 * @param type - The type of entry ('warning' or 'error')
 * @param message - The message
 * @param stackTrace - Optional stack trace
 * @returns The entry key
 */
export function createEntryKey(
  type: string,
  message: string,
  stackTrace: string = '',
): string {
  const normalizedMessage = normalizeMessage(message);
  // Include first few lines of stack trace to differentiate similar messages
  const normalizedStackTrace = stackTrace
    .split('\n')
    .slice(0, 3)
    .map((line) => normalizeMessage(line))
    .join('\n');

  return `${type}:${normalizedMessage}:${normalizedStackTrace}`;
}

/**
 * Load the snapshot file
 *
 * @returns The snapshot object with warnings and errors arrays
 */
export function loadSnapshot(): SnapshotData {
  try {
    const snapshotFile = getSnapshotFilePath();
    if (fs.existsSync(snapshotFile)) {
      const content = fs.readFileSync(snapshotFile, 'utf8');
      return JSON.parse(content) as SnapshotData;
    }
  } catch (error) {
    // If file doesn't exist or is invalid, return empty snapshot
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Error loading snapshot file:', error);
    }
  }
  return { warnings: [], errors: [] };
}

/**
 * Save the snapshot file atomically
 * Uses a temporary file and atomic rename to avoid race conditions
 *
 * @param snapshot - The snapshot object to save
 */
export function saveSnapshot(snapshot: SnapshotData): void {
  try {
    const snapshotFile = getSnapshotFilePath();
    // Ensure directory exists
    const dir = path.dirname(snapshotFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to temp file first, then rename atomically
    const tempFile = `${snapshotFile}.tmp.${Date.now()}.${process.pid}`;
    fs.writeFileSync(
      tempFile,
      `${JSON.stringify(snapshot, null, 2)}\n`,
      'utf8',
    );
    fs.renameSync(tempFile, snapshotFile);
  } catch (error) {
    console.error('Error saving snapshot file:', error);
    throw error;
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
export function saveTestSnapshot(
  data: { warnings: unknown[]; errors: unknown[] },
  testIdentifier: string,
): void {
  const tempDir = getTempDir();
  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // If testIdentifier looks like a file path, extract just the filename
  let identifier = testIdentifier;
  if (testIdentifier.includes('/') || testIdentifier.includes('\\')) {
    // It's a file path - extract basename without extension
    const basename = path.basename(testIdentifier);
    identifier = basename.replace(/\.(spec|test)\.(ts|tsx|js|jsx)$/iu, '');
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
 * Aggregate all test snapshot temp files and save the final snapshot
 * Call this after all tests complete (from generate script or Jest global teardown)
 * Snapshot type is determined by WARNINGS_SNAPSHOT_TYPE env variable
 *
 * @param specificTestFile - Optional: if provided, only aggregate temp file for this test
 * @returns True if snapshot was modified, false if unchanged
 */
export function aggregateAndSaveSnapshot(specificTestFile?: string): boolean {
  try {
    const tempDir = getTempDir();
    const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';

    // Check if temp directory exists
    if (!fs.existsSync(tempDir)) {
      console.log('\n⚠️  No temp files found - nothing to aggregate.');
      console.log('   Snapshot unchanged.');
      console.log('\n   Run tests first to generate temp files:');
      console.log(`   yarn test:warnings:update:${snapshotType}`);
      return false;
    }

    // Read temp files - either all files or just the specific test's file
    let tempFiles: string[];

    if (specificTestFile) {
      // Only aggregate the temp file for the specific test
      const basename = path.basename(specificTestFile);
      const testName = basename.replace(
        /\.(spec|test)\.(ts|tsx|js|jsx)$/iu,
        '',
      );
      const sanitizedName = testName
        .replace(/[^a-z0-9]+/giu, '-')
        .replace(/^-|-$/gu, '');

      const specificTempFile = path.join(
        tempDir,
        `warnings-${snapshotType}-test-${sanitizedName}.json`,
      );

      if (fs.existsSync(specificTempFile)) {
        tempFiles = [specificTempFile];
      } else {
        console.log('\n⚠️  No temp file found for this test.');
        console.log(`   Expected: ${specificTempFile}`);
        return false;
      }
    } else {
      // Read all test-specific temp files for this snapshot type
      tempFiles = fs
        .readdirSync(tempDir)
        .filter(
          (file) =>
            file.startsWith(`warnings-${snapshotType}-test-`) &&
            file.endsWith('.json'),
        )
        .map((file) => path.join(tempDir, file));
    }

    // Safety check: If no temp files found, don't touch snapshot
    if (tempFiles.length === 0) {
      console.log('\n⚠️  No temp files found - nothing to aggregate.');
      console.log('   Snapshot unchanged.');
      console.log('\n   Run tests first to generate temp files:');
      console.log(`   yarn test:warnings:update:${snapshotType}`);
      return false;
    }

    // Log temp file count for transparency
    console.log(`\nFound ${tempFiles.length} temp file(s) to aggregate.`);

    // Aggregate all captured data
    const aggregated: CapturedData = {
      warnings: [],
      errors: [],
    };

    for (const tempFile of tempFiles) {
      try {
        const content = fs.readFileSync(tempFile, 'utf8');
        const testData = JSON.parse(content) as CapturedData;
        aggregated.warnings.push(...testData.warnings);
        aggregated.errors.push(...testData.errors);
        // Clean up temp file
        fs.unlinkSync(tempFile);
      } catch (error) {
        console.warn(`Error reading test snapshot ${tempFile}:`, error);
      }
    }

    // Check if there are any warnings/errors to add
    const hasContent =
      aggregated.warnings.length > 0 || aggregated.errors.length > 0;

    if (!hasContent) {
      // No warnings/errors captured - snapshot won't change
      console.log('\n✅ No warnings or errors captured from this test.');
      console.log('   Snapshot unchanged.');
      return false;
    }

    // Load existing snapshot to compare
    const existingSnapshot = loadSnapshot();
    const beforeCount =
      existingSnapshot.warnings.length + existingSnapshot.errors.length;

    // Generate final snapshot from aggregated data
    const snapshot = generateSnapshot(aggregated);
    saveSnapshot(snapshot);

    // Check if snapshot changed
    const afterCount = snapshot.warnings.length + snapshot.errors.length;
    const hasChanges = afterCount > beforeCount;

    // Clean up temp files after successful snapshot generation
    if (!specificTestFile) {
      console.log(
        `   Cleaned up ${tempFiles.length} temporary file(s) after successful snapshot generation.`,
      );
    }

    // Clean up temp directory if empty
    try {
      const remainingFiles = fs.readdirSync(tempDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch {
      // Ignore cleanup errors
    }

    return hasChanges;
  } catch (error) {
    console.error('Error aggregating snapshots:', error);
    throw error;
  }
}

/**
 * Generate snapshot from captured console messages
 * ADDITIVE MODE: Merges with existing snapshot, never removes entries
 *
 * @param captured - Object with warnings and errors arrays
 * @param silent - If true, don't log messages (for validation mode)
 * @returns The generated snapshot (merged with existing)
 */
export function generateSnapshot(
  captured: CapturedData,
  silent = false,
): SnapshotData {
  // Load existing snapshot to merge with
  const existingSnapshot = loadSnapshot();

  const snapshot: SnapshotData = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _metadata: {
      generatedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      description:
        'Snapshot of console warnings and errors captured during test execution',
      note: 'This snapshot is ADDITIVE - new warnings/errors are added but never automatically removed. To remove entries, manually edit this file or delete it and regenerate.',
    },
    errors: [...existingSnapshot.errors], // Start with existing
    warnings: [...existingSnapshot.warnings], // Start with existing
  };

  // Add new unique warnings (additive)
  const existingWarningSet = new Set(existingSnapshot.warnings);
  let newWarningsAdded = 0;

  for (const entry of captured.warnings) {
    // Note: entry.message is already normalized
    const key = entry.message;
    if (!existingWarningSet.has(key)) {
      existingWarningSet.add(key);
      snapshot.warnings.push(key);
      newWarningsAdded += 1;
    }
  }

  // Add new unique errors (additive)
  const existingErrorSet = new Set(existingSnapshot.errors);
  let newErrorsAdded = 0;

  for (const entry of captured.errors) {
    // Note: entry.message is already normalized
    const key = entry.message;
    if (!existingErrorSet.has(key)) {
      existingErrorSet.add(key);
      snapshot.errors.push(key);
      newErrorsAdded += 1;
    }
  }

  // Sort warnings and errors alphabetically for consistent ordering
  snapshot.warnings.sort();
  snapshot.errors.sort();

  // Log what was added (only if not in silent mode)
  if (!silent) {
    if (newWarningsAdded > 0 || newErrorsAdded > 0) {
      console.log(
        `\n📊 Found ${newWarningsAdded} new warning(s) and ${newErrorsAdded} new error(s).`,
      );
      console.log(
        `   Total: ${snapshot.warnings.length} warnings, ${snapshot.errors.length} errors`,
      );
    } else {
      console.log(`\n✅ No new warnings or errors found.`);
      console.log(
        `   Snapshot unchanged: ${snapshot.warnings.length} warnings, ${snapshot.errors.length} errors`,
      );
    }
  }

  return snapshot;
}

/**
 * Compare captured messages against snapshot
 *
 * @param captured - Object with warnings and errors arrays
 * @param snapshot - The snapshot to compare against
 * @returns Comparison results with newWarnings and newErrors
 */
export function compareWithSnapshot(
  captured: CapturedData,
  snapshot: SnapshotData,
): ComparisonResult {
  const capturedSnapshot = generateSnapshot(captured, true); // silent mode for comparison
  const newWarnings: string[] = [];
  const newErrors: string[] = [];

  // Check for new warnings
  for (const warning of capturedSnapshot.warnings) {
    if (!snapshot.warnings.includes(warning)) {
      newWarnings.push(warning);
    }
  }

  // Check for new errors
  for (const error of capturedSnapshot.errors) {
    if (!snapshot.errors.includes(error)) {
      newErrors.push(error);
    }
  }

  return {
    newWarnings,
    newErrors,
    capturedSnapshot,
  };
}

/**
 * Format comparison results for error message
 *
 * @param results - Comparison results with newWarnings and newErrors
 * @param testFilePath - Optional test file path to show in command suggestion
 * @returns Formatted error message
 */
export function formatComparisonResults(
  results: ComparisonResult,
  testFilePath?: string,
): string {
  const lines: string[] = [];
  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';
  const snapshotFileName = `test/test-warnings-snapshot-${snapshotType}.json`;

  if (results.newWarnings.length > 0) {
    lines.push('\n❌ New console warnings detected:');
    lines.push('='.repeat(80));
    lines.push(`\nPlease fix the code or add to ${snapshotFileName}:\n`);
    results.newWarnings.forEach((warning, index) => {
      lines.push(
        `${index + 1}. Copy-paste the following warning into "warnings" array in ${snapshotFileName}:`,
      );
      // Escape quotes for JSON
      const escaped = warning.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');
      lines.push(`   "${escaped}"`);
      lines.push('');
    });
  }

  if (results.newErrors.length > 0) {
    lines.push('\n❌ New console errors detected:');
    lines.push('='.repeat(80));
    lines.push(`\nPlease fix the code or add to ${snapshotFileName}:\n`);
    results.newErrors.forEach((error, index) => {
      lines.push(
        `${index + 1}. Copy-paste the following error into "errors" array in ${snapshotFileName}:`,
      );
      // Escape quotes for JSON
      const escaped = error.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');
      lines.push(`   "${escaped}"`);
      lines.push('');
    });
  }

  if (lines.length > 0) {
    lines.push('='.repeat(80));
    lines.push(
      '\n📝 Or run this command to update the snapshot automatically (this is not guaranteed to work though, since all warnings/errors are not deterministic):',
    );
    if (testFilePath) {
      // Normalize path to be relative to project root
      let displayPath = testFilePath;
      // Remove CI absolute path prefix if present
      displayPath = displayPath.replace(/.*\/metamask-extension\//u, '');
      // Remove local absolute path prefix if present
      displayPath = displayPath.replace(
        /^\/.*\/Repositories\/metamask-extension\//u,
        '',
      );
      displayPath = displayPath.replace(
        /^\/Users\/.*\/metamask-extension\//u,
        '',
      );
      // Remove leading ./ if present for cleaner output
      displayPath = displayPath.replace(/^\.\//u, '');

      lines.push(
        `   yarn test:warnings:update:${snapshotType} ${displayPath}\n`,
      );
    } else {
      lines.push(`   yarn test:warnings:update:${snapshotType}\n`);
    }
  }

  return lines.join('\n');
}

export { getSnapshotFilePath, getTempDir };
