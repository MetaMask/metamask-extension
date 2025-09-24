/**
 * This file establishes global test helpers for all e2e tests.
 * It makes commonly used functions like withFixtures and classes like FixtureBuilder
 * available globally, eliminating the need to import them in every test file.
 */

import { withFixtures as _withFixtures } from './helpers';
import _FixtureBuilder from './fixture-builder';

// Make withFixtures and FixtureBuilder available globally
declare global {
  const withFixtures: typeof _withFixtures;
  const FixtureBuilder: typeof _FixtureBuilder;
}

// Attach helpers to the global scope
(global as any).withFixtures = _withFixtures;
(global as any).FixtureBuilder = _FixtureBuilder;
