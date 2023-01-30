import { inspect, isDeepStrictEqual, promisify } from 'util';
import assert from 'assert';
import { isMatch } from 'lodash';
import nock from 'nock';
import sinon from 'sinon';
import NetworkController from './network-controller';

// Store this up front so it doesn't get lost when it is stubbed
const originalSetTimeout = global.setTimeout;

/**
 * @typedef {import('nock').Scope} NockScope
 *
 * A object returned by the `nock` function which holds all of the request mocks
 * for a network.
 */

/**
 * @typedef {{request: JsonRpcResponseBodyMock, response: JsonRpcResponseBodyMock | { httpStatus?: number, body: JsonRpcResponseBodyMock | (() => JsonRpcResponseBodyMock | Promise<JsonRpcResponseBodyMock>) }, error?: unknown, delay?: number; times?: number}} RpcMock
 *
 * Arguments to `mockRpcCall` which allow for specifying a canned response for a
 * particular RPC request.
 */

/**
 * @typedef {{id?: number; jsonrpc?: string, method: string, params?: unknown[]}} JsonRpcRequestBodyMock
 *
 * A partial form of a prototypical JSON-RPC request body.
 */

/**
 * @typedef {{id?: number; jsonrpc?: string; result?: string; error?: string}} JsonRpcResponseBodyMock
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
  baseFeePerGas: '0x999999',
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
const DEFAULT_INFURA_PROJECT_ID = 'infura-project-id';

/**
 * Despite the signature of its constructor, NetworkController must take an
 * Infura project ID. This object is mixed into the options first when a
 * NetworkController is instantiated in tests.
 */
const DEFAULT_CONTROLLER_OPTIONS = {
  infuraProjectId: DEFAULT_INFURA_PROJECT_ID,
};

/**
 * The set of networks that, when specified, create an Infura provider as
 * opposed to a "standard" provider (one suited for a custom RPC endpoint).
 */
const INFURA_NETWORKS = [
  {
    networkName: 'Mainnet',
    networkType: 'mainnet',
    chainId: '0x1',
    networkVersion: '1',
    ticker: 'ETH',
  },
  {
    networkName: 'Goerli',
    networkType: 'goerli',
    chainId: '0x5',
    networkVersion: '5',
    ticker: 'GoerliETH',
  },
  {
    networkName: 'Sepolia',
    networkType: 'sepolia',
    chainId: '0xaa36a7',
    networkVersion: '11155111',
    ticker: 'SepoliaETH',
  },
];

/**
 * Handles mocking provider requests for a particular network.
 */
class NetworkCommunications {
  #infuraNetwork;

  #customRpcUrl;

