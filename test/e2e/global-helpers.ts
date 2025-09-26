/**
 * This file establishes global test helpers for all e2e tests.
 * It makes commonly used functions like withFixtures and classes like FixtureBuilder
 * available globally, eliminating the need to import them in every test file.
 */

import { withFixtures as withFixturesImpl } from './helpers';
import FixtureBuilderClass from './fixture-builder';

// Make withFixtures and FixtureBuilder available globally
declare global {
  const withFixtures: typeof withFixturesImpl;
  const FixtureBuilder: typeof FixtureBuilderClass;
}

// Create a properly typed global object
type GlobalWithHelpers = typeof globalThis & {
  withFixtures: typeof withFixturesImpl;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FixtureBuilder: typeof FixtureBuilderClass;
};

// Attach helpers to the global scope
(globalThis as GlobalWithHelpers).withFixtures = withFixturesImpl;
(globalThis as GlobalWithHelpers).FixtureBuilder = FixtureBuilderClass;
