#!/usr/bin/env node
/**
 * CLI entry point for the quality-gate comparison script.
 * Uses .mts so Node treats it as ESM without requiring "type": "module".
 */
import { main } from './compare-benchmarks.ts';

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