  /**
   * Builds an object for mocking provider requests.
   *
   * @param {object} options - An options bag.
   * @param {"infura" | "custom"} options.networkClientType - Specifies the
   * expected middleware stack that will represent the provider: "infura" for an
   * Infura network; "custom" for a custom RPC endpoint.
   * @param {string} options.infuraNetwork - The name of the Infura network
   * being tested, assuming that `networkClientType` is "infura".
   * @param {string} options.infuraProjectId - The project ID of the Infura
   * network being tested, assuming that `networkClientType` is "infura".
   * @param {string} options.customRpcUrl - The URL of the custom RPC endpoint,
   * assuming that `networkClientType` is "custom".
   * @returns {NockScope} The nock scope.
   */
  constructor({
    networkClientType,
    infuraNetwork,
    infuraProjectId = DEFAULT_INFURA_PROJECT_ID,
    customRpcUrl,
  }) {
    this.networkClientType = networkClientType;
    this.#infuraNetwork = infuraNetwork;
    this.infuraProjectId = infuraProjectId;
    this.#customRpcUrl = customRpcUrl;

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
   * @param options - The same options that NetworkCommunications takes.
   */
  with(options) {
    return new NetworkCommunications({
      networkClientType: this.networkClientType,
      infuraNetwork: this.#infuraNetwork,
      infuraProjectId: this.infuraProjectId,
      customRpcUrl: this.#customRpcUrl,
      ...options,
    });
  }

  /**
   * Mocks the RPC calls that NetworkController makes internally.
   *
   * @param {object} args - The arguments.
   * @param {{number: string, baseFeePerGas?: string}} [args.latestBlock] - The
   * block object that will be used to mock `eth_blockNumber` and
   * `eth_getBlockByNumber`.
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
    const { number: latestBlockNumber } = latestBlock;
    assert(latestBlockNumber, 'Please provide a latestBlock with a number.');

    const defaultMocksByRpcMethod = {
      eth_blockNumber: {
        request: {
          method: 'eth_blockNumber',
          params: [],
        },
        response: {
          result: latestBlockNumber,
        },
        // When the provider is configured for an Infura network,
        // NetworkController makes a sentinel request for `eth_blockNumber`, so
        // we ensure that it is mocked by default. Conversely, when the provider
        // is configured for a custom RPC endpoint, we don't mock
        // `eth_blockNumber` at all unless specified. Admittedly, this is a bit
        // magical, but it saves us from having to think about this in tests
        // if we don't have to.
        times: this.networkClientType === 'infura' ? 1 : 0,
      },
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
    };
    const providedMocksByRpcMethod = {
      eth_blockNumber: ethBlockNumberMocks,
      eth_getBlockByNumber: ethGetBlockByNumberMocks,
      net_version: netVersionMocks,
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

    // Mock the request that the block tracker makes last so that the request
    // that NetworkController makes can be customized without interfering with
    // *this* request (which cannot be customized except for the block number
    // it returns).
    allMocks.push({
      request: {
        method: 'eth_blockNumber',
        params: [],
      },
      response: {
        result: latestBlockNumber,
      },
    });

    allMocks.forEach((mock) => {
      this.mockRpcCall(mock);
    });
  }

  /**
   * Mocks a JSON-RPC request sent to the provider with the given response.
   *
   * @param {RpcMock} args - The arguments.
   * @param {JsonRpcRequestBodyMock} args.request - The request data. Must
   * include a `method`. Note that EthQuery's `sendAsync` method implicitly uses
   * an empty array for `params` if it is not provided in the original request,
   * so make sure to include this.
   * @param {JsonRpcResponseBodyMock | { httpStatus?: number, body: JsonRpcResponseBodyMock | (() => JsonRpcResponseBodyMock | Promise<JsonRpcResponseBodyMock>) }} args.response - Information
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
   * @returns {NockScope | null} The nock scope object that represents all of
   * the mocks for the network, or null if `times` is 0.
   */
  mockRpcCall({ request, response, error, delay, times }) {
    if (times === 0) {
      return null;
    }

    const url =
      this.networkClientType === 'infura' ? `/v3/${this.infuraProjectId}` : '/';

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
    } else if (response !== undefined) {
      return nockInterceptor.reply(async (_uri, requestBody) => {
        const httpStatus = response?.httpStatus ?? 200;

        let unresolvedPartialResponseBody;
        if (typeof response.body === 'function') {
          unresolvedPartialResponseBody = response.body();
        } else if ('body' in response) {
          unresolvedPartialResponseBody = response.body;
        } else {
          unresolvedPartialResponseBody = response;
        }

        const partialResponseBody = await unresolvedPartialResponseBody;

        const completeResponseBody = { jsonrpc: '2.0' };
        if (requestBody.id !== undefined) {
          completeResponseBody.id = requestBody.id;
        }
        ['id', 'jsonrpc', 'result', 'error'].forEach((prop) => {
          if (partialResponseBody[prop] !== undefined) {
            completeResponseBody[prop] = partialResponseBody[prop];
          }
        });

        return [httpStatus, completeResponseBody];
      });
    }

    throw new Error(
      'Neither `response` nor `error` was given. Please specify one of them.',
    );
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
      const exampleInitialState = {
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
      };

      await withController(
        {
          state: exampleInitialState,
        },
        ({ controller }) => {
          expect(controller.store.getState()).toMatchInlineSnapshot(`
            {
              "network": "loading",
              "networkDetails": {
                "EIPS": {
                  "1559": false,
                },
              },
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
              "network": "loading",
              "networkDetails": {
                "EIPS": {
                  "1559": undefined,
                },
              },
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
            times: 1,
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

    INFURA_NETWORKS.forEach(
      ({ networkName, networkType, chainId, networkVersion }) => {
        describe(`when the type in the provider configuration is "${networkType}"`, () => {
          it(`initializes a provider pointed to the ${networkName} Infura network (chainId: ${chainId})`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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
                const chainIdResult = await promisifiedSendAsync({
                  method: 'eth_chainId',
                });
                expect(chainIdResult.result).toBe(chainId);
              },
            );
          });

          it('emits infuraIsUnblocked (assuming that the request to eth_blockNumber responds successfully)', async () => {
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

          it(`persists "${networkVersion}" to state as the network version of ${networkName}`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls();

                await controller.initializeProvider();

                expect(controller.store.getState().network).toStrictEqual(
                  networkVersion,
                );
              },
            );
          });

          it(`persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
                networkDetails: {
                  EIPS: {},
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });

                await controller.initializeProvider();

                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBe(true);
              },
            );
          });
        });
      },
    );

    describe(`when the type in the provider configuration is "rpc"`, () => {
      it('initializes a provider pointed to the given RPC URL whose chain ID matches the configured chain ID', async () => {
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
            const testResponse = await promisifiedSendAsync({
              id: 99999,
              jsonrpc: '2.0',
              method: 'test',
              params: [],
            });
            expect(testResponse.result).toBe('test response');
            const chainIdResponse = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResponse.result).toBe('0x1337');
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

      it('persists the network version to state (assuming that the request for net_version responds successfully)', async () => {
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
                response: {
                  result: '42',
                },
              },
            });

            await controller.initializeProvider();

            expect(controller.store.getState().network).toStrictEqual('42');
          },
        );
      });

      it('persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
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

            expect(
              controller.store.getState().networkDetails.EIPS['1559'],
            ).toBe(true);
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
  });

  describe('getEIP1559Compatibility', () => {
    it('returns true when baseFeePerGas is in the block header', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls({
          latestBlock: POST_1559_BLOCK,
        });
        await controller.initializeProvider();

        const supportsEIP1559 = await controller.getEIP1559Compatibility();

        expect(supportsEIP1559).toBe(true);
      });
    });

    it('persists to state that the network supports EIP-1559 when baseFeePerGas is in the block header', async () => {
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

    it('returns false when baseFeePerGas is not in the block header', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls({
          latestBlock: PRE_1559_BLOCK,
        });
        await controller.initializeProvider();

        const supportsEIP1559 = await controller.getEIP1559Compatibility();

        expect(supportsEIP1559).toBe(false);
      });
    });

    it('persists to state that the network does not support EIP-1559 when baseFeePerGas is not in the block header', async () => {
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

    it('does not make multiple requests to eth_getBlockByNumber when called multiple times (as long as the request to eth_getBlockByNumber succeeded the first time)', async () => {
      await withController(async ({ controller, network }) => {
        // This mocks eth_getBlockByNumber once by default
        network.mockEssentialRpcCalls();
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

            await waitForStateChanges({
              controller,
              propertyPath: ['network'],
              count: 0,
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            expect(controller.store.getState()).toStrictEqual({
              ...initialState,
              network: 'loading',
              previousProviderStore: providerConfig,
            });
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

    INFURA_NETWORKS.forEach(({ networkName, networkType, networkVersion }) => {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        describe('if the request for eth_blockNumber responds successfully', () => {
          it('emits infuraIsUnblocked as long as the network has not changed by the time the request ends', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_blockNumber: {
                    response: {
                      result: '0x42',
                    },
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

          it('does not emit infuraIsUnblocked if the network has changed by the time the request ends', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller }) => {
                const network1 = new NetworkCommunications({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network1.mockEssentialRpcCalls({
                  eth_blockNumber: {
                    response: {
                      body: async () => {
                        await waitForEvent({
                          controller,
                          eventName: 'networkDidChange',
                          operation: async () => {
                            await withoutCallingLookupNetwork({
                              controller,
                              operation: () => {
                                controller.setRpcTarget(
                                  'http://some-rpc-url',
                                  '0x1337',
                                );
                              },
                            });
                          },
                        });
                        return {
                          result: '0x42',
                        };
                      },
                    },
                  },
                });
                const network2 = new NetworkCommunications({
                  networkClientType: 'rpc',
                  customRpcUrl: 'http://some-rpc-url',
                });
                network2.mockEssentialRpcCalls();
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
                    await controller.initializeProvider();
                  },
                });

                await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              },
            );
          });
        });

        describe('if the request for eth_blockNumber responds with a "countryBlocked" error', () => {
          it('emits infuraIsBlocked as long as the network has not changed by the time the request ends', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_blockNumber: {
                    response: {
                      httpStatus: 500,
                      error: 'countryBlocked',
                    },
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

          it('does not emit infuraIsBlocked if the network has changed by the time the request ends', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller }) => {
                const network1 = new NetworkCommunications({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network1.mockEssentialRpcCalls({
                  eth_blockNumber: {
                    response: {
                      httpStatus: 500,
                      body: async () => {
                        await withoutCallingLookupNetwork({
                          controller,
                          operation: async () => {
                            await waitForEvent({
                              controller,
                              eventName: 'networkDidChange',
                              operation: () => {
                                controller.setRpcTarget(
                                  'http://some-rpc-url',
                                  '0x1337',
                                );
                              },
                            });
                          },
                        });
                        return {
                          error: 'countryBlocked',
                        };
                      },
                    },
                  },
                });
                const network2 = new NetworkCommunications({
                  networkClientType: 'rpc',
                  customRpcUrl: 'http://some-rpc-url',
                });
                network2.mockEssentialRpcCalls();
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
        });

        describe('if the request for eth_blockNumber responds with a generic error', () => {
          it('does not emit infuraIsUnblocked', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_blockNumber: {
                    response: {
                      httpStatus: 500,
                      body: {
                        error: 'oops',
                      },
                    },
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
                    await controller.initializeProvider();
                  },
                });

                await expect(promiseForInfuraIsUnblocked).toNeverResolve();
              },
            );
          });
        });

        it(`persists "${networkVersion}" to state as the network version of ${networkName}`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls();
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().network).toStrictEqual(
                networkVersion,
              );
            },
          );
        });

        it(`does not update the network state if it is already set to "${networkVersion}"`, async () => {
          await withController(
            {
              state: {
                provider: {
                  type: networkType,
                },
              },
            },
            async ({ controller, network }) => {
              network.mockEssentialRpcCalls({
                eth_blockNumber: {
                  times: 2,
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
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              const promiseForStateChanges = waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              await expect(promiseForStateChanges).toNeverResolve();
            },
          );
        });

        describe('if the request for eth_getBlockByNumber responds successfully', () => {
          it('persists to state that the network supports EIP-1559 when baseFeePerGas is in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
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

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(true);
              },
            );
          });

          it('persists to state that the network does not support EIP-1559 when baseFeePerGas is not in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
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

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(false);
              },
            );
          });
        });

        describe('if the request for eth_getBlockByNumber responds with an error', () => {
          it('does not update the network details in any way', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: {
                      error: 'oops',
                    },
                  },
                });
                await withoutCallingGetEIP1559Compatibility({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBeUndefined();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  count: 0,
                  operation: async () => {
                    await controller.getEIP1559Compatibility();
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBeUndefined();
              },
            );
          });
        });
      });
    });

    describe(`when the type in the provider configuration is "rpc"`, () => {
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
            network.mockEssentialRpcCalls();
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

      describe('if the request for net_version responds successfully', () => {
        it('persists the network version to state', async () => {
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

              await waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().network).toStrictEqual('42');
            },
          );
        });

        it('does not persist the result of net_version if it matches what is already in state', async () => {
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
                eth_blockNumber: {
                  times: 2,
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
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              const promiseForStateChanges = waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              await expect(promiseForStateChanges).toNeverResolve();
            },
          );
        });

        describe('if the request for eth_getBlockByNumber responds successfully', () => {
          it('persists to state that the network supports EIP-1559 when baseFeePerGas is in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x1337',
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await controller.lookupNetwork();

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(true);
              },
            );
          });

          it('persists to state that the network does not support EIP-1559 when baseFeePerGas is not in the block header', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x1337',
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  latestBlock: PRE_1559_BLOCK,
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                await controller.lookupNetwork();

                expect(
                  controller.store.getState().networkDetails.EIPS[1559],
                ).toBe(false);
              },
            );
          });
        });

        describe('if the request for eth_getBlockByNumber responds with an error', () => {
          it('does not update the network details in any way', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x1337',
                  },
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  eth_getBlockByNumber: {
                    response: {
                      error: 'oops',
                    },
                  },
                });
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBeUndefined();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  count: 0,
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBeUndefined();
              },
            );
          });
        });
      });

      describe('if the request for net_version responds with an error', () => {
        it('resets the network status to "loading"', async () => {
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
                    response: {
                      result: '42',
                    },
                  },
                  {
                    response: {
                      error: 'oops',
                    },
                  },
                ],
              });
              await controller.initializeProvider();
              expect(controller.store.getState().network).toStrictEqual('42');

              await waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().network).toStrictEqual(
                'loading',
              );
            },
          );
        });

        it('removes from state whether the network supports EIP-1559', async () => {
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
                latestBlock: POST_1559_BLOCK,
                net_version: [
                  {
                    response: {
                      result: '42',
                    },
                  },
                  {
                    response: {
                      error: 'oops',
                    },
                  },
                ],
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
      });
    });
  });

  describe('setRpcTarget', () => {
    it('throws if the given chain ID is not a 0x-prefixed hex number', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls();

        expect(() =>
          controller.setRpcTarget('http://some.url', 'not a chain id'),
        ).toThrow(
          new Error('Invalid chain ID "not a chain id": invalid hex string.'),
        );
      });
    });

    it('throws if the given chain ID is greater than the maximum allowed ID', async () => {
      await withController(async ({ controller, network }) => {
        network.mockEssentialRpcCalls();

        expect(() =>
          controller.setRpcTarget('http://some.url', '0xFFFFFFFFFFFFFFFF'),
        ).toThrow(
          new Error(
            'Invalid chain ID "0xFFFFFFFFFFFFFFFF": numerical value greater than max safe value.',
          ),
        );
      });
    });

    it('captures the current provider configuration before overwriting it', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999',
              nickname: 'Test initial state',
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url',
          });
          network.mockEssentialRpcCalls();

          controller.setRpcTarget('https://mock-rpc-url', '0x1337');

          expect(
            controller.store.getState().previousProviderStore,
          ).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'http://example-custom-rpc.metamask.io',
            chainId: '0x9999',
            nickname: 'Test initial state',
          });
        },
      );
    });

    it('overwrites the provider configuration given a minimal set of arguments, filling in ticker, nickname, and rpcPrefs with default values', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999',
              nickname: 'Test initial state',
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url',
          });
          network.mockEssentialRpcCalls();

          controller.setRpcTarget('https://mock-rpc-url', '0x1337');

          expect(controller.store.getState().provider).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url',
            chainId: '0x1337',
            ticker: 'ETH',
            nickname: '',
            rpcPrefs: undefined,
          });
        },
      );
    });

    it('overwrites the provider configuration completely given a maximal set of arguments', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999',
              nickname: 'Test initial state',
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url',
          });
          network.mockEssentialRpcCalls();

          controller.setRpcTarget(
            'https://mock-rpc-url',
            '0x1337',
            'DAI',
            'Cool network',
            'RPC prefs',
          );

          expect(controller.store.getState().provider).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url',
            chainId: '0x1337',
            ticker: 'DAI',
            nickname: 'Cool network',
            rpcPrefs: 'RPC prefs',
          });
        },
      );
    });

    it('emits networkWillChange', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
        });
        network.mockEssentialRpcCalls();

        const networkWillChange = await waitForEvent({
          controller,
          eventName: 'networkWillChange',
          operation: () => {
            controller.setRpcTarget('https://mock-rpc-url', '0x1337');
          },
        });

        expect(networkWillChange).toBe(true);
      });
    });

    it('initializes a provider pointed to the given RPC URL whose chain ID matches the configured chain ID', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
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

        controller.setRpcTarget('https://mock-rpc-url', '0x1337');

        const { provider } = controller.getProviderAndBlockTracker();
        const promisifiedSendAsync = promisify(provider.sendAsync).bind(
          provider,
        );
        const testResponse = await promisifiedSendAsync({
          id: 99999,
          jsonrpc: '2.0',
          method: 'test',
          params: [],
        });
        expect(testResponse.result).toBe('test response');
        const chainIdResponse = await promisifiedSendAsync({
          method: 'eth_chainId',
        });
        expect(chainIdResponse.result).toBe('0x1337');
      });
    });

    it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
        });
        network.mockEssentialRpcCalls();
        controller.initializeProvider();

        const { provider: providerBefore } =
          controller.getProviderAndBlockTracker();
        controller.setRpcTarget('https://mock-rpc-url', '0x1337');
        const { provider: providerAfter } =
          controller.getProviderAndBlockTracker();

        expect(providerBefore).toBe(providerAfter);
      });
    });

    it('resets the network state to "loading" before emitting networkDidChange', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://mock-rpc-url-1',
              chainId: '0xFF',
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls({
            net_version: {
              response: {
                result: '255',
              },
            },
          });
          const network2 = network1.with({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url-2',
          });
          network2.mockEssentialRpcCalls({
            net_version: {
              response: {
                result: "this got used when it shouldn't",
              },
            },
          });

          await controller.initializeProvider();
          expect(controller.store.getState().network).toStrictEqual('255');

          await waitForStateChanges({
            controller,
            propertyPath: ['network'],
            // We only care about the first state change, because it happens
            // before networkDidChange
            count: 1,
            operation: () => {
              controller.setRpcTarget('https://mock-rpc-url-2', '0xCC');
            },
          });
          expect(controller.store.getState().network).toStrictEqual('loading');
        },
      );
    });

    it('resets EIP support for the network before emitting networkDidChange', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://mock-rpc-url-1',
              chainId: '0xFF',
            },
          },
        },
        async ({ controller, network: network1 }) => {
          network1.mockEssentialRpcCalls({
            latestBlock: POST_1559_BLOCK,
          });
          const network2 = network1.with({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url-2',
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
              controller.setRpcTarget('https://mock-rpc-url-2', '0xCC');
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

    it('emits networkDidChange', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
        });
        network.mockEssentialRpcCalls();

        const networkDidChange = await waitForEvent({
          controller,
          eventName: 'networkDidChange',
          operation: () => {
            controller.setRpcTarget('https://mock-rpc-url', '0x1337');
          },
        });

        expect(networkDidChange).toBe(true);
      });
    });

    it('emits infuraIsUnblocked', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
        });
        network.mockEssentialRpcCalls();

        const infuraIsUnblocked = await waitForEvent({
          controller,
          eventName: 'infuraIsUnblocked',
          operation: () => {
            controller.setRpcTarget('https://mock-rpc-url', '0x1337');
          },
        });

        expect(infuraIsUnblocked).toBe(true);
      });
    });

    it('persists the network version to state (assuming that the request for net_version responds successfully)', async () => {
      await withController(async ({ controller }) => {
        const network = new NetworkCommunications({
          networkClientType: 'custom',
          customRpcUrl: 'https://mock-rpc-url',
        });
        network.mockEssentialRpcCalls({
          net_version: {
            response: {
              result: '42',
            },
          },
        });

        await waitForStateChanges({
          controller,
          propertyPath: ['network'],
          operation: () => {
            controller.setRpcTarget('https://mock-rpc-url', '0x1337');
          },
        });

        expect(controller.store.getState().network).toStrictEqual('42');
      });
    });

    it('persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)', async () => {
      await withController(
        {
          state: {
            networkDetails: {
              EIPS: {},
            },
          },
        },
        async ({ controller }) => {
          const network = new NetworkCommunications({
            networkClientType: 'custom',
            customRpcUrl: 'https://mock-rpc-url',
          });
          network.mockEssentialRpcCalls({
            latestBlock: POST_1559_BLOCK,
          });

          await waitForStateChanges({
            controller,
            propertyPath: ['networkDetails'],
            count: 2,
            operation: () => {
              controller.setRpcTarget('https://mock-rpc-url', '0x1337');
            },
          });

          expect(controller.store.getState().networkDetails.EIPS['1559']).toBe(
            true,
          );
        },
      );
    });
  });

  describe('setProviderType', () => {
    INFURA_NETWORKS.forEach(
      ({ networkName, networkType, chainId, networkVersion, ticker }) => {
        describe(`given a type of "${networkType}"`, () => {
          it('captures the current provider configuration before overwriting it', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'http://example-custom-rpc.metamask.io',
                    chainId: '0x9999',
                    nickname: 'Test initial state',
                  },
                },
              },
              async ({ controller }) => {
                const network = new NetworkCommunications({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network.mockEssentialRpcCalls();

                controller.setProviderType(networkType);

                expect(
                  controller.store.getState().previousProviderStore,
                ).toStrictEqual({
                  type: 'rpc',
                  rpcUrl: 'http://example-custom-rpc.metamask.io',
                  chainId: '0x9999',
                  nickname: 'Test initial state',
                });
              },
            );
          });

          it(`overwrites the provider configuration using type: "${networkType}", chainId: "${chainId}", and ticker "${ticker}", clearing rpcUrl and nickname, and removing rpcPrefs`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'http://example-custom-rpc.metamask.io',
                    chainId: '0x9999',
                    nickname: 'Test initial state',
                  },
                },
              },
              async ({ controller }) => {
                const network = new NetworkCommunications({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network.mockEssentialRpcCalls();

                controller.setProviderType(networkType);

                expect(controller.store.getState().provider).toStrictEqual({
                  type: networkType,
                  rpcUrl: '',
                  chainId,
                  ticker,
                  nickname: '',
                });
              },
            );
          });

          it('emits networkWillChange', async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
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

          it(`initializes a provider pointed to the ${networkName} Infura network (chainId: ${chainId})`, async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
              });
              network.mockEssentialRpcCalls();

              controller.setProviderType(networkType);

              const { provider } = controller.getProviderAndBlockTracker();
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const chainIdResult = await promisifiedSendAsync({
                method: 'eth_chainId',
              });
              expect(chainIdResult.result).toBe(chainId);
            });
          });

          it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
              });
              network.mockEssentialRpcCalls();
              controller.initializeProvider();

              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();
              controller.setProviderType(networkType);
              const { provider: providerAfter } =
                controller.getProviderAndBlockTracker();

              expect(providerBefore).toBe(providerAfter);
            });
          });

          it('resets the network state to "loading" before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'http://mock-rpc-url',
                    chainId: '0xFF',
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  net_version: {
                    response: {
                      result: '255',
                    },
                  },
                });
                const network2 = network1.with({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network2.mockEssentialRpcCalls();

                await controller.initializeProvider();
                expect(controller.store.getState().network).toStrictEqual(
                  '255',
                );

                await waitForStateChanges({
                  controller,
                  propertyPath: ['network'],
                  // We only care about the first state change, because it
                  // happens before networkDidChange
                  count: 1,
                  operation: () => {
                    controller.setProviderType(networkType);
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  'loading',
                );
              },
            );
          });

          it('resets EIP support for the network before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: 'rpc',
                    rpcUrl: 'http://mock-rpc-url-1',
                    chainId: '0xFF',
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });
                const network2 = network1.with({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network2.mockEssentialRpcCalls({
                  latestBlock: PRE_1559_BLOCK,
                });

                await controller.initializeProvider();
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
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

          it('emits networkDidChange', async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
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

          it('emits infuraIsUnblocked (assuming that the request for eth_blockNumber responds successfully)', async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
              });
              network.mockEssentialRpcCalls();

              const infuraIsUnblocked = await waitForEvent({
                controller,
                eventName: 'infuraIsUnblocked',
                operation: () => {
                  controller.setProviderType(networkType);
                },
              });

              expect(infuraIsUnblocked).toBe(true);
            });
          });

          it(`persists "${networkVersion}" to state as the network version of ${networkName}`, async () => {
            await withController(async ({ controller }) => {
              const network = new NetworkCommunications({
                networkClientType: 'infura',
                infuraNetwork: networkType,
              });
              network.mockEssentialRpcCalls();

              await waitForStateChanges({
                controller,
                propertyPath: ['network'],
                operation: () => {
                  controller.setProviderType(networkType);
                },
              });

              expect(controller.store.getState().network).toStrictEqual(
                networkVersion,
              );
            });
          });

          it('persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)', async () => {
            await withController(
              {
                state: {
                  networkDetails: {
                    EIPS: {},
                  },
                },
              },
              async ({ controller }) => {
                const network = new NetworkCommunications({
                  networkClientType: 'infura',
                  infuraNetwork: networkType,
                });
                network.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });

                await waitForStateChanges({
                  controller,
                  propertyPath: ['networkDetails'],
                  count: 2,
                  operation: () => {
                    controller.setProviderType(networkType);
                  },
                });

                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBe(true);
              },
            );
          });
        });
      },
    );

    describe('given a type of "rpc"', () => {
      it('throws', async () => {
        await withController(async ({ controller }) => {
          expect(() => controller.setProviderType('rpc')).toThrow(
            new Error(
              'NetworkController - cannot call "setProviderType" with type "rpc". Use "setRpcTarget"',
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
    INFURA_NETWORKS.forEach(
      ({ networkName, networkType, chainId, networkVersion }) => {
        describe(`when the type in the provider configuration is "${networkType}"`, () => {
          it('emits networkWillChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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

          it(`initializes a new provider object pointed to the current Infura network (name: ${networkName}, chain ID: ${chainId})`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls();
                const { provider: providerBefore } =
                  controller.getProviderAndBlockTracker();

                controller.resetConnection();

                const { provider: providerAfter } =
                  controller.getProviderAndBlockTracker();
                expect(providerBefore).not.toBe(providerAfter);
                const promisifiedSendAsync = promisify(
                  providerAfter.sendAsync,
                ).bind(providerAfter);
                const chainIdResult = await promisifiedSendAsync({
                  method: 'eth_chainId',
                });
                expect(chainIdResult.result).toBe(chainId);
              },
            );
          });

          it('resets the network state to "loading" before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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
                expect(controller.store.getState().network).toStrictEqual(
                  networkVersion,
                );

                await waitForStateChanges({
                  controller,
                  propertyPath: ['network'],
                  // We only care about the first state change, because it
                  // happens before networkDidChange
                  count: 1,
                  operation: () => {
                    controller.resetConnection();
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  'loading',
                );
              },
            );
          });

          it('resets EIP support for the network before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
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

          it('emits networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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

          it('emits infuraIsUnblocked (assuming that the request for eth_blockNumber responds successfully)', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
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

          it(`ensures that the network version in state is set to "${networkVersion}"`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls();

                await waitForStateChanges({
                  controller,
                  propertyPath: ['network'],
                  operation: () => {
                    controller.resetConnection();
                  },
                });

                expect(controller.store.getState().network).toStrictEqual(
                  networkVersion,
                );
              },
            );
          });

          it('does not ensure that EIP-1559 support for the current network is up to date', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
                networkDetails: {
                  EIPS: {},
                },
              },
              async ({ controller, network }) => {
                network.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });

                controller.resetConnection();

                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBeUndefined();
              },
            );
          });
        });
      },
    );

    describe(`when the type in the provider configuration is "rpc"`, () => {
      it('emits networkWillChange', async () => {
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

      it('initializes a new provider object pointed to the same RPC URL as the current network and using the same chain ID', async () => {
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
            network.mockEssentialRpcCalls();
            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();

            controller.resetConnection();

            const { provider: providerAfter } =
              controller.getProviderAndBlockTracker();
            expect(providerBefore).not.toBe(providerAfter);
            const promisifiedSendAsync = promisify(
              providerAfter.sendAsync,
            ).bind(providerAfter);
            const chainIdResult = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult.result).toBe('0x1337');
          },
        );
      });

      it('resets the network state to "loading" before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xFF',
              },
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              eth_blockNumber: {
                times: 2,
              },
              net_version: {
                response: {
                  result: '255',
                },
              },
            });

            await controller.initializeProvider();
            expect(controller.store.getState().network).toStrictEqual('255');

            await waitForStateChanges({
              controller,
              propertyPath: ['network'],
              // We only care about the first state change, because it happens
              // before networkDidChange
              count: 1,
              operation: () => {
                controller.resetConnection();
              },
            });
            expect(controller.store.getState().network).toStrictEqual(
              'loading',
            );
          },
        );
      });

      it('resets EIP support for the network before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xFF',
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

      it('emits networkDidChange', async () => {
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
                chainId: '0x1337',
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

      it('ensures that the network version in state is up to date', async () => {
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
                response: {
                  result: '42',
                },
              },
            });

            await waitForStateChanges({
              controller,
              propertyPath: ['network'],
              operation: () => {
                controller.resetConnection();
              },
            });

            expect(controller.store.getState().network).toStrictEqual('42');
          },
        );
      });

      it('does not ensure that EIP-1559 support for the current network is up to date', async () => {
        await withController(
          {
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            networkDetails: {
              EIPS: {},
            },
          },
          async ({ controller, network }) => {
            network.mockEssentialRpcCalls({
              latestBlock: POST_1559_BLOCK,
            });

            controller.resetConnection();

            expect(
              controller.store.getState().networkDetails.EIPS['1559'],
            ).toBeUndefined();
          },
        );
      });
    });
  });

  describe('rollbackToPreviousProvider', () => {
    INFURA_NETWORKS.forEach(
      ({ networkName, networkType, chainId, networkVersion }) => {
        describe(`if the previous provider configuration had a type of "${networkType}"`, () => {
          it('merges the previous configuration into the current provider configuration', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls();

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
                  },
                });
                expect(controller.store.getState().provider).toStrictEqual({
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'ETH',
                  nickname: '',
                  rpcPrefs: undefined,
                });

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(controller.store.getState().provider).toStrictEqual({
                  type: networkType,
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'ETH',
                  nickname: '',
                  rpcPrefs: undefined,
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
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls();
                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
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

          it(`initializes a provider pointed to the ${networkName} Infura network (chainId: ${chainId})`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls();
                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
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
                const chainIdResult = await promisifiedSendAsync({
                  method: 'eth_chainId',
                });
                expect(chainIdResult.result).toBe(chainId);
              },
            );
          });

          it('resets the network state to "loading" before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls({
                  net_version: {
                    response: {
                      result: '255',
                    },
                  },
                });

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  '255',
                );

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: async () => {
                    await waitForStateChanges({
                      controller,
                      propertyPath: ['network'],
                      // We only care about the first state change, because it
                      // happens before networkDidChange
                      count: 1,
                      operation: () => {
                        controller.rollbackToPreviousProvider();
                      },
                    });
                    expect(controller.store.getState().network).toStrictEqual(
                      'loading',
                    );
                  },
                });
              },
            );
          });

          it('resets EIP support for the network before emitting networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
                  },
                });
                expect(
                  controller.store.getState().networkDetails,
                ).toStrictEqual({
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

          it('emits networkDidChange', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls();

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
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

          it('emits infuraIsUnblocked (assuming that the request for eth_blockNumber responds successfully)', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls();

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
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

          it(`persists "${networkVersion}" to state as the network version of ${networkName}`, async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls();
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls({
                  net_version: {
                    response: {
                      result: '255',
                    },
                  },
                });

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  '255',
                );

                await waitForLookupNetworkToComplete({
                  controller,
                  numberOfNetworkDetailsChanges: 2,
                  operation: async () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  networkVersion,
                );
              },
            );
          });

          it('persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)', async () => {
            await withController(
              {
                state: {
                  provider: {
                    type: networkType,
                  },
                },
              },
              async ({ controller, network: network1 }) => {
                network1.mockEssentialRpcCalls({
                  latestBlock: POST_1559_BLOCK,
                });
                const network2 = network1.with({
                  networkClientType: 'custom',
                  customRpcUrl: 'https://mock-rpc-url',
                });
                network2.mockEssentialRpcCalls({
                  latestBlock: PRE_1559_BLOCK,
                  net_version: {
                    response: {
                      result: '99999',
                    },
                  },
                });

                await waitForLookupNetworkToComplete({
                  controller,
                  operation: () => {
                    controller.setRpcTarget('https://mock-rpc-url', '0x1337');
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBe(false);

                await waitForLookupNetworkToComplete({
                  controller,
                  numberOfNetworkDetailsChanges: 2,
                  operation: async () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(
                  controller.store.getState().networkDetails.EIPS['1559'],
                ).toBe(true);
              },
            );
          });
        });
      },
    );

    describe(`if the previous provider configuration had a type of "rpc"`, () => {
      it('merges the previous configuration into the current provider configuration', async () => {
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
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();

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
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().provider).toStrictEqual({
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0x1337',
              ticker: 'GoerliETH',
              nickname: '',
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
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
          },
          async ({ controller, network: network1 }) => {
            network1.mockEssentialRpcCalls();
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();
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

      it('initializes a provider pointed to the given RPC URL whose chain ID matches the previously configured chain ID', async () => {
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
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();
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
            const chainIdResult = await promisifiedSendAsync({
              method: 'eth_chainId',
            });
            expect(chainIdResult.result).toBe('0x1337');
          },
        );
      });

      it('resets the network state to "loading" before emitting networkDidChange', async () => {
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
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().network).toStrictEqual('5');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await waitForStateChanges({
                  controller,
                  propertyPath: ['network'],
                  // We only care about the first state change, because it
                  // happens before networkDidChange
                  count: 1,
                  operation: () => {
                    controller.rollbackToPreviousProvider();
                  },
                });
                expect(controller.store.getState().network).toStrictEqual(
                  'loading',
                );
              },
            });
          },
        );
      });

      it('resets EIP support for the network before emitting networkDidChange', async () => {
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
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls({
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

      it('emits networkDidChange', async () => {
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
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();

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
                chainId: '0x1337',
              },
            },
          },
          async ({ controller, network: network1 }) => {
            network1.mockEssentialRpcCalls();
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();

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

      it('persists the network version to state (assuming that the request for net_version responds successfully)', async () => {
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
              net_version: {
                response: {
                  result: '42',
                },
              },
            });
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls();

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(controller.store.getState().network).toStrictEqual('5');

            await waitForLookupNetworkToComplete({
              controller,
              numberOfNetworkDetailsChanges: 2,
              operation: async () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().network).toStrictEqual('42');
          },
        );
      });

      it('persists to state whether the network supports EIP-1559 (assuming that the request for eth_getBlockByNumber responds successfully)', async () => {
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
              latestBlock: POST_1559_BLOCK,
              net_version: {
                response: {
                  result: '99999',
                },
              },
            });
            const network2 = network1.with({
              networkClientType: 'infura',
              infuraNetwork: 'goerli',
            });
            network2.mockEssentialRpcCalls({
              latestBlock: PRE_1559_BLOCK,
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: () => {
                controller.setProviderType('goerli');
              },
            });
            expect(
              controller.store.getState().networkDetails.EIPS['1559'],
            ).toBe(false);

            await waitForLookupNetworkToComplete({
              controller,
              numberOfNetworkDetailsChanges: 2,
              operation: async () => {
                controller.rollbackToPreviousProvider();
              },
            });
            expect(
              controller.store.getState().networkDetails.EIPS['1559'],
            ).toBe(true);
          },
        );
      });
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
    infuraProjectId,
    infuraNetwork,
    customRpcUrl,
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
    let alreadyEnded = false;

    const end = () => {
      if (!alreadyEnded) {
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
            propertyPath === undefined
              ? ''
              : ` on \`${propertyPath.join('.')}\``;
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
        alreadyEnded = true;
      }
    };

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      isTimerRunning = false;
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
          stopTimer();
          end();
        } else {
          resetTimer();
        }
      }
    };

    controller.store.subscribe(eventListener);
    resetTimer();
  });

  try {
    await operation();
  } catch (error) {
    // swallow errors since they're not useful here
  }

  return await promiseForStateChanges;
}

/**
 * Waits for an event to occur on the controller before proceeding.
 *
 * @param {object} args - The arguments.
 * @param {NetworkController} args.controller - The network controller
 * @param {string} args.eventName - The name of the event.
 * @param {() => void | Promise<void>} args.operation - A function that will
 * presumably produce the event in question.
 * @returns {Promise<boolean>}
 */
async function waitForEvent({ controller, eventName, operation }) {
  const promise = new Promise((resolve) => {
    controller.once(eventName, () => {
      resolve(true);
    });
  });

  await operation();

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
