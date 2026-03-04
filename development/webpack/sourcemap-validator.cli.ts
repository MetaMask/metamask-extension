/**
 * CLI entry point for webpack source map validation.
 * Run via: yarn validate-source-maps:webpack
 */

import { parseArgs } from 'node:util';
import {
  runWebpackSourceMapValidator,
  type MapLocation,
} from './sourcemap-validator';

function parseMapLocation(): MapLocation {
  const { values } = parseArgs({
    options: {
      'map-location': {
        type: 'string',
      },
    },
  });

  const mapLocation = values['map-location'];
  if (mapLocation === undefined) {
    throw new Error(
      'Missing required --map-location option. Use --map-location=sibling or --map-location=sourcemaps.',
    );
  }
  if (mapLocation !== 'sibling' && mapLocation !== 'sourcemaps') {
    throw new Error(
      `Invalid value for --map-location: "${String(
        mapLocation,
      )}". Use "sibling" or "sourcemaps".`,
    );
  }
  return mapLocation;
}

void runWebpackSourceMapValidator({
  mapLocation: parseMapLocation(),
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
