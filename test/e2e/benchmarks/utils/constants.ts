/**
 * Shared constants and mocks for benchmarks
 */

import { Mockttp } from 'mockttp';

export const DEFAULT_NUM_BROWSER_LOADS = 10;
export const DEFAULT_NUM_PAGE_LOADS = 10;

export const ALL_METRICS = {
  uiStartup: 'UI Startup',
  load: 'navigation[0].load',
  domContentLoaded: 'navigation[0].domContentLoaded',
  domInteractive: 'navigation[0].domInteractive',
  firstPaint: 'paint["first-paint"]',
  backgroundConnect: 'Background Connect',
  firstReactRender: 'First Render',
  getState: 'Get State',
  initialActions: 'Initial Actions',
  loadScripts: 'Load Scripts',
  setupStore: 'Setup Store',
  numNetworkReqs: 'numNetworkReqs',
} as const;

export const WITH_STATE_POWER_USER = {
  withAccounts: 30,
  withConfirmedTransactions: 40,
  withContacts: 40,
  withErc20Tokens: true,
  withNetworks: true,
  withNfts: 20,
  withPreferences: true,
  withUnreadNotifications: 15,
};

export function getCommonMocks(server: Mockttp) {
  return [
    server.forPost(/^https:\/\/sentry\.io\/api/u).thenCallback(() => ({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      json: { success: true },
    })),
    server.forPost(/^https:\/\/api\.segment\.io\/v1\//u).thenCallback(() => ({
      statusCode: 200,
    })),
    server
      .forGet(
        /^https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions$/u,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: { subscriptions: [], trialedProducts: [] },
      })),
    server
      .forGet(
        /^https:\/\/subscription\.dev-api\.cx\.metamask\.io\/v1\/subscriptions\/eligibility/u,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            canSubscribe: true,
            canViewEntryModal: true,
            minBalanceUSD: 1000,
            product: 'shield',
          },
        ],
      })),
  ];
}
