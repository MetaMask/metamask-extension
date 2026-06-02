/**
 * Speculos E2E test utilities — extension-specific glue only.
 *
 * Import transport, device interaction, resilience, and lifecycle symbols
 * directly from `@metamask/hw-emulator`.
 */

// ── Extension-specific modules ─────────────────────────────────────────
export {
  getSpeculosBuildConfig,
  getChromeFlags,
  validateSpeculosTestEnv,
  isSpeculosMockInBuild,
  getDeviceModelFromEnv,
  ensureDeviceEnv,
} from './build-config';
export type { SpeculosBuildConfig, DeviceModel } from './build-config';

export type {
  WithSpeculosFixturesOptions,
  SpeculosFixturesTestSuiteArgs,
} from './with-speculos-fixtures';
export { withSpeculosFixtures } from './with-speculos-fixtures';

export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';
export type { SharedSpeculosContext } from './shared-context';
