import { mockJsonRpcResult } from '../mocks/json-rpc-result';

type RequestConfig = [method: string, methodVariant: string];

const DEFAULT_VARIANT = 'default';

/**
 * Helper function to assist with mocking JSON-RPC post requests
 *
 * @param mockServer
 * @param listOfRequestConfigs
 * @example
 * ```
 *  await mockServerJsonRpc(mockServer, [
 *    ['eth_getBlockByNumber']
 *    ['eth_call', 'balanceChecker']
 *  ]);
 * ```
 */
async function mockServerJsonRpc(
  mockServer: any, // MockttpServer
  listOfRequestConfigs: RequestConfig[],
) {
  for (const [method, variant] of listOfRequestConfigs) {
    await mockServer
      .forPost()
      .withJsonBodyIncluding({ method })
      .thenCallback((req: any) => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: req.body.json.id,
            result: mockJsonRpcResult[method][variant || DEFAULT_VARIANT],
          },
        };
      });
  }
}

module.exports = { mockServerJsonRpc };
