/**
 * Jest global teardown
 * Aggregates warnings/errors from all test files and validates the snapshot
 */
import {
  loadSnapshot,
  compareWithSnapshot,
  formatComparisonResults,
} from '../helpers/console-snapshot';
import type { CapturedData } from '../helpers/console-snapshot';

async function globalTeardown(): Promise<void> {
  try {
    // Note: Test data is saved in afterAll hooks in console-capture.ts
    // Global teardown runs after all tests complete and aggregates the temp files

    if (process.env.GENERATE_WARNINGS_SNAPSHOT === 'true') {
      // In snapshot generation mode, save to temp files only
      // The final snapshot will be saved by the generate script only if all tests pass
      // Don't call aggregateAndSaveSnapshot here - it will be called by the script
      // after verifying all tests passed
      console.log('\n📝 Snapshot generation mode: Data saved to temp files.');
      console.log('   Final snapshot will be saved only if all tests pass.');
    } else {
      // In validation mode, we need to aggregate all test files first
      // Then validate the aggregated result against the snapshot
      const aggregated = await aggregateTestSnapshots();
      const snapshot = loadSnapshot();
      const comparison = compareWithSnapshot(aggregated, snapshot);

      const hasNewIssues =
        comparison.newWarnings.length > 0 || comparison.newErrors.length > 0;

      if (hasNewIssues) {
        // Try to extract test file path from aggregated data
        const { testFilePath } = aggregated as { testFilePath?: string };
        const errorMessage = formatComparisonResults(comparison, testFilePath);
        console.error(errorMessage);
        throw new Error('New console warnings or errors detected');
      }
    }
  } catch (error) {
    console.error('Error in global teardown:', error);
    throw error;
  }
}

/**
 * Aggregate all test snapshot temp files into a single CapturedData object
 * This is used for validation mode
 */
async function aggregateTestSnapshots() {
  const path = await import('path');
  const fs = await import('fs');

  const snapshotType = process.env.WARNINGS_SNAPSHOT_TYPE || 'unit';
  // Temp directory for test-specific snapshot files
  const TEMP_DIR = path.join(
    process.cwd(),
    'test',
    `.warnings-snapshot-temp-${snapshotType}`,
  );

  if (!fs.existsSync(TEMP_DIR)) {
    return { warnings: [], errors: [] };
  }

  // Only read test-specific temp files (not worker-based)
  const tempFiles = fs
    .readdirSync(TEMP_DIR)
    .filter(
      (file) =>
        file.startsWith(`warnings-${snapshotType}-test-`) &&
        file.endsWith('.json'),
    )
    .map((file) => path.join(TEMP_DIR, file));

  const aggregated: CapturedData = {
    warnings: [],
    errors: [],
  };

  for (const tempFile of tempFiles) {
    try {
      const content = fs.readFileSync(tempFile, 'utf8');
      const testData = JSON.parse(content) as CapturedData & {
        testFilePath?: string;
      };
      aggregated.warnings.push(...testData.warnings);
      aggregated.errors.push(...testData.errors);

      // Preserve test file path for error messages (use the last one if multiple)
      if (testData.testFilePath) {
        (aggregated as { testFilePath?: string }).testFilePath =
          testData.testFilePath;
      }
    } catch (error) {
      console.warn(`Error reading test snapshot ${tempFile}:`, error);
    }
  }

  return aggregated;
}

export default globalTeardown;
