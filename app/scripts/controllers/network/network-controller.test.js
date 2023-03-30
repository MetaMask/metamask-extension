import { inspect, isDeepStrictEqual, promisify } from 'util';
import { isMatch } from 'lodash';
import { v4 } from 'uuid';
import nock from 'nock';
import sinon from 'sinon';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';
import { EVENT } from '../../../../shared/constants/metametrics';
import NetworkController from './network-controller';

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

// Store this up front so it doesn't get lost when it is stubbed
const originalSetTimeout = global.setTimeout;

/**
 * @typedef {import('nock').Scope} NockScope
 *
 * A object returned by the `nock` function which holds all of the request mocks
 * for a network.
 */

/**
 * @typedef {{request: MockJsonResponseBody, response: { httpStatus?: number } & MockJsonResponseBody, error?: unknown, delay?: number; times?: number, beforeCompleting: () => void | Promise<void>}} RpcMock
 *
 * Arguments to `mockRpcCall` which allow for specifying a canned response for a
 * particular RPC request.
 */

/**
 * @typedef {{id?: number; jsonrpc?: string, method: string, params?: unknown[]}} MockJsonRpcRequestBody
 *
 * A partial form of a prototypical JSON-RPC request body.
 */

/**
 * @typedef {{id?: number; jsonrpc?: string; result?: string; error?: string}} MockJsonResponseBody
 *
 * A partial form of a prototypical JSON-RPC response body.
 */

/**
 * A dummy block that matches the pre-EIP-1559 format (i.e. it doesn't have the
 * `baseFeePerGas` property).
 */
const PRE_1559_BLOCK = {
  number: '0x42',
};

/**
 * A dummy block that matches the pre-EIP-1559 format (i.e. it has the
 * `baseFeePerGas` property).
 */
const POST_1559_BLOCK = {
  ...PRE_1559_BLOCK,
  baseFeePerGas: '0x63c498a46',
};

/**
 * An alias for `POST_1559_BLOCK`, for tests that don't care about which kind of
 * block they're looking for.
 */
const BLOCK = POST_1559_BLOCK;

/**
 * A dummy value for the `projectId` option that `createInfuraClient` needs.
 * (Infura should not be hit during tests, but just in case, this should not
 * refer to a real project ID.)
 */
const DEFAULT_INFURA_PROJECT_ID = 'fake-infura-project-id';

/**
 * Despite the signature of its constructor, NetworkController must take an
 * Infura project ID. This object is mixed into the options first when a
 * NetworkController is instantiated in tests.
 */
const DEFAULT_CONTROLLER_OPTIONS = {
  infuraProjectId: DEFAULT_INFURA_PROJECT_ID,
  trackMetaMetricsEvent: jest.fn(),
};

/**
 * The set of properties allowed in a valid JSON-RPC response object.
 */
const JSONRPC_RESPONSE_BODY_PROPERTIES = ['id', 'jsonrpc', 'result', 'error'];

/**
 * The set of networks that, when specified, create an Infura provider as
 * opposed to a "standard" provider (one suited for a custom RPC endpoint).
 */
const INFURA_NETWORKS = [
  {
    networkType: 'mainnet',
    chainId: '0x1',
    networkId: '1',
    ticker: 'ETH',
  },
  {
    networkType: 'goerli',
    chainId: '0x5',
    networkId: '5',
    ticker: 'GoerliETH',
  },
  {
    networkType: 'sepolia',
    chainId: '0xaa36a7',
    networkId: '11155111',
    ticker: 'SepoliaETH',
  },
];

/**
 * A response object for a successful request to `eth_getBlockByNumber`. It is
 * assumed that the block number here is insignificant to the test.
 */
const SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE = {
  result: BLOCK,
  error: null,
};

/**
 * A response object for a request that has been geoblocked by Infura.
 */
const BLOCKED_INFURA_RESPONSE = {
  result: null,
  error: 'countryBlocked',
  httpStatus: 500,
};

/**
 * A response object for a successful request to `net_version`. It is assumed
 * that the network ID here is insignificant to the test.
 */
const SUCCESSFUL_NET_VERSION_RESPONSE = {
  result: '42',
  error: null,
};

/**
 * A response object for a unsuccessful request to any RPC method. It is assumed
 * that the error here is insignificant to the test.
 */
const UNSUCCESSFUL_JSON_RPC_RESPONSE = {
  result: null,
  error: 'oops',
  httpStatus: 500,
};

/**
 * Handles mocking provider requests for a particular network.
 */
class NetworkCommunications {
  #networkClientOptions;

  /**
   * Builds an object for mocking provider requests.
   *
   * @param {object} args - The arguments.
   * @param {"infura" | "custom"} args.networkClientType - Specifies the
   * expected middleware stack that will represent the provider: "infura" for an
   * Infura network; "custom" for a custom RPC endpoint.
   * @param {object} args.networkClientOptions - Details about the network
   * client used to determine the base URL or URL path to mock.
   * @param {string} [args.networkClientOptions.infuraNetwork] - The name of the
   * Infura network being tested, assuming that `networkClientType` is "infura".
   * @param {string} [args.networkClientOptions.infuraProjectId] - The project
   * ID of the Infura network being tested, assuming that `networkClientType` is
   * "infura".
   * @param {string} [args.networkClientOptions.customRpcUrl] - The URL of the
   * custom RPC endpoint, assuming that `networkClientType` is "custom".
   * @returns {NockScope} The nock scope.
   */
  constructor({
    networkClientType,
    networkClientOptions: {
      infuraNetwork,
      infuraProjectId = DEFAULT_INFURA_PROJECT_ID,
      customRpcUrl,
    } = {},
  }) {
    const networkClientOptions = {
      infuraNetwork,
      infuraProjectId,
      customRpcUrl,
    };
    this.networkClientType = networkClientType;
    if (networkClientType !== 'infura' && networkClientType !== 'custom') {
      throw new Error("networkClientType must be 'infura' or 'custom'");
    }
    this.#networkClientOptions = networkClientOptions;
    this.infuraProjectId = infuraProjectId;
    const rpcUrl =
      networkClientType === 'infura'
        ? `https://${infuraNetwork}.infura.io`
        : customRpcUrl;
    this.nockScope = nock(rpcUrl);
  }

  /**
   * Constructs a new NetworkCommunications object using a different set of
   * options, using the options from this instance as a base.
   *
   * @param args - The same arguments that NetworkCommunications takes.
   */
  with(args) {
    return new NetworkCommunications({
      networkClientType: this.networkClientType,
      networkClientOptions: this.#networkClientOptions,
      ...args,
    });
  }

  /**
   * Mocks the RPC calls that NetworkController makes internally.
   *
   * @param {object} args - The arguments.
   * @param {{number: string, baseFeePerGas?: string} | null} [args.latestBlock] - The
   * block object that will be used to mock `eth_blockNumber` and
   * `eth_getBlockByNumber`. If null, then both `eth_blockNumber` and
   * `eth_getBlockByNumber` will respond with null.
   * @param {RpcMock | Partial<RpcMock>[] | null} [args.eth_blockNumber] -
   * Options for mocking the `eth_blockNumber` RPC method (see `mockRpcCall` for
   * valid properties). By default, the number from the `latestBlock` will be
   * used as the result. Use `null` to prevent this method from being mocked.
   * @param {RpcMock | Partial<RpcMock>[] | null} [args.eth_getBlockByNumber] -
   * Options for mocking the `eth_getBlockByNumber` RPC method (see
   * `mockRpcCall` for valid properties). By default, the `latestBlock` will be
   * used as the result. Use `null` to prevent this method from being mocked.
   * @param {RpcMock | Partial<RpcMock>[] | null} [args.net_version] - Options
   * for mocking the `net_version` RPC method (see `mockRpcCall` for valid
   * properties). By default, "1" will be used as the result. Use `null` to
   * prevent this method from being mocked.
   */
  mockEssentialRpcCalls({
    latestBlock = BLOCK,
    eth_blockNumber: ethBlockNumberMocks = [],
    eth_getBlockByNumber: ethGetBlockByNumberMocks = [],
    net_version: netVersionMocks = [],
  } = {}) {
    const latestBlockNumber = latestBlock === null ? null : latestBlock.number;
    if (latestBlock && latestBlock.number === undefined) {
      throw new Error('The latest block must have a `number`.');
    }

    const defaultMocksByRpcMethod = {
      eth_getBlockByNumber: {
        request: {
          method: 'eth_getBlockByNumber',
          params: [latestBlockNumber, false],
        },
        response: {
          result: latestBlock,
        },
      },
      net_version: {
        request: {
          method: 'net_version',
          params: [],
        },
        response: {
          result: '1',
        },
      },
      // The request that the block tracker makes always occurs after any
      // request that the network controller makes (because such a request goes
      // through the block cache middleware and that is what spawns the block
      // tracker).
      eth_blockNumber: {
        request: {
          method: 'eth_blockNumber',
          params: [],
        },
        response: {
          result: latestBlockNumber,
        },
        // If there is no latest block number then the request that spawned the
        // block tracker won't be cached inside of the block tracker, so the
        // block tracker makes another request when it is asked for the latest
        // block.
        times: latestBlock === null ? 2 : 1,
      },
    };
    const providedMocksByRpcMethod = {
      eth_getBlockByNumber: ethGetBlockByNumberMocks,
      net_version: netVersionMocks,
      eth_blockNumber: ethBlockNumberMocks,
    };

    const allMocks = [];

    Object.keys(defaultMocksByRpcMethod).forEach((rpcMethod) => {
      const defaultMock = defaultMocksByRpcMethod[rpcMethod];
      const providedMockOrMocks = providedMocksByRpcMethod[rpcMethod];
      const providedMocks = Array.isArray(providedMockOrMocks)
        ? providedMockOrMocks
        : [providedMockOrMocks];
      if (providedMocks.length > 0) {
        providedMocks.forEach((providedMock) => {
          allMocks.push({ ...defaultMock, ...providedMock });
        });
      } else {
        allMocks.push(defaultMock);
      }
    });

    allMocks.forEach((mock) => {
      this.mockRpcCall(mock);
    });
  }

  /**
   * Mocks a JSON-RPC request sent to the provider with the given response.
   *
   * @param {RpcMock} args - The arguments.
   * @param {MockJsonRpcRequestBody} args.request - The request data. Must
   * include a `method`. Note that EthQuery's `sendAsync` method implicitly uses
   * an empty array for `params` if it is not provided in the original request,
   * so make sure to include this.
   * @param {MockJsonResponseBody & { httpStatus?: number }} [args.response] - Information
   * concerning the response that the request should have. Takes one of two
   * forms. The simplest form is an object that represents the response body;
   * the second form allows you to specify the HTTP status, as well as a
   * potentially async function to generate the response body.
   * @param {unknown} [args.error] - An error to throw while
   * making the request. Takes precedence over `response`.
   * @param {number} [args.delay] - The amount of time that should
   * pass before the request resolves with the response.
   * @param {number} [args.times] - The number of times that the
   * request is expected to be made.
   * @param {() => void | Promise<void>} [args.beforeCompleting] - Sometimes it is useful to do
   * something after the request is kicked off but before it ends (or, in terms
   * of a `fetch` promise, when the promise is initiated but before it is
   * resolved). You can pass an (async) function for this option to do this.
   * @returns {NockScope | null} The nock scope object that represents all of
   * the mocks for the network, or null if `times` is 0.
   */
  mockRpcCall({ request, response, error, delay, times, beforeCompleting }) {
    if (times === 0) {
      return null;
    }

    const url =
      this.networkClientType === 'infura' ? `/v3/${this.infuraProjectId}` : '/';

    const httpStatus = response?.httpStatus ?? 200;
    this.#validateMockResponseBody(response);
    const partialResponseBody = { jsonrpc: '2.0' };
    JSONRPC_RESPONSE_BODY_PROPERTIES.forEach((prop) => {
      if (response[prop] !== undefined) {
        partialResponseBody[prop] = response[prop];
      }
    });

    let nockInterceptor = this.nockScope.post(url, (actualBody) => {
      const expectedPartialBody = { jsonrpc: '2.0', ...request };
      return isMatch(actualBody, expectedPartialBody);
    });

    if (delay !== undefined) {
      nockInterceptor = nockInterceptor.delay(delay);
    }

    if (times !== undefined) {
      nockInterceptor = nockInterceptor.times(times);
    }

    if (error !== undefined) {
      return nockInterceptor.replyWithError(error);
    }
    if (response !== undefined) {
      return nockInterceptor.reply(async (_uri, requestBody) => {
        if (beforeCompleting !== undefined) {
          await beforeCompleting();
        }

        const completeResponseBody = {
          jsonrpc: '2.0',
          ...(requestBody.id === undefined ? {} : { id: requestBody.id }),
          ...partialResponseBody,
        };

        return [httpStatus, completeResponseBody];
      });
    }
    throw new Error(
      'Neither `response` nor `error` was given. Please specify one of them.',
    );
  }

