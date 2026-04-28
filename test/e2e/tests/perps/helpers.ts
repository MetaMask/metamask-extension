/**
 * Perps E2E test helpers
 *
 * This directory contains E2E test utilities and helpers for the Perps trading feature.
 *
 * WebSocket and HTTP mocks for Hyperliquid are configured in:
 * - mock-e2e.js: WebSocket forward (wss://api.hyperliquid.xyz/ws -> ws://localhost:8090)
 * - websocket/perps-mocks.ts: Message handlers for Hyperliquid subscription types
 * - mock-e2e.js: HTTP mocks for api.hyperliquid.xyz/info and /exchange
 *
 * When PerpsController makes real Hyperliquid calls from the background, these
 * mocks will intercept them. Perps E2E tests require PERPS_ENABLED=true in the test
 * build (set in .metamaskrc, see .metamaskrc.dist) and the real PerpsController in
 * the extension background.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension} for more info
 */

/**
 * withFixtures config for Perps geo-block tests (feature flag enabled, geo-blocked user).
 * Implemented in perps-fixture-config.ts; re-exported here for convenience.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export { getPerpsGeoBlockConfig } from './perps-fixture-config';

/**
 * withFixtures config for Perps tests with an eligible (non-geo-blocked) user.
 * Use for tests that exercise trading actions: Long/Short, Add Funds, Close All.
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export { getPerpsConfigEligible } from './perps-fixture-config';
