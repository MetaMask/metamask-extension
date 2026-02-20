import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

/**
 * Perps E2E test helpers
 *
 * This directory contains E2E test utilities and helpers for the Perps trading feature.
 *
 * WebSocket and HTTP mocks for Hyperliquid are configured in:
 * - mock-e2e.js: WebSocket forward (wss://api.hyperliquid.xyz/ws -> ws://localhost:8088)
 * - websocket-perps-mocks.ts: Message handlers for Hyperliquid subscription types
 * - mock-e2e.js: HTTP mocks for api.hyperliquid.xyz/info and /exchange
 *
 * When PerpsController makes real Hyperliquid calls from the background, these
 * mocks will intercept them. Currently the extension uses MockPerpsController.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension} for more info
 */

/** Hash to show the Perps tab on the account overview (home). Tab is controlled by search param. */
export const PERPS_TAB_HASH = '#/?tab=perps';
export const PERPS_HOME_ROUTE = '#/perps/home';

/**
 * Default withFixtures config for Perps tests (feature flag enabled).
 * Use as base and add title, testSpecificMock, etc. as needed.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2().build(),
    title,
    manifestFlags: {
      remoteFeatureFlags: {
        perpsEnabledVersion: {
          enabled: true,
          minimumVersion: '0.0.0',
        },
      },
    },
  };
}