  #validateMockResponseBody(mockResponseBody) {
    const invalidProperties = Object.keys(mockResponseBody).filter(
      (key) =>
        key !== 'httpStatus' && !JSONRPC_RESPONSE_BODY_PROPERTIES.includes(key),
    );
    if (invalidProperties.length > 0) {
      throw new Error(
        `Mock response object ${inspect(
          mockResponseBody,
        )} has invalid properties: ${inspect(invalidProperties)}.`,
      );
    }
  }
}

describe('NetworkController', () => {
  let clock;

  beforeEach(() => {
    // Disable all requests, even those to localhost
    nock.disableNetConnect();
    // Faking timers ends up doing two things:
    // 1. Halting the block tracker (which depends on `setTimeout` to
    // periodically request the latest block) set up in
    // `eth-json-rpc-middleware`
    // 2. Halting the retry logic in `@metamask/eth-json-rpc-infura` (which
    // also depends on `setTimeout`)
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    nock.enableNetConnect('localhost');
    clock.restore();
    nock.cleanAll();
  });

  describe('constructor', () => {
    const invalidInfuraIds = [undefined, null, {}, 1];
    invalidInfuraIds.forEach((invalidId) => {
      it(`throws if an invalid Infura ID of "${inspect(
        invalidId,
      )}" is provided`, () => {
        expect(() => new NetworkController({ infuraId: invalidId })).toThrow(
          'Invalid Infura project ID',
        );
      });
    });

    it('accepts initial state', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999',
              nickname: 'Test initial state',
            },
            networkDetails: {
              EIPS: {
                1559: false,
              },
            },
          },
        },
        ({ controller }) => {
          expect(controller.store.getState()).toMatchInlineSnapshot(`
            {
              "networkConfigurations": {},
              "networkDetails": {
                "EIPS": {
                  "1559": false,
                },
              },
              "networkId": null,
              "networkStatus": "unknown",
              "previousProviderStore": {
                "chainId": "0x9999",
                "nickname": "Test initial state",
                "rpcUrl": "http://example-custom-rpc.metamask.io",
                "type": "rpc",
              },
              "provider": {
                "chainId": "0x9999",
                "nickname": "Test initial state",
                "rpcUrl": "http://example-custom-rpc.metamask.io",
                "type": "rpc",
              },
            }
          `);
        },
      );
    });

    it('sets default state without initial state', async () => {
      await withController(({ controller }) => {
        expect(controller.store.getState()).toMatchInlineSnapshot(`
          {
            "networkConfigurations": {},
            "networkDetails": {
              "EIPS": {
                "1559": undefined,
              },
            },
            "networkId": null,
            "networkStatus": "unknown",
            "previousProviderStore": {
              "chainId": "0x539",
              "nickname": "Localhost 8545",
              "rpcUrl": "http://localhost:8545",
              "ticker": "ETH",
              "type": "rpc",
            },
            "provider": {
              "chainId": "0x539",
              "nickname": "Localhost 8545",
              "rpcUrl": "http://localhost:8545",
              "ticker": "ETH",
              "type": "rpc",
            },
          }
        `);
      });
    });
  });

  describe('destroy', () => {
    it('does not throw if called before the provider is initialized', async () => {
      const controller = new NetworkController(DEFAULT_CONTROLLER_OPTIONS);

      expect(await controller.destroy()).toBeUndefined();
    });

    it('stops the block tracker for the currently selected network as long as the provider has been initialized', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls({
          eth_blockNumber: {
            times: 2,
          },
        });
        await controller.initializeProvider();
        const { blockTracker } = controller.getProviderAndBlockTracker();
        // The block tracker starts running after a listener is attached
        blockTracker.addListener('latest', () => {
          // do nothing
        });
        expect(blockTracker.isRunning()).toBe(true);

        await controller.destroy();

        expect(blockTracker.isRunning()).toBe(false);
      });
    });
  });

  describe('initializeProvider', () => {
    it('throws if the provider configuration is invalid', async () => {
      const invalidProviderConfig = {};
      await withController(
        {
          state: {
            provider: invalidProviderConfig,
          },
        },
        async ({ controller }) => {
          await expect(async () => {
            await controller.initializeProvider();
          }).rejects.toThrow(
            'NetworkController - _configureProvider - unknown type "undefined"',
          );
        },
      );
    });

    for (const { networkType, chainId } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        it(`initializes a provider pointed to the "${networkType}" Infura network (chainId: ${chainId})`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              await controller.initializeProvider();

              const { provider } = controller.getProviderAndBlockTracker();
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result: chainIdResult } = await promisifiedSendAsync({
                method: 'eth_chainId',
              });
              expect(chainIdResult).toBe(chainId);
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              const infuraIsUnblocked = await waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              expect(infuraIsUnblocked).toBe(true);
            },
          );
        });

        it('determines the status of the network, storing it in state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();
              expect(controller.store.getState().networkStatus).toBe('unknown');

              await controller.initializeProvider();

              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );
            },
          );
        });

        it('determines whether the network supports EIP-1559, storing it in state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });

              await controller.initializeProvider();

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
                other: 'details',
              });
            },
          );
        });
      });
    }

    describe(`when the type in the provider configuration is "rpc"`, () => {
      it('initializes a provider pointed to the given RPC URL whose chain ID matches the configured chain ID', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();
            network.mockRpcCall({
              request: {
                method: 'test',
                params: [],
              },
              response: {
                result: 'test response',
              },
            });

            await controller.initializeProvider();

            const { provider } = controller.getProviderAndBlockTracker();
            const promisifiedSendAsync = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: testResult } = await promisifiedSendAsync({
              id: 99999,
              jsonrpc: '2.0',
              method: 'test',
              params: [],
            });
            expect(testResult).toBe('test response');
            const { result: chainIdResult } = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult).toBe('0xtest');
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            const infuraIsUnblocked = await waitForEvent({
              controller,
              eventName: 'infuraIsUnblocked',
              operation: async () => {
                await controller.initializeProvider();
              },
            });

            expect(infuraIsUnblocked).toBe(true);
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            const promiseForInfuraIsBlocked = waitForEvent({
              controller,
              eventName: 'infuraIsBlocked',
              operation: async () => {
                await controller.initializeProvider();
              },
            });

            await expect(promiseForInfuraIsBlocked).toNeverResolve();
          },
        );
      });

      it('determines the status of the network, storing it in state', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId1',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              net_version: {
                response: SUCCESSFUL_NET_VERSION_RESPONSE,
              },
            });
            expect(controller.store.getState().networkStatus).toBe('unknown');

            await controller.initializeProvider();

            expect(controller.store.getState().networkStatus).toBe('available');
          },
        );
      });

      it('determines whether the network supports EIP-1559, storing it in state', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
              networkDetails: {
                EIPS: {},
                other: 'details',
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });

            await controller.initializeProvider();

            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
              other: 'details',
            });
          },
        );
      });
    });
  });

  describe('getProviderAndBlockTracker', () => {
    it('returns objects that proxy to the provider and block tracker as long as the provider has been initialized', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls();
        await controller.initializeProvider();

        const { provider, blockTracker } =
          controller.getProviderAndBlockTracker();

        expect(provider).toHaveProperty('sendAsync');
        expect(blockTracker).toHaveProperty('checkForLatestBlock');
      });
    });

    it("returns null for both the provider and block tracker if the provider hasn't been initialized yet", async () => {
      await withController(async ({ controller }) => {
        const { provider, blockTracker } =
          controller.getProviderAndBlockTracker();

        expect(provider).toBeNull();
        expect(blockTracker).toBeNull();
      });
    });

    for (const { networkType, chainId } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is changed to "${networkType}"`, () => {
        it(`returns a provider object that was pointed to another network before the switch and is pointed to "${networkType}" afterward`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls();
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network2.mockEssentialRpcCalls();
              await controller.initializeProvider();
              const { provider } = controller.getProviderAndBlockTracker();

              const promisifiedSendAsync1 = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result: oldChainIdResult } = await promisifiedSendAsync1({
                method: 'eth_chainId',
              });
              expect(oldChainIdResult).toBe('0x1337');

              controller.setProviderType(networkType);
              const promisifiedSendAsync2 = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result: newChainIdResult } = await promisifiedSendAsync2({
                method: 'eth_chainId',
              });
              expect(newChainIdResult).toBe(chainId);
            },
          );
        });
      });
    }

    describe('when the type in the provider configuration is changed to "rpc"', () => {
      it('returns a provider object that was pointed to another network before the switch and is pointed to the new network', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'goerli',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: network1 }) => {
            network1.mockEssentialRpcCalls();
            const network2 = new NetworkCommunications({
              networkClientType: 'custom',
              networkClientOptions: {
                customRpcUrl: 'https://mock-rpc-url',
              },
            });
            network2.mockEssentialRpcCalls();
            await controller.initializeProvider();
            const { provider } = controller.getProviderAndBlockTracker();

            const promisifiedSendAsync1 = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: oldChainIdResult } = await promisifiedSendAsync1({
              method: 'eth_chainId',
            });
            expect(oldChainIdResult).toBe('0x5');

            controller.setActiveNetwork('testNetworkConfigurationId');
            const promisifiedSendAsync2 = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: newChainIdResult } = await promisifiedSendAsync2({
              method: 'eth_chainId',
            });
            expect(newChainIdResult).toBe('0x1337');
          },
        );
      });
    });
  });

  describe('getEIP1559Compatibility', () => {
    describe('when the latest block has a baseFeePerGas property', () => {
      it('stores the fact that the network supports EIP-1559', async () => {
        await withController(
          {
            state: {
              networkDetails: {
                EIPS: {},
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              true,
            );
          },
        );
      });

      it('returns true', async () => {
        await withController(async ({ controller, network }) => {
          network.mockEssentialRpcCalls({
            latestBlock: POST_1559_BLOCK,
          });
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBe(true);
        });
      });
    });

    describe('when the latest block does not have a baseFeePerGas property', () => {
      it('stores the fact that the network does not support EIP-1559', async () => {
        await withController(
          {
            state: {
              networkDetails: {
                EIPS: {},
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: PRE_1559_BLOCK,
            });
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              false,
            );
          },
        );
      });

      it('returns false', async () => {
        await withController(async ({ controller, network }) => {
          network.mockEssentialRpcCalls({
            latestBlock: PRE_1559_BLOCK,
          });
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBe(false);
        });
      });
    });

    describe('when the request for the latest block responds with null', () => {
      it('stores null as whether the network supports EIP-1559', async () => {
        await withController(
          {
            state: {
              networkDetails: {
                EIPS: {},
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: null,
            });
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              null,
            );
          },
        );
      });

      it('returns null', async () => {
        await withController(async ({ controller, network }) => {
          network.mockEssentialRpcCalls({
            latestBlock: null,
          });
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBe(null);
        });
      });
    });

    it('does not make multiple requests to eth_getBlockByNumber when called multiple times and the request to eth_getBlockByNumber succeeded the first time', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls({
          eth_getBlockByNumber: {
            times: 1,
          },
        });
        await withoutCallingGetEIP1559Compatibility({
          controller,
          operation: async () => {
            await controller.initializeProvider();
          },
        });

        await controller.getEIP1559Compatibility();
        await controller.getEIP1559Compatibility();

        expect(network.nockScope.isDone()).toBe(true);
      });
    });
  });

  describe('lookupNetwork', () => {
    describe('if the provider has not been initialized', () => {
      it('does not update state in any way', async () => {
        const providerConfig = {
          type: 'rpc',
          rpcUrl: 'http://example-custom-rpc.metamask.io',
          chainId: '0x9999',
          nickname: 'Test initial state',
        };
        const initialState = {
          provider: providerConfig,
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
        };

        await withController(
          {
            state: initialState,
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();
            const stateAfterConstruction = controller.store.getState();

            await controller.lookupNetwork();

            expect(controller.store.getState()).toStrictEqual(
              stateAfterConstruction,
            );
          },
        );
      });

      it('does not emit infuraIsUnblocked', async () => {
        await withController(async ({ controller, network }) => {
          network.mockEssentialRpcCalls();

          const promiseForInfuraIsUnblocked = waitForEvent({
            controller,
            eventName: 'infuraIsUnblocked',
            operation: async () => {
              await controller.lookupNetwork();
            },
          });

          await expect(promiseForInfuraIsUnblocked).toNeverResolve();
        });
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(async ({ controller, network }) => {
          network.mockEssentialRpcCalls();

          const promiseForInfuraIsBlocked = waitForEvent({
            controller,
            eventName: 'infuraIsBlocked',
            operation: async () => {
              await controller.lookupNetwork();
            },
          });

          await expect(promiseForInfuraIsBlocked).toNeverResolve();
        });
      });
    });

    describe('if the provider has initialized, but the current network has no chainId', () => {
      it('does not update state in any way', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'http://example-custom-rpc.metamask.io',
              },
              networkDetails: {
                EIPS: {
                  1559: true,
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();
            await controller.initializeProvider();
            const stateAfterInitialization = controller.store.getState();

            await controller.lookupNetwork();

            expect(controller.store.getState()).toStrictEqual(
              stateAfterInitialization,
            );
          },
        );
      });

      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'http://example-custom-rpc.metamask.io',
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();
            await controller.initializeProvider();

            const promiseForInfuraIsUnblocked = waitForEvent({
              controller,
              eventName: 'infuraIsUnblocked',
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            await expect(promiseForInfuraIsUnblocked).toNeverResolve();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'http://example-custom-rpc.metamask.io',
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();
            await controller.initializeProvider();

            const promiseForInfuraIsBlocked = waitForEvent({
              controller,
              eventName: 'infuraIsBlocked',
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            await expect(promiseForInfuraIsBlocked).toNeverResolve();
          },
        );
      });
    });

    INFURA_NETWORKS.forEach(({ networkType, networkId }) => {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        describe('if the request for eth_getBlockByNumber responds successfully', () => {
          it('stores the fact that the network is available', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  // This results in a successful call to eth_getBlockByNumber
                  // implicitly
                  latestBlock: BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'unknown',
                );

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(controller.store.getState().networkStatus).toBe(
                  'available',
                );
              },
            );
          });

          it('stores the ID of the network', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  // This results in a successful call to eth_getBlockByNumber
                  // implicitly
                  latestBlock: BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkId).toBeNull();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(controller.store.getState().networkId).toBe(networkId);
              },
            );
          });

          it('stores the fact that the network supports EIP-1559 when baseFeePerGas is in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  // This results in a successful call to eth_getBlockByNumber
                  // implicitly
                  latestBlock: POST_1559_BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(true);
              },
            );
          });

          it('stores the fact that the network does not support EIP-1559 when baseFeePerGas is not in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  // This results in a successful call to eth_getBlockByNumber
                  // implicitly
                  latestBlock: PRE_1559_BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(false);
              },
            );
          });

          it('emits infuraIsUnblocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    // This results in a successful call to eth_getBlockByNumber
                    // implicitly
                    latestBlock: POST_1559_BLOCK,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const infuraIsUnblocked = await waitForEvent({
                  controller,
                  eventName: 'infuraIsUnblocked',
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(infuraIsUnblocked).toBe(true);
              },
            );
          });
        });

        describe('if the request for eth_blockNumber responds with a "countryBlocked" error', () => {
          it('stores the fact that the network is blocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: BLOCKED_INFURA_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(controller.store.getState().networkStatus).toBe(
                  'blocked',
                );
              },
            );
          });

          it('clears the ID of the network from state', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  // Ensure that each call to eth_blockNumber returns a
                  // different block number, otherwise the first
                  // eth_getBlockByNumber response will get cached under the
                  // first block number
                  eth_blockNumber: [
                    {
                      response: {
                        result: '0x1',
                      },
                    },
                    {
                      response: {
                        result: '0x2',
                      },
                    },
                  ],
                  eth_getBlockByNumber: [
                    {
                      request: {
                        params: ['0x1', false],
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    },
                    {
                      request: {
                        params: ['0x2', false],
                      },
                      response: BLOCKED_INFURA_RESPONSE,
                    },
                  ],
                });
                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkId).toBe(networkId);

                // Force the block tracker to request a new block to clear the
                // block cache
                clock.runAll();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(controller.store.getState().networkId).toBeNull();
              },
            );
          });

          it('clears whether the network supports EIP-1559 from state', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkDetails: {
                    EIPS: {
                      1559: true,
                    },
                    other: 'details',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: BLOCKED_INFURA_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
                  EIPS: {
                    1559: undefined,
                  },
                });
              },
            );
          });

          it('emits infuraIsBlocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: BLOCKED_INFURA_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const infuraIsBlocked = await waitForEvent({
                  controller,
                  eventName: 'infuraIsBlocked',
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(infuraIsBlocked).toBe(true);
              },
            );
          });

          it('does not emit infuraIsUnblocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: BLOCKED_INFURA_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForInfuraIsUnblocked = waitForEvent({
                  controller,
                  eventName: 'infuraIsUnblocked',
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              },
            );
          });
        });

        describe('if the request for eth_getBlockByNumber responds with a generic error', () => {
          it('stores the network status as unavailable if the error does not translate to an internal RPC error', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  net_version: {
                    times: 2,
                  },
                  // Ensure that each call to eth_blockNumber returns a different
                  // block number, otherwise the first eth_getBlockByNumber
                  // response will get cached under the first block number
                  eth_blockNumber: [
                    {
                      response: {
                        result: '0x1',
                      },
                    },
                    {
                      response: {
                        result: '0x2',
                      },
                    },
                  ],
                  eth_getBlockByNumber: [
                    {
                      request: {
                        params: ['0x1', false],
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    },
                    {
                      request: {
                        params: ['0x2', false],
                      },
                      response: {
                        error: 'some error',
                        httpStatus: 405,
                      },
                    },
                  ],
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'available',
                );

                // Force the block tracker to request a new block to clear the
                // block cache
                clock.runAll();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'unavailable',
                );
              },
            );
          });

          it('stores the network status as unknown if the error translates to an internal RPC error', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  net_version: {
                    times: 2,
                  },
                  // Ensure that each call to eth_blockNumber returns a different
                  // block number, otherwise the first eth_getBlockByNumber
                  // response will get cached under the first block number
                  eth_blockNumber: [
                    {
                      response: {
                        result: '0x1',
                      },
                    },
                    {
                      response: {
                        result: '0x2',
                      },
                    },
                  ],
                  eth_getBlockByNumber: [
                    {
                      request: {
                        params: ['0x1', false],
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    },
                    {
                      request: {
                        params: ['0x2', false],
                      },
                      response: {
                        error: 'some error',
                        httpStatus: 500,
                      },
                    },
                  ],
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'available',
                );

                // Force the block tracker to request a new block to clear the
                // block cache
                clock.runAll();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'unknown',
                );
              },
            );
          });

          it('clears the ID of the network from state', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: [
                    {
                      request: {
                        params: ['0x1', false],
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    },
                    {
                      request: {
                        params: ['0x2', false],
                      },
                      response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                    },
                  ],
                  // Ensure that each call to eth_blockNumber returns a
                  // different block number, otherwise the first
                  // eth_getBlockByNumber response will get cached under the
                  // first block number
                  eth_blockNumber: [
                    {
                      response: {
                        result: '0x1',
                      },
                    },
                    {
                      response: {
                        result: '0x2',
                      },
                    },
                  ],
                });
                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkId).toBe(networkId);

                // Advance block tracker loop to force a fresh call to
                // eth_getBlockByNumber
                clock.runAll();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(controller.store.getState().networkId).toBeNull();
              },
            );
          });

          it('clears whether the network supports EIP-1559 from state', async () => {
            const intentionalErrorMessage =
              'intentional error from eth_getBlockByNumber';

            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkDetails: {
                    EIPS: {
                      1559: true,
                    },
                    other: 'details',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  operation: async () => {
                    try {
                      await controller.lookupNetwork();
                    } catch (error) {
                      if (error !== intentionalErrorMessage) {
                        console.error(error);
                      }
                    }
                  },
                });
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
                  EIPS: {
                    1559: undefined,
                  },
                });
              },
            );
          });

          it('does not emit infuraIsBlocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForInfuraIsBlocked = waitForEvent({
                  controller,
                  eventName: 'infuraIsBlocked',
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                await expect(promiseForInfuraIsBlocked).toNeverResolve();
              },
            );
          });

          it('does not emit infuraIsUnblocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForInfuraIsUnblocked = waitForEvent({
                  controller,
                  eventName: 'infuraIsUnblocked',
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              },
            );
          });
        });

        describe('if the network was switched after the eth_getBlockByNumber request started but before it completed', () => {
          it('stores the network status of the second network, not the first', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      type: 'rpc',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                    },
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  net_version: {
                    times: 2,
                  },
                  // Ensure that each call to eth_blockNumber returns a different
                  // block number, otherwise the first eth_getBlockByNumber
                  // response will get cached under the first block number
                  eth_blockNumber: [
                    {
                      response: {
                        result: '0x1',
                      },
                    },
                    {
                      response: {
                        result: '0x2',
                      },
                    },
                  ],
                  eth_getBlockByNumber: [
                    {
                      request: {
                        params: ['0x1', false],
                      },
                      response: {
                        result: {
                          ...BLOCK,
                          number: '0x1',
                        },
                      },
                    },
                    {
                      request: {
                        params: ['0x2', false],
                      },
                      response: {
                        result: {
                          ...BLOCK,
                          number: '0x2',
                        },
                      },
                      beforeCompleting: async () => {
                        await waitForStateChanges({
                          controller,
                          propertyPath: ['networkStatus'],
                          operation: () => {
                            controller.setActiveNetwork(
                              'testNetworkConfigurationId',
                            );
                          },
                        });
                      },
                    },
                  ],
                });
                const network2 = new NetworkCommunications({
                  networkClientType: 'custom',
                  networkClientOptions: {
                    customRpcUrl: 'https://mock-rpc-url',
                  },
                });
                network2.mockEssentialRpcCalls({
                  net_version: {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'available',
                );

                // Force the block tracker to request a new block to clear the
                // block cache
                clock.runAll();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'unknown',
                );
              },
            );
          });

          it('stores the ID of the second network, not the first', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      type: 'rpc',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                    },
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    beforeCompleting: async () => {
                      await waitForStateChanges({
                        controller,
                        propertyPath: ['networkStatus'],
                        operation: () => {
                          controller.setActiveNetwork(
                            'testNetworkConfigurationId',
                          );
                        },
                      });
                    },
                    net_version: {
                      response: {
                        result: '111',
                      },
                    },
                  },
                });
                const network2 = new NetworkCommunications({
                  networkClientType: 'custom',
                  networkClientOptions: {
                    customRpcUrl: 'https://mock-rpc-url',
                  },
                });
                network2.mockEssentialRpcCalls({
                  net_version: {
                    response: {
                      result: '222',
                    },
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkId'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(controller.store.getState().networkId).toBe('222');
              },
            );
          });

          it('stores the EIP-1559 support of the second network, not the first', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      type: 'rpc',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                    },
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                  eth_getBlockByNumber: {
                    beforeCompleting: async () => {
                      await waitForStateChanges({
                        controller,
                        propertyPath: ['networkStatus'],
                        operation: () => {
                          controller.setActiveNetwork(
                            'testNetworkConfigurationId',
                          );
                        },
                      });
                    },
                  },
                });
                const network2 = new NetworkCommunications({
                  networkClientType: 'custom',
                  networkClientOptions: {
                    customRpcUrl: 'https://mock-rpc-url',
                  },
                });
                network2.mockEssentialRpcCalls({
                  latestBlock: PRE_1559_BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
                  EIPS: {
                    1559: false,
                  },
                });
              },
            );
          });

          it('emits infuraIsBlocked, not infuraIsUnblocked, if the second network is blocked, even if the first one is not', async () => {
            const anotherNetwork = INFURA_NETWORKS.find(
              (network) => network.networkType !== networkType,
            );
            /* eslint-disable-next-line jest/no-if */
            if (!anotherNetwork) {
              throw new Error(
                "Could not find another network to use. You've probably commented out all INFURA_NETWORKS but one. Please uncomment another one.",
              );
            }

            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    beforeCompleting: async () => {
                      await waitForEvent({
                        controller,
                        eventName: 'networkDidChange',
                        operation: async () => {
                          await waitForStateChanges({
                            controller,
                            propertyPath: ['networkStatus'],
                            operation: () => {
                              controller.setProviderType(
                                anotherNetwork.networkType,
                              );
                            },
                          });
                        },
                      });
                    },
                  },
                });
                const network2 = network1.with({
                  networkClientType: 'infura',
                  networkClientOptions: {
                    infuraNetwork: anotherNetwork.networkType,
                  },
                });
                network2.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: BLOCKED_INFURA_RESPONSE,
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                const promiseForInfuraIsUnblocked = waitForEvent({
                  controller,
                  eventName: 'infuraIsUnblocked',
                });
                const promiseForInfuraIsBlocked = waitForEvent({
                  controller,
                  eventName: 'infuraIsBlocked',
                });

                await controller.lookupNetwork();

                await expect(promiseForInfuraIsUnblocked).toNeverResolve();
                expect(await promiseForInfuraIsBlocked).toBe(true);
              },
            );
          });
        });
      });
    });

    describe('when the type in the provider configuration is "rpc"', () => {
      describe('if both net_version and eth_getBlockByNumber respond successfully', () => {
        it('stores the fact the network is available', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
                eth_getBlockByNumber: {
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );
            },
          );
        });

        it('stores the ID of the network', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: POST_1559_BLOCK,
                net_version: {
                  response: {
                    result: '42',
                  },
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe(null);

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkId).toBe('42');
            },
          );
        });

        it('stores the fact that the network supports EIP-1559 when baseFeePerGas is in the block header', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: POST_1559_BLOCK,
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(
                controller.store.getState().networkDetails.EIPS[1559],
              ).toBe(true);
            },
          );
        });

        it('stores the fact that the network does not support EIP-1559 when baseFeePerGas is not in the block header', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: PRE_1559_BLOCK,
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(
                controller.store.getState().networkDetails.EIPS[1559],
              ).toBe(false);
            },
          );
        });

        it('emits infuraIsUnblocked', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: PRE_1559_BLOCK,
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(infuraIsUnblocked).toBe(true);
            },
          );
        });
      });

      describe('if the request for eth_getBlockByNumber responds successfully, but the request for net_version responds with a generic error', () => {
        it('stores the network status as available if the error does not translate to an internal RPC error', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                net_version: [
                  {
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    response: {
                      error: 'some error',
                      httpStatus: 405,
                    },
                  },
                ],
                eth_blockNumber: {
                  times: 2,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              // Force the block tracker to request a new block to clear the
              // block cache
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'unavailable',
              );
            },
          );
        });

        it('stores the network status as unknown if the error translates to an internal RPC error', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                net_version: [
                  {
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                ],
                eth_blockNumber: {
                  times: 2,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              // Force the block tracker to request a new block to clear the
              // block cache
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('clears the ID of the network from state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: BLOCK,
                net_version: [
                  {
                    response: {
                      result: '42',
                    },
                  },
                  {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                ],
                eth_blockNumber: {
                  times: 2,
                },
              });
              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('42');

              // Advance block tracker loop to force a fresh call to
              // eth_getBlockByNumber
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkId).toBeNull();
            },
          );
        });

        it('clears whether the network supports EIP-1559 from state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
                networkDetails: {
                  EIPS: {
                    1559: true,
                  },
                  other: 'details',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: BLOCK,
                net_version: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
                },
              });
            },
          );
        });

        it('does not emit infuraIsBlocked', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: BLOCK,
                net_version: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              await expect(promiseForInfuraIsBlocked).toNeverResolve();
            },
          );
        });

        it('emits infuraIsUnblocked', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                // This results in a successful call to eth_getBlockByNumber
                // implicitly
                latestBlock: BLOCK,
                net_version: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(infuraIsUnblocked).toBeTruthy();
            },
          );
        });
      });

      describe('if the request for net_version responds successfully, but the request for eth_getBlockByNumber responds with a generic error', () => {
        it('stores the fact that the network is unavailable', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                net_version: {
                  times: 2,
                },
                // Ensure that each call to eth_blockNumber returns a different
                // block number, otherwise the first eth_getBlockByNumber
                // response will get cached under the first block number
                eth_blockNumber: [
                  {
                    response: {
                      result: '0x1',
                    },
                  },
                  {
                    response: {
                      result: '0x2',
                    },
                  },
                ],
                eth_getBlockByNumber: [
                  {
                    request: {
                      params: ['0x1', false],
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                  {
                    request: {
                      params: ['0x2', false],
                    },
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                ],
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              // Force the block tracker to request a new block to clear the
              // block cache
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('clears the ID of the network from state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                latestBlock: BLOCK,
                net_version: {
                  response: {
                    result: '42',
                  },
                },
                eth_getBlockByNumber: [
                  {
                    response: {
                      result: BLOCK,
                    },
                  },
                  {
                    response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                  },
                ],
                eth_blockNumber: {
                  times: 2,
                },
              });
              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('42');

              // Advance block tracker loop to force a fresh call to
              // eth_getBlockByNumber
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkId).toBeNull();
            },
          );
        });

        it('clears whether the network supports EIP-1559 from state', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
                networkDetails: {
                  EIPS: {
                    1559: true,
                  },
                  other: 'details',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
                },
              });
            },
          );
        });

        it('does not emit infuraIsBlocked', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              await expect(promiseForInfuraIsBlocked).toNeverResolve();
            },
          );
        });

        it('emits infuraIsUnblocked', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(infuraIsUnblocked).toBeTruthy();
            },
          );
        });
      });

      describe('if the network was switched after the net_version request started but before it completed', () => {
        it('stores the network status of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                net_version: [
                  {
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await waitForStateChanges({
                        controller,
                        propertyPath: ['networkStatus'],
                        operation: () => {
                          controller.setProviderType('goerli');
                        },
                      });
                    },
                  },
                ],
                // Ensure that each call to eth_blockNumber returns a different
                // block number, otherwise the first eth_getBlockByNumber
                // response will get cached under the first block number
                eth_blockNumber: [
                  {
                    response: {
                      result: '0x1',
                    },
                  },
                  {
                    response: {
                      result: '0x2',
                    },
                  },
                ],
                eth_getBlockByNumber: [
                  {
                    request: {
                      params: ['0x1', false],
                    },
                    response: {
                      result: {
                        ...BLOCK,
                        number: '0x1',
                      },
                    },
                  },
                  {
                    request: {
                      params: ['0x2', false],
                    },
                    response: {
                      result: {
                        ...BLOCK,
                        number: '0x2',
                      },
                    },
                  },
                ],
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              // Force the block tracker to request a new block to clear the
              // block cache
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('stores the ID of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url-2',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                net_version: {
                  response: {
                    result: '111',
                  },
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkStatus'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls();

              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkId).toBe('5');
            },
          );
        });

        it('stores the EIP-1559 support of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkDetails'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                latestBlock: PRE_1559_BLOCK,
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // setProviderType clears networkDetails first, and then updates
                // it to what we expect it to be
                count: 2,
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: false,
                },
              });
            },
          );
        });

        it('emits infuraIsBlocked, not infuraIsUnblocked, if the second network is blocked, even if the first one is not', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                net_version: {
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkDetails'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: BLOCKED_INFURA_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              const promiseForInfuraIsUnblocked = waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
              });
              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
              });

              await controller.lookupNetwork();

              await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              expect(await promiseForInfuraIsBlocked).toBe(true);
            },
          );
        });
      });

      describe('if the network was switched after the eth_getBlockByNumber request started but before it completed', () => {
        it('stores the network status of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url-1',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
                networkDetails: {
                  EIPS: {},
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                net_version: {
                  times: 2,
                },
                // Ensure that each call to eth_blockNumber returns a different
                // block number, otherwise the first eth_getBlockByNumber
                // response will get cached under the first block number
                eth_blockNumber: [
                  {
                    response: {
                      result: '0x1',
                    },
                  },
                  {
                    response: {
                      result: '0x2',
                    },
                  },
                ],
                eth_getBlockByNumber: [
                  {
                    request: {
                      params: ['0x1', false],
                    },
                    response: {
                      result: {
                        ...BLOCK,
                        number: '0x1',
                      },
                    },
                  },
                  {
                    request: {
                      params: ['0x2', false],
                    },
                    response: {
                      result: {
                        ...BLOCK,
                        number: '0x2',
                      },
                    },
                    beforeCompleting: async () => {
                      await waitForStateChanges({
                        controller,
                        propertyPath: ['networkStatus'],
                        operation: () => {
                          controller.setProviderType('goerli');
                        },
                      });
                    },
                  },
                ],
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              // Force the block tracker to request a new block to clear the
              // block cache
              clock.runAll();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('stores the network ID of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url-2',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkStatus'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
                net_version: {
                  response: {
                    result: '111',
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls();

              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkId).toBe('5');
            },
          );
        });

        it('stores the EIP-1559 support of the second network, not the first', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
                eth_getBlockByNumber: {
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkDetails'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                latestBlock: PRE_1559_BLOCK,
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // setProviderType clears networkDetails first, and then updates
                // it to what we expect it to be
                count: 2,
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: false,
                },
              });
            },
          );
        });

        it('emits infuraIsBlocked, not infuraIsUnblocked, if the second network is blocked, even if the first one is not', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  beforeCompleting: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['networkDetails'],
                      operation: () => {
                        controller.setProviderType('goerli');
                      },
                    });
                  },
                },
              });
              const network2 = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: 'goerli',
                },
              });
              network2.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: BLOCKED_INFURA_RESPONSE,
                },
              });
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              const promiseForInfuraIsUnblocked = waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
              });
              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
              });

              await controller.lookupNetwork();

              await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              expect(await promiseForInfuraIsBlocked).toBe(true);
            },
          );
        });
      });
    });
  });

  describe('setActiveNetwork', () => {
    it('throws if the given networkConfigurationId does not match one in networkConfigurations', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller, network }) => {
          network.mockEssentialRpcCalls();

          expect(() =>
            controller.setActiveNetwork('invalid-network-configuration-id'),
          ).toThrow(
            new Error(
              'networkConfigurationId invalid-network-configuration-id does not match a configured networkConfiguration',
            ),
          );
        },
      );
    });

    it('stores the current provider configuration before overwriting it', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST',
              id: 'testNetworkConfigurationId1',
            },
            networkConfigurations: {
              testNetworkConfigurationId2: {
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                id: 'testNetworkConfigurationId2',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url-2',
            },
          });
          network.mockEssentialRpcCalls();

          controller.setActiveNetwork('testNetworkConfigurationId2');

          expect(
            controller.store.getState().previousProviderStore,
          ).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url-1',
            chainId: '0x111',
            ticker: 'TEST',
            id: 'testNetworkConfigurationId1',
          });
        },
      );
    });

    it('overwrites the provider configuration given a networkConfigurationId that matches a configured networkConfiguration', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999',
              ticker: 'RPC',
              id: 'testNetworkConfigurationId2',
            },
            networkConfigurations: {
              testNetworkConfigurationId1: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                type: 'rpc',
                id: 'testNetworkConfigurationId1',
              },
              testNetworkConfigurationId2: {
                rpcUrl: 'http://example-custom-rpc.metamask.io',
                chainId: '0x9999',
                ticker: 'RPC',
                type: 'rpc',
                id: 'testNetworkConfigurationId2',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls();

          controller.setActiveNetwork('testNetworkConfigurationId1');

          expect(controller.store.getState().provider).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url',
            chainId: '0xtest',
            ticker: 'TEST',
            id: 'testNetworkConfigurationId1',
          });
        },
      );
    });

    it('emits networkWillChange before making any changes to the network status', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST2',
              id: 'testNetworkConfigurationId1',
            },
            networkConfigurations: {
              testNetworkConfigurationId1: {
                rpcUrl: 'https://mock-rpc-url-1',
                chainId: '0x111',
                ticker: 'TEST1',
                id: 'testNetworkConfigurationId1',
              },
              testNetworkConfigurationId2: {
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
                id: 'testNetworkConfigurationId2',
              },
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls({
            net_version: {
              response: SUCCESSFUL_NET_VERSION_RESPONSE,
            },
          });
          const network2 = network1.with({
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url-2',
            },
          });
          network2.mockEssentialRpcCalls({
            net_version: UNSUCCESSFUL_JSON_RPC_RESPONSE,
          });
          await waitForLookupNetworkToComplete({
            controller,
            operation: async () => {
              await controller.initializeProvider();
            },
          });
          const initialNetworkStatus =
            controller.store.getState().networkStatus;
          expect(initialNetworkStatus).toBe('available');

          const networkWillChange = await waitForEvent({
            controller,
            eventName: 'networkWillChange',
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId2');
            },
            beforeResolving: () => {
              expect(controller.store.getState().networkStatus).toBe(
                initialNetworkStatus,
              );
            },
          });
          expect(networkWillChange).toBe(true);
        },
      );
    });

    it('resets the network status to "unknown" before emitting networkDidChange', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://mock-rpc-url-2',
              chainId: '0xtest2',
              ticker: 'TEST2',
              id: 'testNetworkConfigurationId1',
            },
            networkConfigurations: {
              testNetworkConfigurationId1: {
                rpcUrl: 'https://mock-rpc-url-1',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId1',
              },
              testNetworkConfigurationId2: {
                rpcUrl: 'http://mock-rpc-url-2',
                chainId: '0xtest2',
                ticker: 'TEST2',
                id: 'testNetworkConfigurationId2',
              },
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls({
            net_version: {
              response: SUCCESSFUL_NET_VERSION_RESPONSE,
            },
          });
          const network2 = network1.with({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url-1',
            },
          });
          network2.mockEssentialRpcCalls({
            net_version: {
              response: SUCCESSFUL_NET_VERSION_RESPONSE,
            },
          });

          await controller.initializeProvider();
          expect(controller.store.getState().networkStatus).toBe('available');

          await waitForStateChanges({
            controller,
            propertyPath: ['networkStatus'],
            // We only care about the first state change, because it happens
            // before networkDidChange
            count: 1,
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId1');
            },
          });
          expect(controller.store.getState().networkStatus).toBe('unknown');
        },
      );
    });

    it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST1',
              id: 'testNetworkConfigurationId1',
            },
            networkConfigurations: {
              testNetworkConfigurationId1: {
                rpcUrl: 'https://mock-rpc-url-1',
                chainId: '0x1111',
                ticker: 'TEST1',
                id: 'testNetworkConfigurationId1',
              },
              testNetworkConfigurationId2: {
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
                id: 'testNetworkConfigurationId2',
              },
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls({
            latestBlock: POST_1559_BLOCK,
          });
          const network2 = network1.with({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url-2',
            },
          });
          network2.mockEssentialRpcCalls({
            latestBlock: PRE_1559_BLOCK,
          });

          await controller.initializeProvider();
          expect(controller.store.getState().networkDetails).toStrictEqual({
            EIPS: {
              1559: true,
            },
          });

          await waitForStateChanges({
            controller,
            propertyPath: ['networkDetails'],
            // We only care about the first state change, because it happens
            // before networkDidChange
            count: 1,
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId2');
            },
          });
          expect(controller.store.getState().networkDetails).toStrictEqual({
            EIPS: {
              1559: undefined,
            },
          });
        },
      );
    });

    it('initializes a provider pointed to the given RPC URL whose chain ID matches the configured chain ID', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls();
          network.mockRpcCall({
            request: {
              method: 'test',
              params: [],
            },
            response: {
              result: 'test response',
            },
          });

          controller.setActiveNetwork('testNetworkConfigurationId');

          const { provider } = controller.getProviderAndBlockTracker();
          const promisifiedSendAsync = promisify(provider.sendAsync).bind(
            provider,
          );
          const { result: testResult } = await promisifiedSendAsync({
            id: 99999,
            jsonrpc: '2.0',
            method: 'test',
            params: [],
          });
          expect(testResult).toBe('test response');
          const { result: chainIdResult } = await promisifiedSendAsync({
            method: 'eth_chainId',
          });
          expect(chainIdResult).toBe('0xtest');
        },
      );
    });

    it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls();
          const network2 = network1.with({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network2.mockEssentialRpcCalls();
          await controller.initializeProvider();

          const { provider: providerBefore } =
            controller.getProviderAndBlockTracker();
          controller.setActiveNetwork('testNetworkConfigurationId');
          const { provider: providerAfter } =
            controller.getProviderAndBlockTracker();

          expect(providerBefore).toBe(providerAfter);
        },
      );
    });

    it('emits networkDidChange', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls();

          const networkDidChange = await waitForEvent({
            controller,
            eventName: 'networkDidChange',
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId');
            },
          });

          expect(networkDidChange).toBe(true);
        },
      );
    });

    it('emits infuraIsUnblocked', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls();

          const infuraIsUnblocked = await waitForEvent({
            controller,
            eventName: 'infuraIsUnblocked',
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId');
            },
          });

          expect(infuraIsUnblocked).toBe(true);
        },
      );
    });

    it('determines the status of the network, storing it in state', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls({
            net_version: {
              response: SUCCESSFUL_NET_VERSION_RESPONSE,
            },
          });
          await waitForStateChanges({
            controller,
            propertyPath: ['networkStatus'],
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId');
            },
          });

          expect(controller.store.getState().networkStatus).toBe('available');
        },
      );
    });

    it('determines whether the network supports EIP-1559, storing it in state', async () => {
      await withController(
        {
          state: {
            networkDetails: {
              EIPS: {},
              other: 'details',
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                id: 'testNetworkConfigurationId',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://mock-rpc-url',
            },
          });
          network.mockEssentialRpcCalls({
            latestBlock: POST_1559_BLOCK,
          });

          await waitForStateChanges({
            controller,
            propertyPath: ['networkDetails'],
            // setActiveNetwork clears networkDetails first, and then updates it
            // to what we expect it to be
            count: 2,
            operation: () => {
              controller.setActiveNetwork('testNetworkConfigurationId');
            },
          });

          expect(controller.store.getState().networkDetails).toStrictEqual({
            EIPS: {
              1559: true,
            },
          });
        },
      );
    });
  });

  describe('setProviderType', () => {
    for (const { networkType, chainId, ticker } of INFURA_NETWORKS) {
      describe(`given a type of "${networkType}"`, () => {
        it('stores the current provider configuration before overwriting it', async () => {
          await withController(
            {
              state: {
                provider: {
                  rpcUrl: 'http://mock-rpc-url-2',
                  chainId: '0xtest2',
                  nickname: 'test-chain-2',
                  ticker: 'TEST2',
                  rpcPrefs: {
                    blockExplorerUrl: 'test-block-explorer-2.com',
                  },
                  id: 'testNetworkConfigurationId2',
                },
                networkConfigurations: {
                  testNetworkConfigurationId1: {
                    rpcUrl: 'https://mock-rpc-url-1',
                    chainId: '0xtest',
                    nickname: 'test-chain',
                    ticker: 'TEST',
                    rpcPrefs: {
                      blockExplorerUrl: 'test-block-explorer.com',
                    },
                    id: 'testNetworkConfigurationId1',
                  },
                  testNetworkConfigurationId2: {
                    rpcUrl: 'http://mock-rpc-url-2',
                    chainId: '0xtest2',
                    nickname: 'test-chain-2',
                    ticker: 'TEST2',
                    rpcPrefs: {
                      blockExplorerUrl: 'test-block-explorer-2.com',
                    },
                    id: 'testNetworkConfigurationId2',
                  },
                },
              },
            },
            async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network.mockEssentialRpcCalls();

              controller.setProviderType(networkType);

              expect(
                controller.store.getState().previousProviderStore,
              ).toStrictEqual({
                rpcUrl: 'http://mock-rpc-url-2',
                chainId: '0xtest2',
                nickname: 'test-chain-2',
                ticker: 'TEST2',
                rpcPrefs: {
                  blockExplorerUrl: 'test-block-explorer-2.com',
                },
                id: 'testNetworkConfigurationId2',
              });
            },
          );
        });

        it(`overwrites the provider configuration using type: "${networkType}", chainId: "${chainId}", and ticker "${ticker}", clearing rpcUrl and nickname, and removing rpcPrefs`, async () => {
          await withController(
            {
              state: {
                provider: {
                  rpcUrl: 'http://mock-rpc-url-2',
                  chainId: '0xtest2',
                  nickname: 'test-chain-2',
                  ticker: 'TEST2',
                  rpcPrefs: {
                    blockExplorerUrl: 'test-block-explorer-2.com',
                  },
                  id: 'testNetworkConfigurationId2',
                },
                networkConfigurations: {
                  testNetworkConfigurationId1: {
                    rpcUrl: 'https://mock-rpc-url-1',
                    chainId: '0xtest',
                    nickname: 'test-chain',
                    ticker: 'TEST',
                    rpcPrefs: {
                      blockExplorerUrl: 'test-block-explorer.com',
                    },
                    id: 'testNetworkConfigurationId1',
                  },
                  testNetworkConfigurationId2: {
                    rpcUrl: 'http://mock-rpc-url-2',
                    chainId: '0xtest2',
                    nickname: 'test-chain-2',
                    ticker: 'TEST2',
                    rpcPrefs: {
                      blockExplorerUrl: 'test-block-explorer-2.com',
                    },
                    id: 'testNetworkConfigurationId2',
                  },
                },
              },
            },
            async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network.mockEssentialRpcCalls();

              controller.setProviderType(networkType);

              expect(controller.store.getState().provider).toStrictEqual({
                type: networkType,
                rpcUrl: '',
                chainId,
                ticker,
                nickname: '',
                rpcPrefs: {
                  blockExplorerUrl:
                    BUILT_IN_NETWORKS[networkType].blockExplorerUrl,
                },
              });
            },
          );
        });

        it('emits networkWillChange', async () => {
          await withController(async ({ controller }) => {
            const network = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network.mockEssentialRpcCalls();

            const networkWillChange = await waitForEvent({
              controller,
              eventName: 'networkWillChange',
              operation: () => {
                controller.setProviderType(networkType);
              },
            });

            expect(networkWillChange).toBe(true);
          });
        });

        it('resets the network status to "unknown" before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                  type: 'rpc',
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                    id: 'testNetworkConfigurationId',
                  },
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              });
              const network2 = network1.with({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network2.mockEssentialRpcCalls();

              await controller.initializeProvider();
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                // We only care about the first state change, because it
                // happens before networkDidChange
                count: 1,
                operation: () => {
                  controller.setProviderType(networkType);
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                    id: 'testNetworkConfigurationId',
                  },
                },
              },
            },
            async ({ controller, network: network1 }) => {
              network1.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });
              const network2 = network1.with({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network2.mockEssentialRpcCalls({
                latestBlock: PRE_1559_BLOCK,
              });

              await controller.initializeProvider();
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // We only care about the first state change, because it
                // happens before networkDidChange
                count: 1,
                operation: () => {
                  controller.setProviderType(networkType);
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
                },
              });
            },
          );
        });

        it(`initializes a provider pointed to the "${networkType}" Infura network (chainId: ${chainId})`, async () => {
          await withController(async ({ controller }) => {
            const network = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network.mockEssentialRpcCalls();

            controller.setProviderType(networkType);

            const { provider } = controller.getProviderAndBlockTracker();
            const promisifiedSendAsync = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: chainIdResult } = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult).toBe(chainId);
          });
        });

        it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
          await withController(async ({ controller, network: network1 }) => {
            network1.mockEssentialRpcCalls();
            const network2 = network1.with({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network2.mockEssentialRpcCalls();
            await controller.initializeProvider();

            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();
            controller.setProviderType(networkType);
            const { provider: providerAfter } =
              controller.getProviderAndBlockTracker();

            expect(providerBefore).toBe(providerAfter);
          });
        });

        it('emits networkDidChange', async () => {
          await withController(async ({ controller }) => {
            const network = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network.mockEssentialRpcCalls();

            const networkDidChange = await waitForEvent({
              controller,
              eventName: 'networkDidChange',
              operation: () => {
                controller.setProviderType(networkType);
              },
            });

            expect(networkDidChange).toBe(true);
          });
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          await withController(async ({ controller }) => {
            const network = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network.mockEssentialRpcCalls({
              eth_getBlockByNumber: {
                response: BLOCKED_INFURA_RESPONSE,
              },
            });
            const promiseForInfuraIsUnblocked = waitForEvent({
              controller,
              eventName: 'infuraIsUnblocked',
            });
            const promiseForInfuraIsBlocked = waitForEvent({
              controller,
              eventName: 'infuraIsBlocked',
            });

            controller.setProviderType(networkType);

            await expect(promiseForInfuraIsUnblocked).toNeverResolve();
            expect(await promiseForInfuraIsBlocked).toBe(true);
          });
        });

        it('determines the status of the network, storing it in state', async () => {
          await withController(async ({ controller }) => {
            const network = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: networkType,
              },
            });
            network.mockEssentialRpcCalls({
              // This results in a successful call to eth_getBlockByNumber
              // implicitly
              latestBlock: BLOCK,
            });

            await waitForStateChanges({
              controller,
              propertyPath: ['networkStatus'],
              operation: () => {
                controller.setProviderType(networkType);
              },
            });

            expect(controller.store.getState().networkStatus).toBe('available');
          });
        });

        it('determines whether the network supports EIP-1559, storing it in state', async () => {
          await withController(
            {
              state: {
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
            },
            async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                networkClientOptions: {
                  infuraNetwork: networkType,
                },
              });
              network.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // setProviderType clears networkDetails first, and then updates
                // it to what we expect it to be
                count: 2,
                operation: () => {
                  controller.setProviderType(networkType);
                },
              });

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });
            },
          );
        });
      });
    }

    describe('given a type of "rpc"', () => {
      it('throws', async () => {
        await withController(async ({ controller }) => {
          expect(() => controller.setProviderType('rpc')).toThrow(
            new Error(
              'NetworkController - cannot call "setProviderType" with type "rpc". Use "setActiveNetwork"',
            ),
          );
        });
      });
    });

    describe('given an invalid Infura network name', () => {
      it('throws', async () => {
        await withController(async ({ controller }) => {
          expect(() => controller.setProviderType('sadlflaksdj')).toThrow(
            new Error('Unknown Infura provider type "sadlflaksdj".'),
          );
        });
      });
    });
  });

  describe('resetConnection', () => {
    for (const { networkType, chainId } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        it('emits networkWillChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              const networkWillChange = await waitForEvent({
                controller,
                eventName: 'networkWillChange',
                operation: () => {
                  controller.resetConnection();
                },
              });

              expect(networkWillChange).toBe(true);
            },
          );
        });

        it('resets the network status to "unknown" before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_blockNumber: {
                  times: 2,
                },
              });

              await controller.initializeProvider();
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                // We only care about the first state change, because it
                // happens before networkDidChange
                count: 1,
                operation: () => {
                  controller.resetConnection();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
                eth_blockNumber: {
                  times: 2,
                },
              });

              await controller.initializeProvider();
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // We only care about the first state change, because it
                // happens before networkDidChange
                count: 1,
                operation: () => {
                  controller.resetConnection();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
                },
              });
            },
          );
        });

        it(`initializes a new provider object pointed to the current Infura network (type: "${networkType}", chain ID: ${chainId})`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              controller.resetConnection();

              const { provider } = controller.getProviderAndBlockTracker();
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result: chainIdResult } = await promisifiedSendAsync({
                method: 'eth_chainId',
              });
              expect(chainIdResult).toBe(chainId);
            },
          );
        });

        it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_blockNumber: {
                  times: 2,
                },
              });
              await controller.initializeProvider();

              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();
              controller.resetConnection();
              const { provider: providerAfter } =
                controller.getProviderAndBlockTracker();

              expect(providerBefore).toBe(providerAfter);
            },
          );
        });

        it('emits networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              const networkDidChange = await waitForEvent({
                controller,
                eventName: 'networkDidChange',
                operation: () => {
                  controller.resetConnection();
                },
              });

              expect(networkDidChange).toBe(true);
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: BLOCKED_INFURA_RESPONSE,
                },
              });
              const promiseForInfuraIsUnblocked = waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
              });
              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
              });

              controller.resetConnection();

              await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              expect(await promiseForInfuraIsBlocked).toBe(true);
            },
          );
        });

        it('checks the status of the network again, updating state appropriately', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: () => {
                  controller.resetConnection();
                },
              });

              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );
            },
          );
        });

        it('checks whether the network supports EIP-1559 again, updating state appropriately', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: () => {
                  controller.resetConnection();
                },
              });

              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });
            },
          );
        });
      });
    }

    describe(`when the type in the provider configuration is "rpc"`, () => {
      it('emits networkWillChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            const networkWillChange = await waitForEvent({
              controller,
              eventName: 'networkWillChange',
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(networkWillChange).toBe(true);
          },
        );
      });

      it('resets the network status to "unknown" before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              net_version: {
                response: SUCCESSFUL_NET_VERSION_RESPONSE,
                times: 2,
              },
              eth_blockNumber: {
                times: 2,
              },
            });

            await controller.initializeProvider();

            expect(controller.store.getState().networkStatus).toBe('available');
            await waitForStateChanges({
              controller,
              propertyPath: ['networkStatus'],
              // We only care about the first state change, because it happens
              // before networkDidChange
              count: 1,
              operation: () => {
                controller.resetConnection();
              },
            });
            expect(controller.store.getState().networkStatus).toBe('unknown');
          },
        );
      });

      it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
              eth_blockNumber: {
                times: 2,
              },
            });

            await controller.initializeProvider();
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });

            await waitForStateChanges({
              controller,
              propertyPath: ['networkDetails'],
              // We only care about the first state change, because it happens
              // before networkDidChange
              count: 1,
              operation: () => {
                controller.resetConnection();
              },
            });
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: undefined,
              },
            });
          },
        );
      });

      it('initializes a new provider object pointed to the same RPC URL as the current network and using the same chain ID', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            controller.resetConnection();

            const { provider } = controller.getProviderAndBlockTracker();
            const promisifiedSendAsync = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: chainIdResult } = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult).toBe('0x1337');
          },
        );
      });

      it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              eth_blockNumber: {
                times: 2,
              },
            });
            await controller.initializeProvider();

            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();
            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.resetConnection();
              },
            });
            const { provider: providerAfter } =
              controller.getProviderAndBlockTracker();

            expect(providerBefore).toBe(providerAfter);
          },
        );
      });

      it('emits networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            const networkDidChange = await waitForEvent({
              controller,
              eventName: 'networkDidChange',
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(networkDidChange).toBe(true);
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls();

            const infuraIsUnblocked = await waitForEvent({
              controller,
              eventName: 'infuraIsUnblocked',
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(infuraIsUnblocked).toBe(true);
          },
        );
      });

      it('checks the status of the network again, updating state appropriately', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              net_version: {
                response: SUCCESSFUL_NET_VERSION_RESPONSE,
              },
            });
            expect(controller.store.getState().networkStatus).toBe('unknown');

            await waitForStateChanges({
              controller,
              propertyPath: ['networkStatus'],
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(controller.store.getState().networkStatus).toBe('available');
          },
        );
      });

      it('ensures that EIP-1559 support for the current network is up to date', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });

            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: undefined,
              },
            });

            await waitForStateChanges({
              controller,
              propertyPath: ['networkDetails'],
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });
          },
        );
      });
    });
  });

  describe('rollbackToPreviousProvider', () => {
    for (const { networkType, chainId } of INFURA_NETWORKS) {
      describe(`if the previous provider configuration had a type of "${networkType}"`, () => {
        it('overwrites the the current provider configuration with the previous provider configuration', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  rpcUrl: 'https://mock-rpc-url-1',
                  chainId: '0x111',
                  nickname: 'network 1',
                  ticker: 'TEST1',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://test-block-explorer-1.com',
                  },
                  id: 'testNetworkConfigurationId1',
                },
                networkConfigurations: {
                  testNetworkConfigurationId1: {
                    rpcUrl: 'https://mock-rpc-url-1',
                    chainId: '0x111',
                    nickname: 'network 1',
                    ticker: 'TEST1',
                    rpcPrefs: {
                      blockExplorerUrl: 'https://test-block-explorer-1.com',
                    },
                    id: 'testNetworkConfigurationId1',
                  },
                  testNetworkConfigurationId2: {
                    rpcUrl: 'https://mock-rpc-url-2',
                    chainId: '0x222',
                    nickname: 'network 2',
                    ticker: 'TEST2',
                    rpcPrefs: {
                      blockExplorerUrl: 'https://test-block-explorer-2.com',
                    },
                    id: 'testNetworkConfigurationId2',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url-2',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId2');
                },
              });
              expect(controller.store.getState().provider).toStrictEqual({
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                nickname: 'network 2',
                ticker: 'TEST2',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer-2.com',
                },
                id: 'testNetworkConfigurationId2',
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.rollbackToPreviousProvider();
                },
              });
              expect(controller.store.getState().provider).toStrictEqual({
                type: networkType,
                rpcUrl: 'https://mock-rpc-url-1',
                chainId: '0x111',
                nickname: 'network 1',
                ticker: 'TEST1',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer-1.com',
                },
                id: 'testNetworkConfigurationId1',
              });
            },
          );
        });

        it('emits networkWillChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();
              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkWillChange = await waitForEvent({
                    controller,
                    eventName: 'networkWillChange',
                    operation: () => {
                      controller.rollbackToPreviousProvider();
                    },
                  });

                  expect(networkWillChange).toBe(true);
                },
              });
            },
          );
        });

        it('resets the network status to "unknown" before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await waitForStateChanges({
                    controller,
                    propertyPath: ['networkStatus'],
                    // We only care about the first state change, because it
                    // happens before networkDidChange
                    count: 1,
                    operation: () => {
                      controller.rollbackToPreviousProvider();
                    },
                  });
                  expect(controller.store.getState().networkStatus).toBe(
                    'unknown',
                  );
                },
              });
            },
          );
        });

        it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });
              previousNetwork.mockEssentialRpcCalls();

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await waitForStateChanges({
                    controller,
                    propertyPath: ['networkDetails'],
                    // We only care about the first state change, because it
                    // happens before networkDidChange
                    count: 1,
                    operation: () => {
                      controller.rollbackToPreviousProvider();
                    },
                  });
                  expect(
                    controller.store.getState().networkDetails,
                  ).toStrictEqual({
                    EIPS: {
                      1559: undefined,
                    },
                  });
                },
              });
            },
          );
        });

        it(`initializes a provider pointed to the "${networkType}" Infura network (chainId: ${chainId})`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();
              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.rollbackToPreviousProvider();
                },
              });

              const { provider } = controller.getProviderAndBlockTracker();
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result: chainIdResult } = await promisifiedSendAsync({
                method: 'eth_chainId',
              });
              expect(chainIdResult).toBe(chainId);
            },
          );
        });

        it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();
              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });

              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();
              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.rollbackToPreviousProvider();
                },
              });
              const { provider: providerAfter } =
                controller.getProviderAndBlockTracker();

              expect(providerBefore).toBe(providerAfter);
            },
          );
        });

        it('emits networkDidChange', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkDetails: {
                  EIPS: {
                    1559: false,
                  },
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls();

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkDidChange = await waitForEvent({
                    controller,
                    eventName: 'networkDidChange',
                    operation: () => {
                      controller.rollbackToPreviousProvider();
                    },
                  });
                  expect(networkDidChange).toBe(true);
                },
              });
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests for the previous network', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls();
              previousNetwork.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: BLOCKED_INFURA_RESPONSE,
                },
              });
              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });
              const promiseForInfuraIsUnblocked = waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
              });
              const promiseForInfuraIsBlocked = waitForEvent({
                controller,
                eventName: 'infuraIsBlocked',
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  controller.rollbackToPreviousProvider();
                },
              });

              await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              expect(await promiseForInfuraIsBlocked).toBe(true);
            },
          );
        });

        it('checks the status of the previous network again and updates state accordingly', async () => {
          const previousProvider = {
            type: networkType,
            // NOTE: This doesn't need to match the logical chain ID of
            // the network selected, it just needs to exist
            chainId: '0x9999999',
          };
          const currentNetworkConfiguration = {
            id: 'NetworkConfiguration',
            rpcUrl: 'https://mock-rpc-url',
            chainId: '0x1337',
            ticker: 'TEST',
          };
          await withController(
            {
              state: {
                provider: previousProvider,
                networkConfigurations: {
                  currentNetworkConfiguration,
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls({
                net_version: {
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              });
              previousNetwork.mockEssentialRpcCalls({
                eth_getBlockByNumber: {
                  response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('currentNetworkConfiguration');
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.rollbackToPreviousProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe('unknown');
            },
          );
        });

        it('checks whether the previous network supports EIP-1559 again and updates state accordingly', async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
                networkConfigurations: {
                  testNetworkConfigurationId: {
                    id: 'testNetworkConfigurationId',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0xtest',
                    ticker: 'TEST',
                  },
                },
              },
            },
            async ({ controller, network: previousNetwork }) => {
              const currentNetwork = new NetworkCommunications({
                networkClientType: 'custom',
                networkClientOptions: {
                  customRpcUrl: 'https://mock-rpc-url',
                },
              });
              currentNetwork.mockEssentialRpcCalls({
                latestBlock: PRE_1559_BLOCK,
              });
              previousNetwork.mockEssentialRpcCalls({
                latestBlock: POST_1559_BLOCK,
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: () => {
                  controller.setActiveNetwork('testNetworkConfigurationId');
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: false,
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                numberOfNetworkDetailsChanges: 2,
                operation: () => {
                  controller.rollbackToPreviousProvider();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
              });
            },
          );
        });
      });
    }

    describe(`if the previous provider configuration had a type of "rpc"`, () => {
      it('overwrites the the current provider configuration with the previous provider configuration', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x1337',
                nickname: 'test-chain-2',
                ticker: 'TEST2',
                rpcPrefs: {
                  blockExplorerUrl: 'test-block-explorer-2.com',
                },
                id: 'testNetworkConfigurationId2',
              },
              networkDetails: {
                EIPS: {
                  1559: false,
                },
              },
              networkConfigurations: {
                testNetworkConfigurationId1: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  nickname: 'test-chain',
                  ticker: 'TEST',
                  rpcPrefs: {
                    blockExplorerUrl: 'test-block-explorer.com',
                  },
                  id: 'testNetworkConfigurationId1',
                },
                testNetworkConfigurationId2: {
                  rpcUrl: 'https://mock-rpc-url-2',
                  chainId: '0x1337',
                  nickname: 'test-chain-2',
                  ticker: 'TEST2',
                  rpcPrefs: {
                    blockExplorerUrl: 'test-block-explorer-2.com',
                  },
                  id: 'testNetworkConfigurationId2',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().provider).toStrictEqual({
              type: 'goerli',
              rpcUrl: '',
              chainId: '0x5',
              ticker: 'GoerliETH',
              nickname: '',
              rpcPrefs: {
                blockExplorerUrl: 'https://goerli.etherscan.io',
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().provider).toStrictEqual({
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x1337',
              nickname: 'test-chain-2',
              ticker: 'TEST2',
              rpcPrefs: {
                blockExplorerUrl: 'test-block-explorer-2.com',
              },
              id: 'testNetworkConfigurationId2',
            });
          },
        );
      });

      it('emits networkWillChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x1337',
                ticker: 'TEST2',
                id: 'testNetworkConfigurationId2',
              },
              networkConfigurations: {
                testNetworkConfigurationId1: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId1',
                },
                testNetworkConfigurationId2: {
                  rpcUrl: 'https://mock-rpc-url-2',
                  chainId: '0x1337',
                  ticker: 'TEST2',
                  id: 'testNetworkConfigurationId2',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();
            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkWillChange = await waitForEvent({
                  controller,
                  eventName: 'networkWillChange',
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });

                expect(networkWillChange).toBe(true);
              },
            });
          },
        );
      });

      it('resets the network state to "unknown" before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().networkStatus).toBe('available');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkStatus'],
                  // We only care about the first state change, because it
                  // happens before networkDidChange
                  count: 1,
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(controller.store.getState().networkStatus).toBe(
                  'unknown',
                );
              },
            });
          },
        );
      });

      it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });
            previousNetwork.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  // We only care about the first state change, because it
                  // happens before networkDidChange
                  count: 1,
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
                  EIPS: {
                    1559: undefined,
                  },
                });
              },
            });
          },
        );
      });

      it('initializes a provider pointed to the given RPC URL whose chain ID matches the previously configured chain ID', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();
            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });

            const { provider } = controller.getProviderAndBlockTracker();
            const promisifiedSendAsync = promisify(provider.sendAsync).bind(
              provider,
            );
            const { result: chainIdResult } = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult).toBe('0x1337');
          },
        );
      });

      it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();
            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });

            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();
            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });
            const { provider: providerAfter } =
              controller.getProviderAndBlockTracker();

            expect(providerBefore).toBe(providerAfter);
          },
        );
      });

      it('emits networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkDidChange = await waitForEvent({
                  controller,
                  eventName: 'networkDidChange',
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(networkDidChange).toBe(true);
              },
            });
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls();
            previousNetwork.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const infuraIsUnblocked = await waitForEvent({
                  controller,
                  eventName: 'infuraIsUnblocked',
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });

                expect(infuraIsUnblocked).toBe(true);
              },
            });
          },
        );
      });

      it('checks the status of the previous network again and updates state accordingly', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls({
              // This results in a successful call to eth_getBlockByNumber
              // implicitly
              latestBlock: BLOCK,
            });
            previousNetwork.mockEssentialRpcCalls({
              net_version: {
                response: UNSUCCESSFUL_JSON_RPC_RESPONSE,
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().networkStatus).toBe('available');

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().networkStatus).toBe('unknown');
          },
        );
      });

      it('checks whether the previous network supports EIP-1559 again and updates state accordingly', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0xtest',
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller, network: previousNetwork }) => {
            const currentNetwork = new NetworkCommunications({
              networkClientType: 'infura',
              networkClientOptions: {
                infuraNetwork: 'goerli',
              },
            });
            currentNetwork.mockEssentialRpcCalls({
              latestBlock: PRE_1559_BLOCK,
            });
            previousNetwork.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: false,
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });
          },
        );
      });
    });
  });

  describe('upsertNetworkConfiguration', () => {
    it('throws if the given chain ID is not a 0x-prefixed hex number', async () => {
      const invalidChainId = '1';
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration(
            {
              chainId: invalidChainId,
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'rpc_url',
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          ),
        ).toThrow(
          new Error(
            `Invalid chain ID "${invalidChainId}": invalid hex string.`,
          ),
        );
      });
    });

    it('throws if the given chain ID is greater than the maximum allowed ID', async () => {
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration(
            {
              chainId: '0xFFFFFFFFFFFFFFFF',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'rpc_url',
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          ),
        ).toThrow(
          new Error(
            'Invalid chain ID "0xFFFFFFFFFFFFFFFF": numerical value greater than max safe value.',
          ),
        );
      });
    });

    it('throws if the no (or a falsy) rpcUrl is passed', async () => {
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration(
            {
              chainId: '0x9999',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          ),
        ).toThrow(
          new Error(
            'An rpcUrl is required to add or update network configuration',
          ),
        );
      });
    });

    it('throws if rpcUrl passed is not a valid Url', async () => {
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration(
            {
              chainId: '0x9999',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              ticker: 'RPC',
              rpcUrl: 'test',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          ),
        ).toThrow(new Error('rpcUrl must be a valid URL'));
      });
    });

    it('throws if the no (or a falsy) ticker is passed', async () => {
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration(
            {
              chainId: '0x5',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'https://mock-rpc-url',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          ),
        ).toThrow(
          new Error(
            'A ticker is required to add or update networkConfiguration',
          ),
        );
      });
    });

    it('throws if an options object is not passed as a second argument', async () => {
      await withController(async ({ controller }) => {
        expect(() =>
          controller.upsertNetworkConfiguration({
            chainId: '0x5',
            nickname: 'RPC',
            rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
            rpcUrl: 'https://mock-rpc-url',
          }),
        ).toThrow(
          new Error(
            "Cannot read properties of undefined (reading 'setActive')",
          ),
        );
      });
    });

    it('should add the given network if all required properties are present but nither rpcPrefs nor nickname properties are passed', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            networkConfigurations: {},
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: '0x1',
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual(
            expect.arrayContaining([
              {
                ...rpcUrlNetwork,
                nickname: undefined,
                rpcPrefs: undefined,
                id: 'networkConfigurationId',
              },
            ]),
          );
        },
      );
    });

    it('adds new networkConfiguration to networkController store, but only adds valid properties (rpcUrl, chainId, ticker, nickname, rpcPrefs) and fills any missing properties from this list as undefined', async function () {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            networkConfigurations: {},
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: '0x1',
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
            invalidKey: 'new-chain',
            invalidKey2: {},
          };

          controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual(
            expect.arrayContaining([
              {
                chainId: '0x1',
                rpcUrl: 'https://test-rpc-url',
                ticker: 'test_ticker',
                nickname: undefined,
                rpcPrefs: undefined,
                id: 'networkConfigurationId',
              },
            ]),
          );
        },
      );
    });

    it('should add the given network configuration if its rpcURL does not match an existing configuration without changing or overwriting other configurations', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId2');
      await withController(
        {
          state: {
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'ticker',
                nickname: 'nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x1',
                id: 'networkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: '0x1',
            nickname: 'RPC',
            rpcPrefs: undefined,
            rpcUrl: 'https://test-rpc-url-2',
            ticker: 'RPC',
          };

          controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual(
            expect.arrayContaining([
              {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'ticker',
                nickname: 'nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x1',
                id: 'networkConfigurationId',
              },
              { ...rpcUrlNetwork, id: 'networkConfigurationId2' },
            ]),
          );
        },
      );
    });

    it('should use the given configuration to update an existing network configuration that has a matching rpcUrl', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_chainName',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x1',
                id: 'networkConfigurationId',
              },
            },
          },
        },

        async ({ controller }) => {
          const updatedConfiguration = {
            rpcUrl: 'https://test-rpc-url',
            ticker: 'new_rpc_ticker',
            nickname: 'new_rpc_chainName',
            rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
            chainId: '0x1',
          };
          controller.upsertNetworkConfiguration(updatedConfiguration, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });
          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://test-rpc-url',
              nickname: 'new_rpc_chainName',
              ticker: 'new_rpc_ticker',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: '0x1',
              id: 'networkConfigurationId',
            },
          ]);
        },
      );
    });

    it('should use the given configuration to update an existing network configuration that has a matching rpcUrl without changing or overwriting other networkConfigurations', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'ticker',
                nickname: 'nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x1',
                id: 'networkConfigurationId',
              },
              networkConfigurationId2: {
                rpcUrl: 'https://test-rpc-url-2',
                ticker: 'ticker-2',
                nickname: 'nickname-2',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x9999',
                id: 'networkConfigurationId2',
              },
            },
          },
        },
        async ({ controller }) => {
          controller.upsertNetworkConfiguration(
            {
              rpcUrl: 'https://test-rpc-url',
              ticker: 'new-ticker',
              nickname: 'new-nickname',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: '0x1',
            },
            {
              referrer: 'https://test-dapp.com',
              source: EVENT.SOURCE.NETWORK.DAPP,
            },
          );

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://test-rpc-url',
              ticker: 'new-ticker',
              nickname: 'new-nickname',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: '0x1',
              id: 'networkConfigurationId',
            },
            {
              rpcUrl: 'https://test-rpc-url-2',
              ticker: 'ticker-2',
              nickname: 'nickname-2',
              rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
              chainId: '0x9999',
              id: 'networkConfigurationId2',
            },
          ]);
        },
      );
    });

    it('should add the given network and not set it to active if the setActive option is not passed (or a falsy value is passed)', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      const originalProvider = {
        type: 'rpc',
        rpcUrl: 'https://mock-rpc-url',
        chainId: '0xtest',
        ticker: 'TEST',
        id: 'testNetworkConfigurationId',
      };
      await withController(
        {
          state: {
            provider: originalProvider,
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: '0x1',
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(controller.store.getState().provider).toStrictEqual(
            originalProvider,
          );
        },
      );
    });

    it('should add the given network and set it to active if the setActive option is passed as true', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            networkClientOptions: {
              customRpcUrl: 'https://test-rpc-url',
            },
          });
          network.mockEssentialRpcCalls();
          const rpcUrlNetwork = {
            chainId: '0x1',
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            setActive: true,
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(controller.store.getState().provider).toStrictEqual({
            ...rpcUrlNetwork,
            nickname: undefined,
            rpcPrefs: undefined,
            type: 'rpc',
            id: 'networkConfigurationId',
          });
        },
      );
    });

    it('adds new networkConfiguration to networkController store and calls to the metametrics event tracking with the correct values', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
            },
          },
          trackMetaMetricsEvent: trackEventSpy,
        },
        async ({ controller }) => {
          const newNetworkConfiguration = {
            rpcUrl: 'https://new-chain-rpc-url',
            chainId: '0x9999',
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          controller.upsertNetworkConfiguration(newNetworkConfiguration, {
            referrer: 'https://test-dapp.com',
            source: EVENT.SOURCE.NETWORK.DAPP,
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
            },
            {
              ...newNetworkConfiguration,
              id: 'networkConfigurationId',
            },
          ]);
          expect(trackEventSpy).toHaveBeenCalledWith({
            event: 'Custom Network Added',
            category: 'Network',
            referrer: {
              url: 'https://test-dapp.com',
            },
            properties: {
              chain_id: '0x9999',
              symbol: 'NEW',
              source: 'dapp',
            },
          });
        },
      );
    });

    it('throws if referrer and source arguments are not passed', async () => {
      v4.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
              },
            },
          },
          trackMetaMetricsEvent: trackEventSpy,
        },
        async ({ controller }) => {
          const newNetworkConfiguration = {
            rpcUrl: 'https://new-chain-rpc-url',
            chainId: '0x9999',
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          expect(() =>
            controller.upsertNetworkConfiguration(newNetworkConfiguration, {}),
          ).toThrow(
            'referrer and source are required arguments for adding or updating a network configuration',
          );
        },
      );
    });
  });

  describe('removeNetworkConfigurations', () => {
    it('should remove a network configuration', async () => {
      const networkConfigurationId = 'networkConfigurationId';
      await withController(
        {
          state: {
            networkConfigurations: {
              [networkConfigurationId]: {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_chainName',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '1',
              },
            },
          },
        },
        async ({ controller }) => {
          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://test-rpc-url',
              ticker: 'old_rpc_ticker',
              nickname: 'old_rpc_chainName',
              rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
              chainId: '1',
            },
          ]);
          controller.removeNetworkConfiguration(networkConfigurationId);
          expect(
            controller.store.getState().networkConfigurations,
          ).toStrictEqual({});
        },
      );
    });
  });
});

/**
 * Builds a controller based on the given options, and calls the given function
 * with that controller.
 *
 * @param args - Either a function, or an options bag + a function. The options
 * bag is the same that NetworkController takes; the function will be called
 * with the built controller as well as an object that can be used to mock
 * requests.
 * @returns Whatever the callback returns.
 */
async function withController(...args) {
  const [givenConstructorOptions, fn] =
    args.length === 2 ? args : [{}, args[0]];
  const constructorOptions = {
    ...DEFAULT_CONTROLLER_OPTIONS,
    ...givenConstructorOptions,
  };
  const controller = new NetworkController(constructorOptions);

  const providerConfig = controller.store.getState().provider;
  const networkClientType = providerConfig.type === 'rpc' ? 'custom' : 'infura';
  const { infuraProjectId } = constructorOptions;
  const infuraNetwork =
    networkClientType === 'infura' ? providerConfig.type : undefined;
  const customRpcUrl =
    networkClientType === 'custom' ? providerConfig.rpcUrl : undefined;
  const network = new NetworkCommunications({
    networkClientType,
    networkClientOptions: { infuraProjectId, infuraNetwork, customRpcUrl },
  });

  try {
    return await fn({ controller, network });
  } finally {
    await controller.destroy();
  }
}

/**
 * For each kind of way that the provider can be set, `lookupNetwork` is always
 * called. This can cause difficulty when testing the behavior of
 * `lookupNetwork` itself, as extra requests then have to be mocked.
 * This function takes a function that presumably sets the provider,
 * stubbing `lookupNetwork` before the function and releasing the stub
 * afterward.
 *
 * @param {object} args - The arguments.
 * @param {NetworkController} args.controller - The network controller.
 * @param {() => void | Promise<void>} args.operation - The function that
 * presumably involves `lookupNetwork`.
 */
async function withoutCallingLookupNetwork({ controller, operation }) {
  const spy = jest
    .spyOn(controller, 'lookupNetwork')
    .mockResolvedValue(undefined);
  await operation();
  spy.mockRestore();
}

/**
 * For each kind of way that the provider can be set, `getEIP1559Compatibility`
 * is always called. This can cause difficulty when testing the behavior of
 * `getEIP1559Compatibility` itself, as extra requests then have to be
 * mocked. This function takes a function that presumably sets the provider,
 * stubbing `getEIP1559Compatibility` before the function and releasing the stub
 * afterward.
 *
 * @param {object} args - The arguments.
 * @param {NetworkController} args.controller - The network controller.
 * @param {() => void | Promise<void>} args.operation - The function that
 * presumably involves `getEIP1559Compatibility`.
 */
async function withoutCallingGetEIP1559Compatibility({
  controller,
  operation,
}) {
  const spy = jest
    .spyOn(controller, 'getEIP1559Compatibility')
    .mockResolvedValue(undefined);
  await operation();
  spy.mockRestore();
}

/**
 * Waits for changes to the primary observable store of a controller to occur
 * before proceeding. May be called with a function, in which case waiting will
 * occur after the function is called; or may be called standalone if you want
 * to assert that no state changes occurred.
 *
 * @param {object} [args] - The arguments.
 * @param {NetworkController} args.controller - The network controller.
 * @param {string[]} [args.propertyPath] - The path of the property you
 * expect the state changes to concern.
 * @param {number | null} [args.count] - The number of events you expect to
 * occur. If null, this function will wait until no events have occurred in
 * `wait` number of milliseconds. Default: 1.
 * @param {number} [args.duration] - The amount of time in milliseconds to
 * wait for the expected number of filtered state changes to occur before
 * resolving the promise that this function returns (default: 150).
 * @param {() => void | Promise<void>} [args.operation] - A function to run
 * that will presumably produce the state changes in question.
 * @returns A promise that resolves to an array of state objects (that is, the
 * contents of the store) when the specified number of filtered state changes
 * have occurred, or all of them if no number has been specified.
 */
async function waitForStateChanges({
  controller,
  propertyPath,
  count: expectedInterestingStateCount = 1,
  duration: timeBeforeAssumingNoMoreStateChanges = 150,
  operation = () => {
    // do nothing
  },
}) {
  const initialState = { ...controller.store.getState() };
  let isTimerRunning = false;

  const getPropertyFrom = (state) => {
    return propertyPath === undefined
      ? state
      : propertyPath.reduce((finalValue, part) => finalValue[part], state);
  };

  const isStateChangeInteresting = (newState, prevState) => {
    return !isDeepStrictEqual(
      getPropertyFrom(newState, propertyPath),
      getPropertyFrom(prevState, propertyPath),
    );
  };

  const promiseForStateChanges = new Promise((resolve, reject) => {
    // We need to declare this variable first, then assign it later, so that
    // ESLint won't complain that resetTimer is referring to this variable
    // before it's declared. And we need to use let so that we can assign it
    // below.
    /* eslint-disable-next-line prefer-const */
    let eventListener;
    let timer;
    const allStates = [];
    const interestingStates = [];

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      isTimerRunning = false;
    };

    const end = () => {
      stopTimer();

      controller.store.unsubscribe(eventListener);

      const shouldEnd =
        expectedInterestingStateCount === null
          ? interestingStates.length > 0
          : interestingStates.length === expectedInterestingStateCount;

      if (shouldEnd) {
        resolve(interestingStates);
      } else {
        // Using a string instead of an Error leads to better backtraces.
        /* eslint-disable-next-line prefer-promise-reject-errors */
        const expectedInterestingStateCountFragment =
          expectedInterestingStateCount === null
            ? 'any number of'
            : expectedInterestingStateCount;
        const propertyPathFragment =
          propertyPath === undefined ? '' : ` on \`${propertyPath.join('.')}\``;
        const actualInterestingStateCountFragment =
          expectedInterestingStateCount === null
            ? 'none'
            : interestingStates.length;
        const primaryMessage = `Expected to receive ${expectedInterestingStateCountFragment} state change(s)${propertyPathFragment}, but received ${actualInterestingStateCountFragment} after ${timeBeforeAssumingNoMoreStateChanges}ms.`;
        reject(
          [
            primaryMessage,
            'Initial state:',
            inspect(initialState, { depth: null }),
            'All state changes (without filtering):',
            inspect(allStates, { depth: null }),
            'Filtered state changes:',
            inspect(interestingStates, { depth: null }),
          ].join('\n\n'),
        );
      }
    };

    const resetTimer = () => {
      stopTimer();
      timer = originalSetTimeout(() => {
        if (isTimerRunning) {
          end();
        }
      }, timeBeforeAssumingNoMoreStateChanges);
      isTimerRunning = true;
    };

    eventListener = (newState) => {
      const isInteresting = isStateChangeInteresting(
        newState,
        allStates.length > 0 ? allStates[allStates.length - 1] : initialState,
      );

      allStates.push({ ...newState });

      if (isInteresting) {
        interestingStates.push(newState);
        if (interestingStates.length === expectedInterestingStateCount) {
          end();
        } else {
          resetTimer();
        }
      }
    };

    controller.store.subscribe(eventListener);
    resetTimer();
  });

  await operation();

  return await promiseForStateChanges;
}

