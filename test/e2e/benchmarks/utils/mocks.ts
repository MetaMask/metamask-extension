/**
 * Shared mock configurations for benchmarks
 */

import { Mockttp } from 'mockttp';

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
