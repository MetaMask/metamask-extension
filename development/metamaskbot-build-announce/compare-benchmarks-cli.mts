#!/usr/bin/env node
/**
 * CLI entry point for the quality-gate comparison script.
 * Uses .mts so Node treats it as ESM without requiring "type": "module".
 */
// eslint-disable-next-line import-x/extensions
import { main } from './compare-benchmarks.ts';

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
