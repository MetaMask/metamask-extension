/**
 * CLI entry point for webpack source map validation.
 * Run via: yarn validate-source-maps:webpack
 */

import { runWebpackSourceMapValidator } from './sourcemap-validator';

void runWebpackSourceMapValidator().catch((error) => {
  console.error(error);
  process.exit(1);
});
