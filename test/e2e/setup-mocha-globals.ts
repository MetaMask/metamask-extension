// This file exists to provide globally available helpers for all E2E specs to avoid importing them in each spec

import { withFixtures } from './helpers';
import FixtureBuilder from './fixture-builder';

// We use 'var' to declare writable globals because this setup assigns to global at runtime (`global.* = …`).
// Using 'const' would create a readonly binding and conflict with those assignments.
declare global {
  // eslint-disable-next-line no-var
  var withFixtures: typeof import('./helpers').withFixtures;
  // eslint-disable-next-line no-var
  var FixtureBuilder: typeof import('./fixture-builder');
}

global.withFixtures = withFixtures;
global.FixtureBuilder = FixtureBuilder;

export {};
