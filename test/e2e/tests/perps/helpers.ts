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

/** Base route for Perps market detail. Append encoded symbol, e.g. PERPS_MARKET_DETAIL_ROUTE + '/AVAX' */
export const PERPS_MARKET_DETAIL_ROUTE = '#/perps/market';

/** Perps Activity page (full history). */
export const PERPS_ACTIVITY_ROUTE = '#/perps/activity';

/** Perps Market List (search / explore). */
export const PERPS_MARKET_LIST_ROUTE = '#/perps/market-list';

/**
 * Default withFixtures config for Perps tests (feature flag enabled).
 * Implemented in fixtures/perps-fixture-config.ts; re-exported here for backward compatibility.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export { getPerpsConfig as getConfig } from '../../fixtures/perps-fixture-config';