/**
 * Waits for an event to occur on the controller before proceeding.
 *
 * @param {{controller: NetworkController, eventName: string, operation: (() => void | Promise<void>), beforeResolving?: (() => void | Promise<void>)}} args - The arguments.
 * @param {NetworkController} args.controller - The network controller
 * @param {string} args.eventName - The name of the event.
 * @param {() => void | Promise<void>} args.operation - A function that will
 * presumably produce the event in question.
 * @param {() => void | Promise<void>} [args.beforeResolving] - In some tests,
 * state updates happen so fast, we need to make an assertion immediately after
 * the event in question occurs. However, if we wait until the promise this
 * function returns resolves to do so, some other state update to the same
 * property may have happened. This option allows you to make an assertion
 * _before_ the promise resolves. This has the added benefit of allowing you to
 * maintain the "arrange, act, assert" ordering in your test, meaning that
 * you can still call the method that kicks off the event and then make the
 * assertion afterward instead of the other way around.
 * @returns {Promise<true>}
 */
async function waitForEvent({
  controller,
  eventName,
  operation,
  beforeResolving = async () => {
    // do nothing
  },
}) {
  const promise = new Promise((resolve) => {
    controller.once(eventName, () => {
      Promise.resolve(beforeResolving()).then(() => {
        resolve(true);
      });
    });
  });

  if (operation) {
    await operation();
  }

  return await promise;
}

