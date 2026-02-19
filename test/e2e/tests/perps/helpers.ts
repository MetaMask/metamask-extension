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

export const PERPS_HOME_ROUTE = '#/perps/home';
