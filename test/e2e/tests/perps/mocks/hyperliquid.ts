import { MockedEndpoint, Mockttp } from 'mockttp';

export const HYPERLIQUID_API_URL_REGEX =
  /^https:\/\/(api(?:-testnet)?\.hyperliquid|api\.hyperliquid-testnet)\.xyz\/.*$/u;

export const PERPS_ORDERS_API_URL =
  'https://perps.api.cx.metamask.io/api/v1/orders';

/**
 * Adds baseline Hyperliquid/Perps API mocks for E2E tests.
 * These responses are intentionally minimal and designed as safe defaults.
 *
 * @param mockServer - The mock server instance
 * @returns The list of registered mocked endpoints
 */
export async function mockPerpsHyperliquidApis(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const mockedEndpoints: MockedEndpoint[] = [];

  mockedEndpoints.push(
    await mockServer
      .forPost(HYPERLIQUID_API_URL_REGEX)
      .thenCallback(async (request) => {
        const requestBody = (await request.body.getText()) ?? '';

        if (requestBody.includes('"type":"allMids"')) {
          return {
            statusCode: 200,
            json: {
              BTC: '68000.0',
              ETH: '3200.0',
              SOL: '150.0',
            },
          };
        }

        if (requestBody.includes('"type":"metaAndAssetCtxs"')) {
          return {
            statusCode: 200,
            json: [
              {
                universe: [
                  {
                    name: 'ETH',
                    maxLeverage: 50,
                    onlyIsolated: false,
                    szDecimals: 4,
                  },
                ],
              },
              [
                {
                  coin: 'ETH',
                  dayNtlVlm: '2500000',
                  funding: '0.000100',
                  markPx: '3200.00',
                  midPx: '3199.80',
                  openInterest: '1200000',
                  oraclePx: '3198.50',
                  prevDayPx: '3150.00',
                  premium: '0.000300',
                },
              ],
            ],
          };
        }

        if (requestBody.includes('"type":"meta"')) {
          return {
            statusCode: 200,
            json: {
              universe: [
                {
                  name: 'ETH',
                  maxLeverage: 50,
                  onlyIsolated: false,
                  szDecimals: 4,
                },
              ],
            },
          };
        }

        if (requestBody.includes('"type":"clearinghouseState"')) {
          return {
            statusCode: 200,
            json: {
              assetPositions: [],
              crossMarginSummary: {
                accountValue: '0',
                totalMarginUsed: '0',
                totalNtlPos: '0',
              },
              withdrawable: '0',
            },
          };
        }

        return {
          statusCode: 200,
          json: {},
        };
      }),
  );

  mockedEndpoints.push(
    await mockServer.forGet(HYPERLIQUID_API_URL_REGEX).thenCallback(() => {
      return {
        statusCode: 200,
        json: {},
      };
    }),
  );

  mockedEndpoints.push(
    await mockServer.forPost(PERPS_ORDERS_API_URL).thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ok: true,
        },
      };
    }),
  );

  return mockedEndpoints;
}
