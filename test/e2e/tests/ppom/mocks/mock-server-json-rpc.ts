import { MockttpServer } from 'mockttp';
import { mockJsonRpcResult } from './json-rpc-result';

type RequestConfig = [
  method: string,
  options?: {
    /** optional arbitrary method variant name to return various result values */
    methodResultVariant?: string;
    /** optional params value for JSON request used in withJsonBodyIncluding() */
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: any;
    /** optional result value returned in JSON response */
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any;
    /** optional result value returned in JSON response */
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any;
  },
];

const DEFAULT_VARIANT = 'default';

/**
 * Helper function to assist with mocking JSON-RPC POST requests
 *
 * @param mockServer
 * @param listOfRequestConfigs
 * @example
 * ```
 *  await mockServerJsonRpc(mockServer, [
 *    ['eth_call', {
 *      params: ['0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b'],
 *      result: '0x0000000000000000000000000000000000000000000000000ddfe4d79cbd3de5',
 *    }],
 *    ['eth_call', {
 *      methodResultVariant: 'balanceChecker',
 *      params: [{to :'0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b'}],
 *    }],
 *    ['eth_gasPrice],
 *    ['eth_getBalance', {
 *      result: '0x27d17a5b79f77509541',
 *    }],
 *    ['eth_getBlockByNumber']
 *  ]);
 * ```
 */
export async function mockServerJsonRpc(
  mockServer: MockttpServer,
  listOfRequestConfigs: RequestConfig[],
) {
  for (const [method, options] of listOfRequestConfigs) {
    const {
      methodResultVariant,
      params,
      result: _result,
      error: _error,
    } = options || {};

    const result =
      _result ||
      _error ||
      mockJsonRpcResult[method][methodResultVariant || DEFAULT_VARIANT];

    await mockServer
      .forPost(/infura/u)
      .always()
      .withJsonBodyIncluding(params ? { method, params } : { method })
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .thenCallback(async (req: any) => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: (await req.body.getJson()).id,
            result,
          },
        };
      });
  }
}

module.exports = { mockServerJsonRpc };