/**
 * `lookupNetwork` is a method in NetworkController which is called internally
 * by a few methods. `lookupNetwork` is asynchronous as it makes network
 * requests under the hood, but unfortunately, the method is not awaited after
 * being called. Hence, if it is called during a test, even if the network
 * requests are initiated within the test, they may complete after that test
 * ends. This is a problem because it may cause Nock mocks set up in a later
 * test to get used up prematurely, causing failures.
 *
 * To fix this, we need to wait for `lookupNetwork` to fully finish before
 * continuing. Since the latest thing that happens in `lookupNetwork` is to
 * update EIP-1559 compatibility in state, we can wait for the `networkDetails`
 * state to get updated specifically. Unfortunately, we don't know how many
 * times this will happen, so this function does incur some time when it's used.
 * To speed up tests, you can pass `numberOfNetworkDetailsChanges`.
 *
 *
 * @param {object} args - The arguments.
 * @param {NetworkController} args.controller - The network controller.
 * @param {count} [args.numberOfNetworkDetailsChanges] - The number of times
 * that `networkDetails` is expected to be updated.
 * @param {() => void | Promise<void>} [args.operation] - The function that
 * presumably involves `lookupNetwork`.
 */
async function waitForLookupNetworkToComplete({
  controller,
  numberOfNetworkDetailsChanges = null,
  operation,
}) {
  await waitForStateChanges({
    controller,
    propertyPath: ['networkDetails'],
    operation,
    count: numberOfNetworkDetailsChanges,
  });
}
