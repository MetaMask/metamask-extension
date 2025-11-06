#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

/**
 * Aggregate warnings snapshot from temp files
 *
 * This script manually aggregates temp files into the final snapshot
 * without re-running tests. Useful when you've re-run only failed tests
 * and want to generate the final snapshot.
 *
 * Usage:
 * yarn test:warnings:aggregate:unit
 * yarn test:warnings:aggregate:integration
 * yarn test:warnings:aggregate:e2e
 */

async function main(): Promise<void> {
  const snapshotType = process.argv[2] || 'e2e';

  if (!['unit', 'integration', 'e2e'].includes(snapshotType)) {
    console.error(
      '❌ Invalid snapshot type. Must be: unit, integration, or e2e',
    );
    console.error(`   Received: ${snapshotType}`);
    process.exit(1);
  }

  console.log(`\n📦 Aggregating ${snapshotType} snapshot from temp files...\n`);

  // Set the snapshot type environment variable
  process.env.WARNINGS_SNAPSHOT_TYPE = snapshotType;

  try {
    const { aggregateAndSaveSnapshot } = await import(
      '../test/helpers/console-snapshot.js'
    );

    aggregateAndSaveSnapshot();

    console.log(`\n✅ ${snapshotType} snapshot aggregated successfully!`);
    console.log(`   Check test/test-warnings-snapshot-${snapshotType}.json`);
  } catch (error) {
    console.error('❌ Error aggregating snapshot:', error);
    process.exit(1);
  }
}

// Run if executed directly (via tsx)
main().catch((error: Error) => {
  console.error('Error aggregating snapshot:', error);
  process.exit(1);
});

export { main };
