// The `refreshNetworkTests` helper defines tests outside of a `describe` block.
/* eslint-disable jest/require-top-level-describe */

import { inspect, isDeepStrictEqual, promisify } from 'util';
import assert from 'assert';
import { get } from 'lodash';
import { v4 } from 'uuid';
import nock from 'nock';
import { ControllerMessenger } from '@metamask/base-controller';
import { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import { toHex } from '@metamask/controller-utils';
import { when, resetAllWhenMocks } from 'jest-when';
import { ethErrors } from 'eth-rpc-errors';
import {
  NetworkStatus,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import {
  NetworkController,
  NetworkControllerAction,
  NetworkControllerEvent,
  NetworkControllerOptions,
  NetworkControllerState,
  ProviderConfiguration,
} from './network-controller';
import {
  createNetworkClient,
  NetworkClientType,
} from './create-network-client';
import { FakeBlockTracker } from './test/fake-block-tracker';
import { FakeProvider, FakeProviderStub } from './test/fake-provider';

jest.mock('./create-network-client');

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

/**
 * A block header object that `eth_getBlockByNumber` can be mocked to return.
 * Note that this type does not specify all of the properties present within the
 * block header; within these tests, we are only interested in `number` and
 * `baseFeePerGas`.
 */
type Block = {
  number: string;
  baseFeePerGas?: string;
};

const createNetworkClientMock = jest.mocked(createNetworkClient);
const uuidV4Mock = jest.mocked(v4);

/**
 * A dummy block that matches the pre-EIP-1559 format (i.e. it doesn't have the
 * `baseFeePerGas` property).
 */
const PRE_1559_BLOCK: Block = {
  number: '0x42',
};

/**
 * A dummy block that matches the pre-EIP-1559 format (i.e. it has the
 * `baseFeePerGas` property).
 */
const POST_1559_BLOCK: Block = {
  ...PRE_1559_BLOCK,
  baseFeePerGas: '0x63c498a46',
};

/**
 * An alias for `POST_1559_BLOCK`, for tests that don't care about which kind of
 * block they're looking for.
 */
const BLOCK: Block = POST_1559_BLOCK;

/**
 * The networks that NetworkController recognizes as built-in Infura networks,
 * along with information we expect to be true for those networks.
 */
const INFURA_NETWORKS = [
  {
    networkType: NETWORK_TYPES.MAINNET,
    chainId: toHex(1),
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    networkType: NETWORK_TYPES.GOERLI,
    chainId: toHex(5),
    ticker: 'GoerliETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    networkType: NETWORK_TYPES.SEPOLIA,
    chainId: toHex(11155111),
    ticker: 'SepoliaETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
];

/**
 * A response object for a successful request to `eth_getBlockByNumber`. It is
 * assumed that the block number here is insignificant to the test.
 */
const SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE = {
  result: BLOCK,
};

/**
 * A response object for a successful request to `net_version`. It is assumed
 * that the network ID here is insignificant to the test.
 */
const SUCCESSFUL_NET_VERSION_RESPONSE = {
  result: '42',
};

/**
 * A response object for a request that has been geoblocked by Infura.
 */
const BLOCKED_INFURA_JSON_RPC_ERROR = ethErrors.rpc.internal(
  JSON.stringify({ error: 'countryBlocked' }),
);

/**
 * A response object for a unsuccessful request to any RPC method. It is assumed
 * that the error here is insignificant to the test.
 */
const GENERIC_JSON_RPC_ERROR = ethErrors.rpc.internal(
  JSON.stringify({ error: 'oops' }),
);

describe('NetworkController', () => {
  beforeEach(() => {
    // Disable all requests, even those to localhost
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect('localhost');
    nock.cleanAll();
    resetAllWhenMocks();
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    const invalidInfuraProjectIds = [undefined, null, {}, 1];
    invalidInfuraProjectIds.forEach((invalidProjectId) => {
      it(`throws given an invalid Infura ID of "${inspect(
        invalidProjectId,
      )}"`, () => {
        const messenger = buildMessenger();
        const restrictedMessenger = buildNetworkControllerMessenger(messenger);
        expect(
          () =>
            new NetworkController({
              messenger: restrictedMessenger,
              // @ts-expect-error We are intentionally passing bad input.
              infuraProjectId: invalidProjectId,
            }),
        ).toThrow('Invalid Infura project ID');
      });
    });

    it('initializes the state with some defaults', async () => {
      await withController(({ controller }) => {
        expect(controller.store.getState()).toMatchInlineSnapshot(`
          {
            "networkConfigurations": {},
            "networkDetails": {
              "EIPS": {},
            },
            "networkId": null,
            "networkStatus": "unknown",
            "providerConfig": {
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

    it('merges the given state into the default state', async () => {
      await withController(
        {
          state: {
            providerConfig: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999' as const,
              nickname: 'Test initial state',
            },
            networkDetails: {
              EIPS: {
                1559: true,
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
                  "1559": true,
                },
              },
              "networkId": null,
              "networkStatus": "unknown",
              "providerConfig": {
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
  });

  describe('destroy', () => {
    it('does not throw if called before the provider is initialized', async () => {
      await withController(async ({ controller }) => {
        expect(await controller.destroy()).toBeUndefined();
      });
    });

    it('stops the block tracker for the currently selected network as long as the provider has been initialized', async () => {
      await withController(async ({ controller }) => {
        const fakeProvider = buildFakeProvider();
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
        await controller.initializeProvider();
        const { blockTracker } = controller.getProviderAndBlockTracker();
        assert(blockTracker, 'Block tracker is somehow unset');
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
    describe('when the type in the provider config is invalid', () => {
      it('throws', async () => {
        const invalidProviderConfig = {};
        await withController(
          /* @ts-expect-error We're intentionally passing bad input. */
          {
            state: {
              providerConfig: invalidProviderConfig,
            },
          },
          async ({ controller }) => {
            await expect(async () => {
              await controller.initializeProvider();
            }).rejects.toThrow("Unrecognized network type: 'undefined'");
          },
        );
      });
    });

    for (const { networkType } of INFURA_NETWORKS) {
      describe(`when the type in the provider config is "${networkType}"`, () => {
        it(`creates a network client for the ${networkType} Infura network, capturing the resulting provider`, async () => {
          await withController(
            {
              state: {
                providerConfig: buildProviderConfig({
                  type: networkType,
                }),
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'test_method',
                    params: [],
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              await controller.initializeProvider();

              expect(createNetworkClientMock).toHaveBeenCalledWith({
                network: networkType,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              });
              const { provider } = controller.getProviderAndBlockTracker();
              assert(provider, 'Provider is not set');
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result } = await promisifiedSendAsync({
                id: 1,
                jsonrpc: '2.0',
                method: 'test_method',
                params: [],
              });
              expect(result).toBe('test response');
            },
          );
        });

        lookupNetworkTests({
          expectedProviderConfig: buildProviderConfig({ type: networkType }),
          initialState: {
            providerConfig: buildProviderConfig({ type: networkType }),
          },
          operation: async (controller: NetworkController) => {
            await controller.initializeProvider();
          },
        });
      });
    }

    describe(`when the type in the provider configuration is "rpc"`, () => {
      describe('if chainId and rpcUrl are present in the provider config', () => {
        it('creates a network client for a custom RPC endpoint using the provider config, capturing the resulting provider', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: NETWORK_TYPES.RPC,
                  chainId: toHex(1337),
                  rpcUrl: 'http://example.com',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'test_method',
                    params: [],
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              await controller.initializeProvider();

              expect(createNetworkClientMock).toHaveBeenCalledWith({
                chainId: toHex(1337),
                rpcUrl: 'http://example.com',
                type: NetworkClientType.Custom,
              });
              const { provider } = controller.getProviderAndBlockTracker();
              assert(provider, 'Provider is not set');
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const { result } = await promisifiedSendAsync({
                id: 1,
                jsonrpc: '2.0',
                method: 'test_method',
                params: [],
              });
              expect(result).toBe('test response');
            },
          );
        });

        lookupNetworkTests({
          expectedProviderConfig: buildProviderConfig({
            type: NETWORK_TYPES.RPC,
          }),
          initialState: {
            providerConfig: buildProviderConfig({
              type: NETWORK_TYPES.RPC,
            }),
          },
          operation: async (controller: NetworkController) => {
            await controller.initializeProvider();
          },
        });
      });

      describe('if chainId is missing from the provider config', () => {
        it('throws', async () => {
          await withController(
            {
              state: {
                providerConfig: buildProviderConfig({
                  type: NETWORK_TYPES.RPC,
                  chainId: undefined,
                }),
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              await expect(() =>
                controller.initializeProvider(),
              ).rejects.toThrow(
                'chainId must be provided for custom RPC endpoints',
              );
            },
          );
        });

        it('does not create a network client or capture a provider', async () => {
          await withController(
            {
              state: {
                providerConfig: buildProviderConfig({
                  type: NETWORK_TYPES.RPC,
                  chainId: undefined,
                }),
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              try {
                await controller.initializeProvider();
              } catch {
                // ignore the error
              }

              expect(createNetworkClientMock).not.toHaveBeenCalled();
              const { provider, blockTracker } =
                controller.getProviderAndBlockTracker();
              expect(provider).toBeNull();
              expect(blockTracker).toBeNull();
            },
          );
        });
      });

      describe('if rpcUrl is missing from the provider config', () => {
        it('throws', async () => {
          await withController(
            {
              state: {
                providerConfig: buildProviderConfig({
                  type: NETWORK_TYPES.RPC,
                  rpcUrl: undefined,
                }),
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              await expect(() =>
                controller.initializeProvider(),
              ).rejects.toThrow(
                'rpcUrl must be provided for custom RPC endpoints',
              );
            },
          );
        });

        it('does not create a network client or capture a provider', async () => {
          await withController(
            {
              state: {
                providerConfig: buildProviderConfig({
                  type: NETWORK_TYPES.RPC,
                  rpcUrl: undefined,
                }),
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              createNetworkClientMock.mockReturnValue(fakeNetworkClient);

              try {
                await controller.initializeProvider();
              } catch {
                // ignore the error
              }

              expect(createNetworkClientMock).not.toHaveBeenCalled();
              const { provider, blockTracker } =
                controller.getProviderAndBlockTracker();
              expect(provider).toBeNull();
              expect(blockTracker).toBeNull();
            },
          );
        });
      });
    });
  });

  describe('getProviderAndBlockTracker', () => {
    it('returns objects that proxy to the provider and block tracker as long as the provider has been initialized', async () => {
      await withController(async ({ controller }) => {
        const fakeProvider = buildFakeProvider();
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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

    for (const { networkType } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is changed to "${networkType}"`, () => {
        it(`returns a provider object that was pointed to another network before the switch and is pointed to "${networkType}" afterward`, async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'test',
                    },
                    response: {
                      result: 'test response 1',
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'test',
                    },
                    response: {
                      result: 'test response 2',
                    },
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.initializeProvider();
              const { provider } = controller.getProviderAndBlockTracker();
              assert(provider, 'Provider is somehow unset');

              const promisifiedSendAsync1 = promisify(provider.sendAsync).bind(
                provider,
              );
              const response1 = await promisifiedSendAsync1({
                id: '1',
                jsonrpc: '2.0',
                method: 'test',
              });
              expect(response1.result).toBe('test response 1');

              await controller.setProviderType(networkType);
              const promisifiedSendAsync2 = promisify(provider.sendAsync).bind(
                provider,
              );
              const response2 = await promisifiedSendAsync2({
                id: '2',
                jsonrpc: '2.0',
                method: 'test',
              });
              expect(response2.result).toBe('test response 2');
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
              providerConfig: {
                type: 'goerli',
                // NOTE: This doesn't need to match the logical chain ID of
                // the network selected, it just needs to exist
                chainId: '0x9999999',
              },
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'ABC',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response 1',
                  },
                },
              ]),
              buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response 2',
                  },
                },
              ]),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                chainId: '0x1337',
                rpcUrl: 'https://mock-rpc-url',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.initializeProvider();
            const { provider } = controller.getProviderAndBlockTracker();
            assert(provider, 'Provider is somehow unset');

            const promisifiedSendAsync1 = promisify(provider.sendAsync).bind(
              provider,
            );
            const response1 = await promisifiedSendAsync1({
              id: '1',
              jsonrpc: '2.0',
              method: 'test',
            });
            expect(response1.result).toBe('test response 1');

            await controller.setActiveNetwork('testNetworkConfigurationId');
            const promisifiedSendAsync2 = promisify(provider.sendAsync).bind(
              provider,
            );
            const response2 = await promisifiedSendAsync2({
              id: '2',
              jsonrpc: '2.0',
              method: 'test',
            });
            expect(response2.result).toBe('test response 2');
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'eth_getBlockByNumber',
                },
                response: {
                  result: POST_1559_BLOCK,
                },
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              true,
            );
          },
        );
      });

      it('returns true', async () => {
        await withController(async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'eth_getBlockByNumber',
              },
              response: {
                result: POST_1559_BLOCK,
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBeTruthy();
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'eth_getBlockByNumber',
                },
                response: {
                  result: PRE_1559_BLOCK,
                },
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              false,
            );
          },
        );
      });

      it('returns false', async () => {
        await withController(async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'eth_getBlockByNumber',
              },
              response: {
                result: PRE_1559_BLOCK,
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBe(false);
        });
      });
    });

    describe('when the request for the latest block responds with null', () => {
      it('persists false to state as whether the network supports EIP-1559', async () => {
        await withController(
          {
            state: {
              networkDetails: {
                EIPS: {},
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'eth_getBlockByNumber',
                },
                response: {
                  result: null,
                },
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();

            await controller.getEIP1559Compatibility();

            expect(controller.store.getState().networkDetails.EIPS[1559]).toBe(
              false,
            );
          },
        );
      });

      it('returns false', async () => {
        await withController(async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'eth_getBlockByNumber',
              },
              response: {
                result: null,
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
          await controller.initializeProvider();

          const supportsEIP1559 = await controller.getEIP1559Compatibility();

          expect(supportsEIP1559).toBe(false);
        });
      });
    });

    it('does not make multiple requests to eth_getBlockByNumber when called multiple times and the request to eth_getBlockByNumber succeeded the first time', async () => {
      await withController(async ({ controller }) => {
        const fakeProvider = buildFakeProvider([
          {
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
          },
        ]);
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
        await withoutCallingGetEIP1559Compatibility({
          controller,
          operation: async () => {
            await controller.initializeProvider();
          },
        });

        await controller.getEIP1559Compatibility();
        await controller.getEIP1559Compatibility();

        expect(
          fakeProvider.calledStubs.filter(
            (stub) => stub.request.method === 'eth_getBlockByNumber',
          ),
        ).toHaveLength(1);
      });
    });
  });

  describe('lookupNetwork', () => {
    describe('if the provider has not been initialized', () => {
      it('does not update state in any way', async () => {
        const providerConfig = {
          type: NETWORK_TYPES.RPC,
          rpcUrl: 'http://example-custom-rpc.metamask.io',
          chainId: '0x9999' as const,
          nickname: 'Test initial state',
        };
        const initialState = {
          providerConfig,
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            const stateAfterConstruction = controller.store.getState();

            await controller.lookupNetwork();

            expect(controller.store.getState()).toStrictEqual(
              stateAfterConstruction,
            );
          },
        );
      });

      it('does not emit infuraIsUnblocked', async () => {
        await withController(async ({ controller, messenger }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

          const promiseForNoInfuraIsUnblockedEvents = waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsUnblocked',
            count: 0,
            operation: async () => {
              await controller.lookupNetwork();
            },
          });

          expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
        });
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(async ({ controller, messenger }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

          const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await controller.lookupNetwork();
            },
          });

          expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
        });
      });
    });

    INFURA_NETWORKS.forEach(({ networkType }) => {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        describe('if the network was switched after the eth_getBlockByNumber request started but before it completed', () => {
          it('stores the network status of the second network, not the first', async () => {
            await withController(
              {
                state: {
                  providerConfig: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                      ticker: 'ABC',
                    },
                  },
                },
                infuraProjectId: 'some-infura-project-id',
              },
              async ({ controller }) => {
                const fakeProviders = [
                  buildFakeProvider([
                    {
                      request: {
                        method: 'net_version',
                      },
                      response: {
                        result: '1',
                      },
                    },
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    },
                    {
                      request: {
                        method: 'net_version',
                      },
                      response: {
                        result: '1',
                      },
                    },
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                      beforeCompleting: async () => {
                        await controller.setActiveNetwork(
                          'testNetworkConfigurationId',
                        );
                      },
                    },
                  ]),
                  buildFakeProvider([
                    {
                      request: {
                        method: 'net_version',
                      },
                      error: GENERIC_JSON_RPC_ERROR,
                    },
                  ]),
                ];
                const fakeNetworkClients = [
                  buildFakeClient(fakeProviders[0]),
                  buildFakeClient(fakeProviders[1]),
                ];
                mockCreateNetworkClient()
                  .calledWith({
                    network: networkType,
                    infuraProjectId: 'some-infura-project-id',
                    type: NetworkClientType.Infura,
                  })
                  .mockReturnValue(fakeNetworkClients[0])
                  .calledWith({
                    chainId: '0x1337',
                    rpcUrl: 'https://mock-rpc-url',
                    type: NetworkClientType.Custom,
                  })
                  .mockReturnValue(fakeNetworkClients[1]);

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
                  providerConfig: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                      ticker: 'ABC',
                    },
                  },
                },
                infuraProjectId: 'some-infura-project-id',
              },
              async ({ controller }) => {
                const fakeProviders = [
                  buildFakeProvider([
                    {
                      request: {
                        method: 'net_version',
                      },
                      response: {
                        result: '111',
                      },
                    },
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                      beforeCompleting: async () => {
                        await controller.setActiveNetwork(
                          'testNetworkConfigurationId',
                        );
                      },
                    },
                  ]),
                  buildFakeProvider([
                    {
                      request: {
                        method: 'net_version',
                      },
                      response: {
                        result: '222',
                      },
                    },
                  ]),
                ];
                const fakeNetworkClients = [
                  buildFakeClient(fakeProviders[0]),
                  buildFakeClient(fakeProviders[1]),
                ];
                mockCreateNetworkClient()
                  .calledWith({
                    network: networkType,
                    infuraProjectId: 'some-infura-project-id',
                    type: NetworkClientType.Infura,
                  })
                  .mockReturnValue(fakeNetworkClients[0])
                  .calledWith({
                    chainId: '0x1337',
                    rpcUrl: 'https://mock-rpc-url',
                    type: NetworkClientType.Custom,
                  })
                  .mockReturnValue(fakeNetworkClients[1]);
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
                  providerConfig: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                  networkConfigurations: {
                    testNetworkConfigurationId: {
                      id: 'testNetworkConfigurationId',
                      rpcUrl: 'https://mock-rpc-url',
                      chainId: '0x1337',
                      ticker: 'ABC',
                    },
                  },
                },
                infuraProjectId: 'some-infura-project-id',
              },
              async ({ controller }) => {
                const fakeProviders = [
                  buildFakeProvider([
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: {
                        result: POST_1559_BLOCK,
                      },
                      beforeCompleting: async () => {
                        await controller.setActiveNetwork(
                          'testNetworkConfigurationId',
                        );
                      },
                    },
                  ]),
                  buildFakeProvider([
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: {
                        result: PRE_1559_BLOCK,
                      },
                    },
                  ]),
                ];
                const fakeNetworkClients = [
                  buildFakeClient(fakeProviders[0]),
                  buildFakeClient(fakeProviders[1]),
                ];
                mockCreateNetworkClient()
                  .calledWith({
                    network: networkType,
                    infuraProjectId: 'some-infura-project-id',
                    type: NetworkClientType.Infura,
                  })
                  .mockReturnValue(fakeNetworkClients[0])
                  .calledWith({
                    chainId: '0x1337',
                    rpcUrl: 'https://mock-rpc-url',
                    type: NetworkClientType.Custom,
                  })
                  .mockReturnValue(fakeNetworkClients[1]);
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
                  providerConfig: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
                infuraProjectId: 'some-infura-project-id',
              },
              async ({ controller, messenger }) => {
                const fakeProviders = [
                  buildFakeProvider([
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                      beforeCompleting: async () => {
                        await controller.setProviderType(
                          anotherNetwork.networkType,
                        );
                      },
                    },
                  ]),
                  buildFakeProvider([
                    {
                      request: {
                        method: 'eth_getBlockByNumber',
                      },
                      error: BLOCKED_INFURA_JSON_RPC_ERROR,
                    },
                  ]),
                ];
                const fakeNetworkClients = [
                  buildFakeClient(fakeProviders[0]),
                  buildFakeClient(fakeProviders[1]),
                ];
                mockCreateNetworkClient()
                  .calledWith({
                    network: networkType,
                    infuraProjectId: 'some-infura-project-id',
                    type: NetworkClientType.Infura,
                  })
                  .mockReturnValueOnce(fakeNetworkClients[0])
                  .calledWith({
                    network: anotherNetwork.networkType,
                    infuraProjectId: 'some-infura-project-id',
                    type: NetworkClientType.Infura,
                  })
                  .mockReturnValueOnce(fakeNetworkClients[1]);
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });
                const promiseForNoInfuraIsUnblockedEvents =
                  waitForPublishedEvents({
                    messenger,
                    eventType: 'NetworkController:infuraIsUnblocked',
                    count: 0,
                  });
                const promiseForInfuraIsBlocked = waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:infuraIsBlocked',
                });

                await controller.lookupNetwork();

                expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
                expect(await promiseForInfuraIsBlocked).toBeTruthy();
              },
            );
          });
        });

        lookupNetworkTests({
          expectedProviderConfig: buildProviderConfig({ type: networkType }),
          initialState: {
            providerConfig: buildProviderConfig({ type: networkType }),
          },
          operation: async (controller) => {
            await controller.lookupNetwork();
          },
        });
      });
    });

    describe('when the type in the provider configuration is "rpc"', () => {
      describe('if the network was switched after the net_version request started but before it completed', () => {
        it('stores the network status of the second network, not the first', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
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
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '1',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '1',
                    },
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('1');

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(controller.store.getState().networkId).toBe('2');
            },
          );
        });

        it('stores the EIP-1559 support of the second network, not the first', async () => {
          await withController(
            {
              state: {
                providerConfig: {
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
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: PRE_1559_BLOCK,
                    },
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
                other: 'details',
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
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller, messenger }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              const promiseForNoInfuraIsUnblockedEvents =
                waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:infuraIsUnblocked',
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger,
                eventType: 'NetworkController:infuraIsBlocked',
              });

              await controller.lookupNetwork();

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
            },
          );
        });
      });

      describe('if the network was switched after the eth_getBlockByNumber request started but before it completed', () => {
        it('stores the network status of the second network, not the first', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
                networkDetails: {
                  EIPS: {},
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
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
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '1',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '1',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('1');

              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });
              expect(controller.store.getState().networkId).toBe('2');
            },
          );
        });

        it('stores the EIP-1559 support of the second network, not the first', async () => {
          await withController(
            {
              state: {
                providerConfig: {
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
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: PRE_1559_BLOCK,
                    },
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
                other: 'details',
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
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'RPC',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller, messenger }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                    beforeCompleting: async () => {
                      await controller.setProviderType('goerli');
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  chainId: '0x1337',
                  rpcUrl: 'https://mock-rpc-url',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValueOnce(fakeNetworkClients[0])
                .calledWith({
                  network: NETWORK_TYPES.GOERLI,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValueOnce(fakeNetworkClients[1]);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              const promiseForNoInfuraIsUnblockedEvents =
                waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:infuraIsUnblocked',
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger,
                eventType: 'NetworkController:infuraIsBlocked',
              });

              await controller.lookupNetwork();

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
            },
          );
        });
      });

      lookupNetworkTests({
        expectedProviderConfig: buildProviderConfig({
          type: NETWORK_TYPES.RPC,
        }),
        initialState: {
          providerConfig: buildProviderConfig({ type: NETWORK_TYPES.RPC }),
        },
        operation: async (controller) => {
          await controller.lookupNetwork();
        },
      });
    });
  });

  describe('setActiveNetwork', () => {
    refreshNetworkTests({
      expectedProviderConfig: {
        rpcUrl: 'https://mock-rpc-url',
        chainId: toHex(111),
        ticker: 'TEST',
        nickname: 'something existing',
        id: 'testNetworkConfigurationId',
        rpcPrefs: undefined,
        type: NETWORK_TYPES.RPC,
      },
      initialState: {
        networkConfigurations: {
          testNetworkConfigurationId: {
            rpcUrl: 'https://mock-rpc-url',
            chainId: toHex(111),
            ticker: 'TEST',
            nickname: 'something existing',
            id: 'testNetworkConfigurationId',
            rpcPrefs: undefined,
          },
        },
      },
      operation: async (controller) => {
        await controller.setActiveNetwork('testNetworkConfigurationId');
      },
    });

    describe('if the given ID does not match a network configuration in networkConfigurations', () => {
      it('throws', async () => {
        await withController(
          {
            state: {
              networkConfigurations: {
                testNetworkConfigurationId: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: toHex(111),
                  ticker: 'TEST',
                  id: 'testNetworkConfigurationId',
                },
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            await expect(() =>
              controller.setActiveNetwork('invalidNetworkConfigurationId'),
            ).rejects.toThrow(
              new Error(
                'networkConfigurationId invalidNetworkConfigurationId does not match a configured networkConfiguration',
              ),
            );
          },
        );
      });
    });

    describe('if the network config does not contain an RPC URL', () => {
      it('throws', async () => {
        await withController(
          // @ts-expect-error RPC URL intentionally omitted
          {
            state: {
              providerConfig: {
                type: NETWORK_TYPES.RPC,
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                nickname: 'something existing',
                rpcPrefs: undefined,
              },
              networkConfigurations: {
                testNetworkConfigurationId1: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: toHex(111),
                  ticker: 'TEST',
                  nickname: 'something existing',
                  id: 'testNetworkConfigurationId1',
                  rpcPrefs: undefined,
                },
                testNetworkConfigurationId2: {
                  rpcUrl: undefined,
                  chainId: toHex(222),
                  ticker: 'something existing',
                  nickname: 'something existing',
                  id: 'testNetworkConfigurationId2',
                  rpcPrefs: undefined,
                },
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            createNetworkClientMock.mockReturnValue(fakeNetworkClient);

            await expect(() =>
              controller.setActiveNetwork('testNetworkConfigurationId2'),
            ).rejects.toThrow(
              'rpcUrl must be provided for custom RPC endpoints',
            );

            expect(createNetworkClientMock).not.toHaveBeenCalled();
            const { provider, blockTracker } =
              controller.getProviderAndBlockTracker();
            expect(provider).toBeNull();
            expect(blockTracker).toBeNull();
          },
        );
      });
    });

    describe('if the network config does not contain a chain ID', () => {
      it('throws', async () => {
        await withController(
          // @ts-expect-error chain ID intentionally omitted
          {
            state: {
              providerConfig: {
                type: NETWORK_TYPES.RPC,
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                nickname: 'something existing',
                rpcPrefs: undefined,
              },
              networkConfigurations: {
                testNetworkConfigurationId1: {
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: toHex(111),
                  ticker: 'TEST',
                  nickname: 'something existing',
                  id: 'testNetworkConfigurationId1',
                  rpcPrefs: undefined,
                },
                testNetworkConfigurationId2: {
                  rpcUrl: 'http://somethingexisting.com',
                  chainId: undefined,
                  ticker: 'something existing',
                  nickname: 'something existing',
                  id: 'testNetworkConfigurationId2',
                  rpcPrefs: undefined,
                },
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            createNetworkClientMock.mockReturnValue(fakeNetworkClient);

            await expect(() =>
              controller.setActiveNetwork('testNetworkConfigurationId2'),
            ).rejects.toThrow(
              'chainId must be provided for custom RPC endpoints',
            );

            expect(createNetworkClientMock).not.toHaveBeenCalled();
            const { provider, blockTracker } =
              controller.getProviderAndBlockTracker();
            expect(provider).toBeNull();
            expect(blockTracker).toBeNull();
          },
        );
      });
    });

    it('overwrites the provider configuration given a networkConfigurationId that matches a configured networkConfiguration', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfiguration: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                nickname: 'something existing',
                id: 'testNetworkConfigurationId',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer-2.com',
                },
              },
            },
          },
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url',
              chainId: toHex(111),
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          await controller.setActiveNetwork('testNetworkConfiguration');

          expect(controller.store.getState().providerConfig).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url',
            chainId: toHex(111),
            ticker: 'TEST',
            nickname: 'something existing',
            id: 'testNetworkConfigurationId',
            rpcPrefs: {
              blockExplorerUrl: 'https://test-block-explorer-2.com',
            },
          });
        },
      );
    });
  });

  describe('setProviderType', () => {
    for (const {
      networkType,
      chainId,
      ticker,
      blockExplorerUrl,
    } of INFURA_NETWORKS) {
      describe(`given a type of "${networkType}"`, () => {
        refreshNetworkTests({
          expectedProviderConfig: buildProviderConfig({
            type: networkType,
          }),
          operation: async (controller) => {
            await controller.setProviderType(networkType);
          },
        });

        it(`overwrites the provider configuration using type: "${networkType}", chainId: "${chainId}", ticker "${ticker}", and blockExplorerUrl "${blockExplorerUrl}", clearing rpcUrl and nickname`, async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  nickname: 'test-chain',
                  ticker: 'TEST',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://test-block-explorer.com',
                  },
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              controller.setProviderType(networkType);

              expect(controller.store.getState().providerConfig).toStrictEqual({
                type: networkType,
                rpcUrl: undefined,
                chainId,
                ticker,
                nickname: undefined,
                rpcPrefs: { blockExplorerUrl },
                id: undefined,
              });
            },
          );
        });
      });
    }

    describe('given a type of "rpc"', () => {
      it('throws', async () => {
        await withController(async ({ controller }) => {
          await expect(() => controller.setProviderType('rpc')).rejects.toThrow(
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
          await expect(() =>
            controller.setProviderType('sadlflaksdj'),
          ).rejects.toThrow(
            new Error('Unknown Infura provider type "sadlflaksdj".'),
          );
        });
      });
    });
  });

  describe('resetConnection', () => {
    [
      NETWORK_TYPES.MAINNET,
      NETWORK_TYPES.GOERLI,
      NETWORK_TYPES.SEPOLIA,
    ].forEach((networkType) => {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        refreshNetworkTests({
          expectedProviderConfig: buildProviderConfig({ type: networkType }),
          initialState: {
            providerConfig: buildProviderConfig({ type: networkType }),
          },
          operation: async (controller) => {
            await controller.resetConnection();
          },
        });
      });
    });

    describe(`when the type in the provider configuration is "rpc"`, () => {
      refreshNetworkTests({
        expectedProviderConfig: buildProviderConfig({
          type: NETWORK_TYPES.RPC,
        }),
        initialState: {
          providerConfig: buildProviderConfig({ type: NETWORK_TYPES.RPC }),
        },
        operation: async (controller) => {
          await controller.resetConnection();
        },
      });
    });
  });

  describe('NetworkController:getProviderConfig action', () => {
    it('returns the provider config in state', async () => {
      await withController(
        {
          state: {
            providerConfig: buildProviderConfig({
              type: NETWORK_TYPES.MAINNET,
            }),
          },
        },
        async ({ messenger }) => {
          const providerConfig = await messenger.call(
            'NetworkController:getProviderConfig',
          );

          expect(providerConfig).toStrictEqual(
            buildProviderConfig({
              type: NETWORK_TYPES.MAINNET,
            }),
          );
        },
      );
    });
  });

  describe('NetworkController:getEthQuery action', () => {
    it('returns a EthQuery object that can be used to make requests to the currently selected network', async () => {
      await withController(async ({ controller, messenger }) => {
        await setFakeProvider(controller, {
          stubs: [
            {
              request: {
                method: 'test_method',
                params: [],
              },
              response: {
                result: 'test response',
              },
            },
          ],
        });

        const ethQuery = messenger.call('NetworkController:getEthQuery');
        assert(ethQuery, 'ethQuery is not set');

        const promisifiedSendAsync = promisify(ethQuery.sendAsync).bind(
          ethQuery,
        );
        const result = await promisifiedSendAsync({
          id: 1,
          jsonrpc: '2.0',
          method: 'test_method',
          params: [],
        });
        expect(result).toBe('test response');
      });
    });

    it('returns undefined if the provider has not been set yet', async () => {
      await withController(({ messenger }) => {
        const ethQuery = messenger.call('NetworkController:getEthQuery');

        expect(ethQuery).toBeUndefined();
      });
    });
  });

  describe('rollbackToPreviousProvider', () => {
    for (const { networkType } of INFURA_NETWORKS) {
      describe(`if the previous provider configuration had a type of "${networkType}"`, () => {
        it('overwrites the the current provider configuration with the previous provider configuration', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x111',
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  rpcUrl: 'https://mock-rpc-url-1',
                  ticker: 'TEST1',
                  nickname: 'test network 1',
                  rpcPrefs: {
                    blockExplorerUrl: 'https://test-block-explorer-1.com',
                  },
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url-2',
                    chainId: '0x222',
                    ticker: 'TEST2',
                    nickname: 'test network 2',
                    rpcPrefs: {
                      blockExplorerUrl: 'https://test-block-explorer-2.com',
                    },
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url-2',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
              expect(controller.store.getState().providerConfig).toStrictEqual({
                type: 'rpc',
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
                nickname: 'test network 2',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer-2.com',
                },
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
                },
              });

              expect(controller.store.getState().providerConfig).toStrictEqual({
                type: networkType,
                chainId: '0x111',
                rpcUrl: 'https://mock-rpc-url-1',
                ticker: 'TEST1',
                nickname: 'test network 1',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer-1.com',
                },
              });
            },
          );
        });

        it('emits networkWillChange', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller, messenger }) => {
              const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkWillChange = await waitForPublishedEvents({
                    messenger,
                    eventType: 'NetworkController:networkWillChange',
                    operation: async () => {
                      await controller.rollbackToPreviousProvider();
                    },
                  });

                  expect(networkWillChange).toBeTruthy();
                },
              });
            },
          );
        });

        it('resets the network status to "unknown" before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                  },
                ]),
                buildFakeProvider(),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
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
                      // Intentionally not awaited because we want to check state
                      // while this operation is in-progress
                      controller.rollbackToPreviousProvider();
                    },
                    beforeResolving: () => {
                      expect(controller.store.getState().networkStatus).toBe(
                        'unknown',
                      );
                    },
                  });
                },
              });
            },
          );
        });

        it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                ]),
                buildFakeProvider(),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
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
                      // Intentionally not awaited because we want to check state
                      // while this operation is in-progress
                      controller.rollbackToPreviousProvider();
                    },
                    beforeResolving: () => {
                      expect(
                        controller.store.getState().networkDetails,
                      ).toStrictEqual({
                        EIPS: {},
                      });
                    },
                  });
                },
              });
            },
          );
        });

        it(`initializes a provider pointed to the "${networkType}" Infura network`, async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider(),
                buildFakeProvider([
                  {
                    request: {
                      method: 'test',
                    },
                    response: {
                      result: 'test response',
                    },
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
                },
              });

              const { provider } = controller.getProviderAndBlockTracker();
              assert(provider, 'Provider is somehow unset');
              const promisifiedSendAsync = promisify(provider.sendAsync).bind(
                provider,
              );
              const response = await promisifiedSendAsync({
                id: '1',
                jsonrpc: '2.0',
                method: 'test',
              });
              expect(response.result).toBe('test response');
            },
          );
        });

        it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
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
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller, messenger }) => {
              const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);

              await controller.setActiveNetwork('testNetworkConfiguration');

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkDidChange = await waitForPublishedEvents({
                    messenger,
                    eventType: 'NetworkController:networkDidChange',
                    operation: async () => {
                      await controller.rollbackToPreviousProvider();
                    },
                  });

                  expect(networkDidChange).toBeTruthy();
                },
              });
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests for the previous network', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller, messenger }) => {
              const fakeProviders = [
                buildFakeProvider(),
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
              const promiseForNoInfuraIsUnblockedEvents =
                waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:infuraIsUnblocked',
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger,
                eventType: 'NetworkController:infuraIsBlocked',
              });

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
                },
              });

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
            },
          );
        });

        it('checks the status of the previous network again and updates state accordingly', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    error: ethErrors.rpc.methodNotFound(),
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: SUCCESSFUL_NET_VERSION_RESPONSE,
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
              expect(controller.store.getState().networkStatus).toBe(
                'unavailable',
              );

              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
                },
              });
              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );
            },
          );
        });

        it('checks whether the previous network supports EIP-1559 again and updates state accordingly', async () => {
          await withController(
            {
              state: {
                providerConfig: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x111',
                },
                networkConfigurations: {
                  testNetworkConfiguration: {
                    id: 'testNetworkConfiguration',
                    rpcUrl: 'https://mock-rpc-url',
                    chainId: '0x222',
                    ticker: 'TEST',
                  },
                },
                networkDetails: {
                  EIPS: {},
                  other: 'details',
                },
              },
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProviders = [
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: PRE_1559_BLOCK,
                    },
                  },
                ]),
                buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    response: {
                      result: POST_1559_BLOCK,
                    },
                  },
                ]),
              ];
              const fakeNetworkClients = [
                buildFakeClient(fakeProviders[0]),
                buildFakeClient(fakeProviders[1]),
              ];
              mockCreateNetworkClient()
                .calledWith({
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x222',
                  type: NetworkClientType.Custom,
                })
                .mockReturnValue(fakeNetworkClients[0])
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClients[1]);
              await controller.setActiveNetwork('testNetworkConfiguration');
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: false,
                },
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // rollbackToPreviousProvider clears networkDetails first, and
                // then updates it to what we expect it to be
                count: 2,
                operation: async () => {
                  await controller.rollbackToPreviousProvider();
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
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                nickname: 'network',
                ticker: 'TEST',
                rpcPrefs: {
                  blockExplorerUrl: 'https://test-block-explorer.com',
                },
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
            expect(controller.store.getState().providerConfig).toStrictEqual({
              type: 'goerli',
              rpcUrl: undefined,
              chainId: '0x5',
              ticker: 'GoerliETH',
              nickname: undefined,
              rpcPrefs: {
                blockExplorerUrl: 'https://goerli.etherscan.io',
              },
              id: undefined,
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().providerConfig).toStrictEqual({
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0x1337',
              nickname: 'network',
              ticker: 'TEST',
              rpcPrefs: {
                blockExplorerUrl: 'https://test-block-explorer.com',
              },
            });
          },
        );
      });

      it('emits networkWillChange', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller, messenger }) => {
            const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkWillChange = await waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:networkWillChange',
                  operation: async () => {
                    await controller.rollbackToPreviousProvider();
                  },
                });

                expect(networkWillChange).toBeTruthy();
              },
            });
          },
        );
      });

      it('resets the network state to "unknown" before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]),
              buildFakeProvider(),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
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
                    // Intentionally not awaited because we want to check state
                    // while this operation is in-progress
                    controller.rollbackToPreviousProvider();
                  },
                  beforeResolving: () => {
                    expect(controller.store.getState().networkStatus).toBe(
                      'unknown',
                    );
                  },
                });
              },
            });
          },
        );
      });

      it('clears EIP-1559 support for the network from state before emitting networkDidChange', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider([
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: {
                    result: POST_1559_BLOCK,
                  },
                },
              ]),
              buildFakeProvider(),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
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
                    // Intentionally not awaited because we want to check state
                    // while this operation is in-progress
                    controller.rollbackToPreviousProvider();
                  },
                  beforeResolving: () => {
                    expect(
                      controller.store.getState().networkDetails,
                    ).toStrictEqual({
                      EIPS: {},
                    });
                  },
                });
              },
            });
          },
        );
      });

      it('initializes a provider pointed to the given RPC URL', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider(),
              buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await controller.rollbackToPreviousProvider();
              },
            });

            const { provider } = controller.getProviderAndBlockTracker();
            assert(provider, 'Provider is somehow unset');
            const promisifiedSendAsync = promisify(provider.sendAsync).bind(
              provider,
            );
            const response = await promisifiedSendAsync({
              id: '1',
              jsonrpc: '2.0',
              method: 'test',
            });
            expect(response.result).toBe('test response');
          },
        );
      });

      it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await controller.rollbackToPreviousProvider();
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
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller, messenger }) => {
            const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkDidChange = await waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:networkDidChange',
                  operation: async () => {
                    await controller.rollbackToPreviousProvider();
                  },
                });

                expect(networkDidChange).toBeTruthy();
              },
            });
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller, messenger }) => {
            const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const infuraIsUnblocked = await waitForPublishedEvents({
                  messenger,
                  eventType: 'NetworkController:infuraIsUnblocked',
                  operation: async () => {
                    await controller.rollbackToPreviousProvider();
                  },
                });

                expect(infuraIsUnblocked).toBeTruthy();
              },
            });
          },
        );
      });

      it('checks the status of the previous network again and updates state accordingly', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  error: ethErrors.rpc.methodNotFound(),
                },
              ]),
              buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
            expect(controller.store.getState().networkStatus).toBe(
              'unavailable',
            );

            await controller.rollbackToPreviousProvider();
            expect(controller.store.getState().networkStatus).toBe('available');
          },
        );
      });

      it('checks whether the previous network supports EIP-1559 again and updates state accordingly', async () => {
        await withController(
          {
            state: {
              providerConfig: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
              networkDetails: {
                EIPS: {},
                other: 'details',
              },
            },
            infuraProjectId: 'some-infura-project-id',
          },
          async ({ controller }) => {
            const fakeProviders = [
              buildFakeProvider([
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: {
                    result: PRE_1559_BLOCK,
                  },
                },
              ]),
              buildFakeProvider([
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: {
                    result: POST_1559_BLOCK,
                  },
                },
              ]),
            ];
            const fakeNetworkClients = [
              buildFakeClient(fakeProviders[0]),
              buildFakeClient(fakeProviders[1]),
            ];
            mockCreateNetworkClient()
              .calledWith({
                network: NETWORK_TYPES.GOERLI,
                infuraProjectId: 'some-infura-project-id',
                type: NetworkClientType.Infura,
              })
              .mockReturnValue(fakeNetworkClients[0])
              .calledWith({
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClients[1]);
            await controller.setProviderType('goerli');
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: false,
              },
            });

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                await controller.rollbackToPreviousProvider();
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
    it('adds the given network configuration when its rpcURL does not match an existing configuration', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'network-configuration-id-1');

      await withController(async ({ controller }) => {
        const rpcUrlNetwork = {
          chainId: toHex(9999),
          rpcUrl: 'https://test-rpc.com',
          ticker: 'RPC',
        };

        expect(controller.store.getState().networkConfigurations).toStrictEqual(
          {},
        );

        await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
          referrer: 'https://test-dapp.com',
          source: 'dapp',
        });

        expect(
          Object.values(controller.store.getState().networkConfigurations),
        ).toStrictEqual(
          expect.arrayContaining([
            {
              ...rpcUrlNetwork,
              nickname: undefined,
              rpcPrefs: undefined,
              id: 'network-configuration-id-1',
            },
          ]),
        );
      });
    });

    it('update a network configuration when the configuration being added has an rpcURL that matches an existing configuration', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://rpc-url.com',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: toHex(1),
                id: 'testNetworkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          await controller.upsertNetworkConfiguration(
            {
              rpcUrl: 'https://rpc-url.com',
              ticker: 'new_rpc_ticker',
              nickname: 'new_rpc_nickname',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: toHex(1),
            },
            { referrer: 'https://test-dapp.com', source: 'dapp' },
          );
          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual(
            expect.arrayContaining([
              {
                rpcUrl: 'https://rpc-url.com',
                nickname: 'new_rpc_nickname',
                ticker: 'new_rpc_ticker',
                rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
                chainId: toHex(1),
                id: 'testNetworkConfigurationId',
              },
            ]),
          );
        },
      );
    });

    it('throws if the given chain ID is not a 0x-prefixed hex number', async () => {
      const invalidChainId = '1';
      await withController(async ({ controller }) => {
        await expect(async () =>
          controller.upsertNetworkConfiguration(
            {
              // @ts-expect-error Intentionally invalid
              chainId: invalidChainId,
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'rpc_url',
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: 'dapp',
            },
          ),
        ).rejects.toThrow(
          new Error(
            `Invalid chain ID "${invalidChainId}": invalid hex string.`,
          ),
        );
      });
    });

    it('throws if the given chain ID is greater than the maximum allowed ID', async () => {
      await withController(async ({ controller }) => {
        await expect(async () =>
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
              source: 'dapp',
            },
          ),
        ).rejects.toThrow(
          new Error(
            'Invalid chain ID "0xFFFFFFFFFFFFFFFF": numerical value greater than max safe value.',
          ),
        );
      });
    });

    it('throws if the no (or a falsy) rpcUrl is passed', async () => {
      await withController(async ({ controller }) => {
        await expect(() =>
          controller.upsertNetworkConfiguration(
            /* @ts-expect-error We are intentionally passing bad input. */
            {
              chainId: toHex(9999),
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: 'dapp',
            },
          ),
        ).rejects.toThrow(
          new Error(
            'An rpcUrl is required to add or update network configuration',
          ),
        );
      });
    });

    it('throws if rpcUrl passed is not a valid Url', async () => {
      await withController(async ({ controller }) => {
        await expect(async () =>
          controller.upsertNetworkConfiguration(
            {
              chainId: toHex(9999),
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              ticker: 'RPC',
              rpcUrl: 'test',
            },
            {
              referrer: 'https://test-dapp.com',
              source: 'dapp',
            },
          ),
        ).rejects.toThrow(new Error('rpcUrl must be a valid URL'));
      });
    });

    it('throws if the no (or a falsy) ticker is passed', async () => {
      await withController(async ({ controller }) => {
        await expect(async () =>
          controller.upsertNetworkConfiguration(
            // @ts-expect-error - we want to test the case where no ticker is present.
            {
              chainId: toHex(5),
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'https://mock-rpc-url',
            },
            {
              referrer: 'https://test-dapp.com',
              source: 'dapp',
            },
          ),
        ).rejects.toThrow(
          new Error(
            'A ticker is required to add or update networkConfiguration',
          ),
        );
      });
    });

    it('throws if an options object is not passed as a second argument', async () => {
      await withController(async ({ controller }) => {
        await expect(async () =>
          // @ts-expect-error - we want to test the case where no second arg is passed.
          controller.upsertNetworkConfiguration({
            chainId: toHex(5),
            nickname: 'RPC',
            rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
            rpcUrl: 'https://mock-rpc-url',
          }),
        ).rejects.toThrow('Cannot read properties of undefined');
      });
    });

    it('throws if referrer and source arguments are not passed', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            providerConfig: {
              type: NETWORK_TYPES.RPC,
              rpcUrl: 'https://mock-rpc-url',
              chainId: toHex(111),
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
                nickname: undefined,
                rpcPrefs: undefined,
              },
            },
          },
          trackMetaMetricsEvent: trackEventSpy,
        },
        async ({ controller }) => {
          const newNetworkConfiguration = {
            rpcUrl: 'https://new-chain-rpc-url',
            chainId: toHex(222),
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          await expect(async () =>
            // @ts-expect-error - we want to test the case where the options object is empty.
            controller.upsertNetworkConfiguration(newNetworkConfiguration, {}),
          ).rejects.toThrow(
            'referrer and source are required arguments for adding or updating a network configuration',
          );
        },
      );
    });

    it('should add the given network if all required properties are present but nither rpcPrefs nor nickname properties are passed', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            networkConfigurations: {},
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: toHex(1),
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
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
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            networkConfigurations: {},
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: toHex(1),
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
            invalidKey: 'new-chain',
            invalidKey2: {},
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual(
            expect.arrayContaining([
              {
                chainId: toHex(1),
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
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId2');
      await withController(
        {
          state: {
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: 'https://test-rpc-url',
                ticker: 'ticker',
                nickname: 'nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: toHex(1),
                id: 'networkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: toHex(1),
            nickname: 'RPC',
            rpcPrefs: undefined,
            rpcUrl: 'https://test-rpc-url-2',
            ticker: 'RPC',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
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
                chainId: toHex(1),
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
                chainId: toHex(1),
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
            chainId: toHex(1),
          };
          await controller.upsertNetworkConfiguration(updatedConfiguration, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
          });
          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://test-rpc-url',
              nickname: 'new_rpc_chainName',
              ticker: 'new_rpc_ticker',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: toHex(1),
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
                chainId: toHex(1),
                id: 'networkConfigurationId',
              },
              networkConfigurationId2: {
                rpcUrl: 'https://test-rpc-url-2',
                ticker: 'ticker-2',
                nickname: 'nickname-2',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: toHex(9999),
                id: 'networkConfigurationId2',
              },
            },
          },
        },
        async ({ controller }) => {
          await controller.upsertNetworkConfiguration(
            {
              rpcUrl: 'https://test-rpc-url',
              ticker: 'new-ticker',
              nickname: 'new-nickname',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: toHex(1),
            },
            {
              referrer: 'https://test-dapp.com',
              source: 'dapp',
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
              chainId: toHex(1),
              id: 'networkConfigurationId',
            },
            {
              rpcUrl: 'https://test-rpc-url-2',
              ticker: 'ticker-2',
              nickname: 'nickname-2',
              rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
              chainId: toHex(9999),
              id: 'networkConfigurationId2',
            },
          ]);
        },
      );
    });

    it('should add the given network and not set it to active if the setActive option is not passed (or a falsy value is passed)', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const originalProvider = {
        type: NETWORK_TYPES.RPC,
        rpcUrl: 'https://mock-rpc-url',
        chainId: toHex(111),
        ticker: 'TEST',
        id: 'testNetworkConfigurationId',
      };
      await withController(
        {
          state: {
            providerConfig: originalProvider,
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
                nickname: undefined,
                rpcPrefs: undefined,
              },
            },
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: toHex(222),
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
          });

          expect(controller.store.getState().providerConfig).toStrictEqual(
            originalProvider,
          );
        },
      );
    });

    it('should add the given network and set it to active if the setActive option is passed as true', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      await withController(
        {
          state: {
            providerConfig: {
              type: NETWORK_TYPES.RPC,
              rpcUrl: 'https://mock-rpc-url',
              chainId: toHex(111),
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
              nickname: undefined,
              rpcPrefs: undefined,
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
                nickname: undefined,
                rpcPrefs: undefined,
              },
            },
          },
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          createNetworkClientMock.mockReturnValue(fakeNetworkClient);
          const rpcUrlNetwork = {
            rpcUrl: 'https://test-rpc-url',
            chainId: toHex(222),
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            setActive: true,
            referrer: 'https://test-dapp.com',
            source: 'dapp',
          });

          expect(controller.store.getState().providerConfig).toStrictEqual({
            type: 'rpc',
            rpcUrl: 'https://test-rpc-url',
            chainId: toHex(222),
            ticker: 'test_ticker',
            id: 'networkConfigurationId',
            nickname: undefined,
            rpcPrefs: undefined,
          });
        },
      );
    });

    it('adds new networkConfiguration to networkController store and calls to the metametrics event tracking with the correct values', async () => {
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            providerConfig: {
              type: NETWORK_TYPES.RPC,
              rpcUrl: 'https://mock-rpc-url',
              chainId: toHex(111),
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
              nickname: undefined,
              rpcPrefs: undefined,
            },
            networkConfigurations: {
              testNetworkConfigurationId: {
                rpcUrl: 'https://mock-rpc-url',
                chainId: toHex(111),
                ticker: 'TEST',
                id: 'testNetworkConfigurationId',
                nickname: undefined,
                rpcPrefs: undefined,
              },
            },
          },
          trackMetaMetricsEvent: trackEventSpy,
        },
        async ({ controller }) => {
          const newNetworkConfiguration = {
            rpcUrl: 'https://new-chain-rpc-url',
            chainId: toHex(222),
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          await controller.upsertNetworkConfiguration(newNetworkConfiguration, {
            referrer: 'https://test-dapp.com',
            source: 'dapp',
          });

          expect(
            Object.values(controller.store.getState().networkConfigurations),
          ).toStrictEqual([
            {
              rpcUrl: 'https://mock-rpc-url',
              chainId: toHex(111),
              ticker: 'TEST',
              id: 'testNetworkConfigurationId',
              nickname: undefined,
              rpcPrefs: undefined,
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
              chain_id: toHex(222),
              symbol: 'NEW',
              source: 'dapp',
            },
          });
        },
      );
    });
  });

  describe('removeNetworkConfigurations', () => {
    it('remove a network configuration', async () => {
      const testNetworkConfigurationId = 'testNetworkConfigurationId';
      await withController(
        {
          state: {
            networkConfigurations: {
              [testNetworkConfigurationId]: {
                rpcUrl: 'https://rpc-url.com',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: toHex(1337),
                id: testNetworkConfigurationId,
              },
            },
          },
        },
        async ({ controller }) => {
          controller.removeNetworkConfiguration(testNetworkConfigurationId);
          expect(
            controller.store.getState().networkConfigurations,
          ).toStrictEqual({});
        },
      );
    });

    it('throws if the networkConfigurationId it is passed does not correspond to a network configuration in state', async () => {
      const testNetworkConfigurationId = 'testNetworkConfigurationId';
      const invalidNetworkConfigurationId = 'invalidNetworkConfigurationId';
      await withController(
        {
          state: {
            networkConfigurations: {
              [testNetworkConfigurationId]: {
                rpcUrl: 'https://rpc-url.com',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_nickname',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: toHex(1337),
                id: testNetworkConfigurationId,
              },
            },
          },
        },
        async ({ controller }) => {
          expect(() =>
            controller.removeNetworkConfiguration(
              invalidNetworkConfigurationId,
            ),
          ).toThrow(
            `networkConfigurationId ${invalidNetworkConfigurationId} does not match a configured networkConfiguration`,
          );
        },
      );
    });
  });
});

/**
 * Creates a mocked version of `createNetworkClient` where multiple mock
 * invocations can be specified. A default implementation is provided so that if
 * none of the actual invocations of the function match the mock invocations
 * then an error will be thrown.
 */
function mockCreateNetworkClient() {
  return when(createNetworkClientMock).mockImplementation((options) => {
    const inspectedOptions = inspect(options, { depth: null, compact: true });
    const lines = [
      `No fake network client was specified for ${inspectedOptions}.`,
      'Make sure to mock this invocation of `createNetworkClient`.',
    ];
    if ('infuraProjectId' in options) {
      lines.push(
        '(You might have forgotten to pass an `infuraProjectId` to `withController`.)',
      );
    }
    throw new Error(lines.join('\n'));
  });
}

/**
 * Test an operation that performs a `#switchNetwork` call with the given
 * provider configuration. All effects of the `#switchNetwork` call should be
 * covered by these tests.
 *
 * @param args - Arguments.
 * @param args.expectedProviderConfig - The provider configuration that the
 * operation is expected to set.
 * @param args.initialState - The initial state of the network controller.
 * @param args.operation - The operation to test.
 */
function refreshNetworkTests({
  expectedProviderConfig,
  initialState,
  operation,
}: {
  expectedProviderConfig: ProviderConfiguration;
  initialState?: Partial<NetworkControllerState>;
  operation: (controller: NetworkController) => Promise<void>;
}) {
  it('emits networkWillChange', async () => {
    await withController(
      {
        state: initialState,
      },
      async ({ controller, messenger }) => {
        const fakeProvider = buildFakeProvider();
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

        const networkWillChange = await waitForPublishedEvents({
          messenger,
          eventType: 'NetworkController:networkWillChange',
          operation: () => {
            // Intentionally not awaited because we're capturing an event
            // emitted partway through the operation
            operation(controller);
          },
        });

        await expect(networkWillChange).toBeTruthy();
      },
    );
  });

  it('emits networkDidChange', async () => {
    await withController(
      {
        state: initialState,
      },
      async ({ controller, messenger }) => {
        const fakeProvider = buildFakeProvider();
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

        const networkDidChange = await waitForPublishedEvents({
          messenger,
          eventType: 'NetworkController:networkDidChange',
          operation: () => {
            // Intentionally not awaited because we're capturing an event
            // emitted partway through the operation
            operation(controller);
          },
        });

        await expect(networkDidChange).toBeTruthy();
      },
    );
  });

  it('clears network id from state', async () => {
    await withController(
      {
        infuraProjectId: 'infura-project-id',
        state: initialState,
      },
      async ({ controller }) => {
        const fakeProvider = buildFakeProvider([
          // Called during provider initialization
          {
            request: {
              method: 'net_version',
            },
            response: {
              result: '1',
            },
          },
          // Called during network lookup after resetting connection.
          // Delayed to ensure that we can check the network id
          // before this resolves.
          {
            delay: 1,
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: {
              result: '0x1',
            },
          },
        ]);
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        createNetworkClientMock.mockReturnValue(fakeNetworkClient);
        await controller.initializeProvider();
        expect(controller.store.getState().networkId).toBe('1');

        await waitForStateChanges({
          controller,
          propertyPath: ['networkDetails'],
          // We only care about the first state change, because it
          // happens before the network lookup
          count: 1,
          operation: () => {
            // Intentionally not awaited because we want to check state
            // partway through the operation
            operation(controller);
          },
        });

        expect(controller.store.getState().networkId).toBeNull();
      },
    );
  });

  it('clears network status from state', async () => {
    await withController(
      {
        infuraProjectId: 'infura-project-id',
        state: initialState,
      },
      async ({ controller }) => {
        const fakeProvider = buildFakeProvider([
          // Called during provider initialization
          {
            request: {
              method: 'net_version',
            },
            response: SUCCESSFUL_NET_VERSION_RESPONSE,
          },
          {
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
          },
          // Called during network lookup after resetting connection.
          // Delayed to ensure that we can check the network status
          // before this resolves.
          {
            delay: 1,
            request: {
              method: 'net_version',
            },
            response: SUCCESSFUL_NET_VERSION_RESPONSE,
          },
          {
            delay: 1,
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
          },
        ]);
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        createNetworkClientMock.mockReturnValue(fakeNetworkClient);
        await controller.initializeProvider();
        expect(controller.store.getState().networkStatus).toBe(
          NetworkStatus.Available,
        );

        await waitForStateChanges({
          controller,
          propertyPath: ['networkStatus'],
          // We only care about the first state change, because it
          // happens before the network lookup
          count: 1,
          operation: () => {
            // Intentionally not awaited because we want to check state
            // partway through the operation
            operation(controller);
          },
        });

        expect(controller.store.getState().networkStatus).toBe(
          NetworkStatus.Unknown,
        );
      },
    );
  });

  it('clears network details from state', async () => {
    await withController(
      {
        infuraProjectId: 'infura-project-id',
        state: initialState,
      },
      async ({ controller }) => {
        const fakeProvider = buildFakeProvider([
          // Called during provider initialization
          {
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: {
              result: '0x1',
            },
          },
          // Called during network lookup after resetting connection.
          // Delayed to ensure that we can check the network details
          // before this resolves.
          {
            delay: 1,
            request: {
              method: 'eth_getBlockByNumber',
            },
            response: {
              result: '0x1',
            },
          },
        ]);
        const fakeNetworkClient = buildFakeClient(fakeProvider);
        createNetworkClientMock.mockReturnValue(fakeNetworkClient);
        await controller.initializeProvider();
        expect(controller.store.getState().networkDetails).toStrictEqual({
          EIPS: {
            1559: false,
          },
        });

        await waitForStateChanges({
          controller,
          propertyPath: ['networkDetails'],
          // We only care about the first state change, because it
          // happens before the network lookup
          count: 1,
          operation: () => {
            // Intentionally not awaited because we want to check state
            // partway through the operation
            operation(controller);
          },
        });

        expect(controller.store.getState().networkDetails).toStrictEqual({
          EIPS: {},
        });
      },
    );
  });

  if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
    it('sets the provider to a custom RPC provider initialized with the RPC target and chain ID', async () => {
      await withController(
        {
          infuraProjectId: 'infura-project-id',
          state: initialState,
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'eth_chainId',
              },
              response: {
                result: toHex(111),
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          createNetworkClientMock.mockReturnValue(fakeNetworkClient);

          await operation(controller);

          expect(createNetworkClientMock).toHaveBeenCalledWith({
            chainId: expectedProviderConfig.chainId,
            rpcUrl: expectedProviderConfig.rpcUrl,
            type: NetworkClientType.Custom,
          });
          const { provider } = controller.getProviderAndBlockTracker();
          assert(provider);
          const promisifiedSendAsync = promisify(provider.sendAsync).bind(
            provider,
          );
          const chainIdResult = await promisifiedSendAsync({
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
          });
          expect(chainIdResult.result).toBe(toHex(111));
        },
      );
    });
  } else {
    it(`sets the provider to an Infura provider pointed to ${expectedProviderConfig.type}`, async () => {
      await withController(
        {
          infuraProjectId: 'infura-project-id',
          state: initialState,
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'eth_chainId',
              },
              response: {
                result: toHex(1337),
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          createNetworkClientMock.mockReturnValue(fakeNetworkClient);

          await operation(controller);

          expect(createNetworkClientMock).toHaveBeenCalledWith({
            network: expectedProviderConfig.type,
            infuraProjectId: 'infura-project-id',
            type: NetworkClientType.Infura,
          });
          const { provider } = controller.getProviderAndBlockTracker();
          assert(provider);
          const promisifiedSendAsync = promisify(provider.sendAsync).bind(
            provider,
          );
          const chainIdResult = await promisifiedSendAsync({
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
          });
          expect(chainIdResult.result).toBe(toHex(1337));
        },
      );
    });
  }

  it('replaces the provider object underlying the provider proxy without creating a new instance of the proxy itself', async () => {
    await withController(
      {
        infuraProjectId: 'infura-project-id',
        state: initialState,
      },
      async ({ controller }) => {
        const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
        const fakeNetworkClients = [
          buildFakeClient(fakeProviders[0]),
          buildFakeClient(fakeProviders[1]),
        ];
        const providerType = controller.store.getState().providerConfig.type;
        const initializationNetworkClientOptions: Parameters<
          typeof createNetworkClient
        >[0] =
          providerType === NETWORK_TYPES.RPC
            ? {
                chainId: controller.store.getState().providerConfig.chainId,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                rpcUrl: controller.store.getState().providerConfig.rpcUrl!,
                type: NetworkClientType.Custom,
              }
            : {
                network: providerType,
                infuraProjectId: 'infura-project-id',
                type: NetworkClientType.Infura,
              };
        const operationNetworkClientOptions: Parameters<
          typeof createNetworkClient
        >[0] =
          expectedProviderConfig.type === NETWORK_TYPES.RPC
            ? {
                chainId: toHex(expectedProviderConfig.chainId),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                rpcUrl: expectedProviderConfig.rpcUrl!,
                type: NetworkClientType.Custom,
              }
            : {
                network: expectedProviderConfig.type,
                infuraProjectId: 'infura-project-id',
                type: NetworkClientType.Infura,
              };
        mockCreateNetworkClient()
          .calledWith(initializationNetworkClientOptions)
          .mockReturnValue(fakeNetworkClients[0])
          .calledWith(operationNetworkClientOptions)
          .mockReturnValue(fakeNetworkClients[1]);
        await controller.initializeProvider();
        const { provider: providerBefore } =
          controller.getProviderAndBlockTracker();

        await operation(controller);

        const { provider: providerAfter } =
          controller.getProviderAndBlockTracker();
        expect(providerBefore).toBe(providerAfter);
      },
    );
  });

  lookupNetworkTests({ expectedProviderConfig, initialState, operation });
}

/**
 * Test an operation that performs a `lookupNetwork` call with the given
 * provider configuration. All effects of the `lookupNetwork` call should be
 * covered by these tests.
 *
 * @param args - Arguments.
 * @param args.expectedProviderConfig - The provider configuration that the
 * operation is expected to set.
 * @param args.initialState - The initial state of the network controller.
 * @param args.operation - The operation to test.
 */
function lookupNetworkTests({
  expectedProviderConfig,
  initialState,
  operation,
}: {
  expectedProviderConfig: ProviderConfiguration;
  initialState?: Partial<NetworkControllerState>;
  operation: (controller: NetworkController) => Promise<void>;
}) {
  describe('if the network ID and network details requests resolve successfully', () => {
    const validNetworkIds = [12345, '12345', toHex(12345)];
    for (const networkId of validNetworkIds) {
      describe(`with a network id of '${networkId}'`, () => {
        describe('if the current network is different from the network in state', () => {
          it('updates the network in state to match', async () => {
            await withController(
              {
                state: initialState,
              },
              async ({ controller }) => {
                await setFakeProvider(controller, {
                  stubs: [
                    {
                      request: { method: 'net_version' },
                      response: { result: networkId },
                    },
                  ],
                  stubLookupNetworkWhileSetting: true,
                });

                await operation(controller);

                expect(controller.store.getState().networkId).toBe('12345');
              },
            );
          });
        });

        describe('if the version of the current network is the same as that in state', () => {
          it('does not change network ID in state', async () => {
            await withController(
              {
                state: initialState,
              },
              async ({ controller }) => {
                await setFakeProvider(controller, {
                  stubs: [
                    {
                      request: { method: 'net_version' },
                      response: { result: networkId },
                    },
                  ],
                  stubLookupNetworkWhileSetting: true,
                });

                await operation(controller);

                await expect(controller.store.getState().networkId).toBe(
                  '12345',
                );
              },
            );
          });
        });
      });
    }

    describe('if the network details of the current network are different from the network details in state', () => {
      it('updates the network in state to match', async () => {
        await withController(
          {
            state: {
              ...initialState,
              networkDetails: {
                EIPS: {
                  1559: false,
                },
              },
            },
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  response: {
                    result: {
                      baseFeePerGas: '0x1',
                    },
                  },
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });
          },
        );
      });
    });

    describe('if the network details of the current network are the same as the network details in state', () => {
      it('does not change network details in state', async () => {
        await withController(
          {
            state: {
              ...initialState,
              networkDetails: {
                EIPS: {
                  1559: true,
                },
              },
            },
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  response: {
                    result: {
                      baseFeePerGas: '0x1',
                    },
                  },
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
            });
          },
        );
      });
    });

    it('emits infuraIsUnblocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsUnblocked',
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });

  describe('if an RPC error is encountered while retrieving the version of the current network', () => {
    it('updates the network in state to "unavailable"', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                error: ethErrors.rpc.limitExceeded('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          await operation(controller);

          expect(controller.store.getState().networkStatus).toBe('unavailable');
        },
      );
    });

    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: ethErrors.rpc.limitExceeded('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: ethErrors.rpc.limitExceeded('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                error: ethErrors.rpc.limitExceeded('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });

  describe('if a country blocked error is encountered while retrieving the version of the current network', () => {
    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('updates the network in state to "unknown"', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkStatus).toBe('unknown');
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsBlocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('updates the network in state to "blocked"', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkStatus).toBe('blocked');
          },
        );
      });

      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });

      it('emits infuraIsBlocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsBlocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }
  });

  describe('if an internal error is encountered while retrieving the version of the current network', () => {
    it('updates the network in state to "unknown"', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                error: ethErrors.rpc.internal('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          await operation(controller);

          expect(controller.store.getState().networkStatus).toBe('unknown');
        },
      );
    });

    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: ethErrors.rpc.internal('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  error: ethErrors.rpc.internal('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                error: ethErrors.rpc.internal('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });

  describe('if an invalid network ID is returned', () => {
    it('updates the network in state to "unknown"', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                response: { result: 'invalid' },
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          await operation(controller);

          expect(controller.store.getState().networkStatus).toBe('unknown');
        },
      );
    });

    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  response: { result: 'invalid' },
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: { method: 'net_version' },
                  response: { result: 'invalid' },
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: { method: 'net_version' },
                response: { result: 'invalid' },
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });

  describe('if an RPC error is encountered while retrieving the network details of the current network', () => {
    it('updates the network in state to "unavailable"', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: {
                  method: 'eth_getBlockByNumber',
                  params: ['latest', false],
                },
                error: ethErrors.rpc.limitExceeded('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          await operation(controller);

          expect(controller.store.getState().networkStatus).toBe('unavailable');
        },
      );
    });

    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: ethErrors.rpc.limitExceeded('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: ethErrors.rpc.limitExceeded('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: {
                  method: 'eth_getBlockByNumber',
                  params: ['latest', false],
                },
                error: ethErrors.rpc.limitExceeded('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });

  describe('if a country blocked error is encountered while retrieving the network details of the current network', () => {
    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('updates the network in state to "unknown"', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkStatus).toBe('unknown');
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsBlocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('updates the network in state to "blocked"', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            await operation(controller);

            expect(controller.store.getState().networkStatus).toBe('blocked');
          },
        );
      });

      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });

      it('emits infuraIsBlocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsBlocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }
  });

  describe('if an internal error is encountered while retrieving the network details of the current network', () => {
    it('updates the network in state to "unknown"', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: {
                  method: 'eth_getBlockByNumber',
                  params: ['latest', false],
                },
                error: ethErrors.rpc.internal('some error'),
              },
            ],
          });

          await operation(controller);

          expect(controller.store.getState().networkStatus).toBe('unknown');
        },
      );
    });

    if (expectedProviderConfig.type === NETWORK_TYPES.RPC) {
      it('emits infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: ethErrors.rpc.internal('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    } else {
      it('does not emit infuraIsUnblocked', async () => {
        await withController(
          {
            state: initialState,
          },
          async ({ controller, messenger }) => {
            await setFakeProvider(controller, {
              stubs: [
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                    params: ['latest', false],
                  },
                  error: ethErrors.rpc.internal('some error'),
                },
              ],
              stubLookupNetworkWhileSetting: true,
            });

            const payloads = await waitForPublishedEvents({
              messenger,
              eventType: 'NetworkController:infuraIsUnblocked',
              count: 0,
              operation: async () => {
                await operation(controller);
              },
            });

            expect(payloads).toBeTruthy();
          },
        );
      });
    }

    it('does not emit infuraIsBlocked', async () => {
      await withController(
        {
          state: initialState,
        },
        async ({ controller, messenger }) => {
          await setFakeProvider(controller, {
            stubs: [
              {
                request: {
                  method: 'eth_getBlockByNumber',
                  params: ['latest', false],
                },
                error: ethErrors.rpc.internal('some error'),
              },
            ],
            stubLookupNetworkWhileSetting: true,
          });

          const payloads = await waitForPublishedEvents({
            messenger,
            eventType: 'NetworkController:infuraIsBlocked',
            count: 0,
            operation: async () => {
              await operation(controller);
            },
          });

          expect(payloads).toBeTruthy();
        },
      );
    });
  });
}

/**
 * Builds a controller messenger.
 *
 * @returns The controller messenger.
 */
function buildMessenger() {
  return new ControllerMessenger<
    NetworkControllerAction,
    NetworkControllerEvent
  >();
}

/**
 * Build a restricted controller messenger for the network controller.
 *
 * @param messenger - A controller messenger.
 * @returns The network controller restricted messenger.
 */
function buildNetworkControllerMessenger(messenger = buildMessenger()) {
  return messenger.getRestricted({
    name: 'NetworkController',
    allowedActions: [
      'NetworkController:getProviderConfig',
      'NetworkController:getEthQuery',
    ],
    allowedEvents: [
      'NetworkController:networkDidChange',
      'NetworkController:networkWillChange',
      'NetworkController:infuraIsBlocked',
      'NetworkController:infuraIsUnblocked',
    ],
  });
}

/**
 * The callback that `withController` takes.
 */
type WithControllerCallback<ReturnValue> = ({
  controller,
}: {
  controller: NetworkController;
  messenger: ControllerMessenger<
    NetworkControllerAction,
    NetworkControllerEvent
  >;
}) => Promise<ReturnValue> | ReturnValue;

/**
 * A partial form of the options that `NetworkController` takes.
 */
type WithControllerOptions = Partial<NetworkControllerOptions>;

/**
 * The arguments that `withController` takes.
 */
type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [
      Omit<WithControllerOptions, 'messenger'>,
      WithControllerCallback<ReturnValue>,
    ];

/**
 * Builds a controller based on the given options, and calls the given function
 * with that controller.
 *
 * @param args - Either a function, or an options bag + a function. The options
 * bag is equivalent to the options that NetworkController takes (although
 * `messenger` and `infuraProjectId` are  filled in if not given); the function
 * will be called with the built controller.
 * @returns Whatever the callback returns.
 */
async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
  const messenger = buildMessenger();
  const restrictedMessenger = buildNetworkControllerMessenger(messenger);
  const controller = new NetworkController({
    messenger: restrictedMessenger,
    trackMetaMetricsEvent: jest.fn(),
    infuraProjectId: 'infura-project-id',
    ...rest,
  });
  try {
    return await fn({ controller, messenger });
  } finally {
    await controller.destroy();
  }
}

/**
 * Builds a complete ProviderConfig object, filling in values that are not
 * provided with defaults.
 *
 * @param config - An incomplete ProviderConfig object.
 * @returns The complete ProviderConfig object.
 */
function buildProviderConfig(
  config: Partial<ProviderConfiguration> = {},
): ProviderConfiguration {
  if (config.type && config.type !== NETWORK_TYPES.RPC) {
    const networkConfig = INFURA_NETWORKS.find(
      ({ networkType }) => networkType === config.type,
    );
    if (!networkConfig) {
      throw new Error(`Invalid type: ${config.type}`);
    }
    return {
      ...networkConfig,
      // This is redundant with the spread operation below, but this was
      // required for TypeScript to understand that this property was set to an
      // Infura type.
      type: config.type,
      ...config,
    };
  }
  return {
    type: NETWORK_TYPES.RPC,
    chainId: '0x42',
    nickname: undefined,
    rpcUrl: 'http://doesntmatter.com',
    ...config,
  };
}

/**
 * Builds an object that `createInfuraProvider` or `createJsonRpcClient` returns.
 *
 * @param provider - provider to use if you dont want the defaults
 * @returns The object.
 */
function buildFakeClient(
  provider: SafeEventEmitterProvider = buildFakeProvider(),
) {
  return {
    provider,
    blockTracker: new FakeBlockTracker({ provider }),
  };
}

/**
 * Builds fake provider engine object that `createMetamaskProvider` returns,
 * with canned responses optionally provided for certain RPC methods.
 *
 * @param stubs - The list of RPC methods you want to stub along with their
 * responses.
 * @returns The object.
 */
function buildFakeProvider(stubs: FakeProviderStub[] = []) {
  const completeStubs = stubs.slice();
  if (!stubs.some((stub) => stub.request.method === 'eth_getBlockByNumber')) {
    completeStubs.unshift({
      request: {
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      },
      response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
      discardAfterMatching: false,
    });
  }
  if (!stubs.some((stub) => stub.request.method === 'net_version')) {
    completeStubs.unshift({
      request: { method: 'net_version' },
      response: SUCCESSFUL_NET_VERSION_RESPONSE,
      discardAfterMatching: false,
    });
  }
  return new FakeProvider({ stubs: completeStubs });
}

/**
 * Asks the controller to set the provider in the simplest way, stubbing the
 * provider appropriately so as not to cause any errors to be thrown. This is
 * useful in tests where it doesn't matter how the provider gets set, just that
 * it does. Canned responses may be optionally provided for certain RPC methods
 * on the provider.
 *
 * @param controller - The network controller.
 * @param options - Additional options.
 * @param options.stubs - The set of RPC methods you want to stub on the
 * provider along with their responses.
 * @param options.stubLookupNetworkWhileSetting - Whether to stub the call to
 * `lookupNetwork` that happens when the provider is set. This option is useful
 * in tests that need a provider to get set but also call `lookupNetwork` on
 * their own. In this case, since the `providerConfig` setter already calls
 * `lookupNetwork` once, and since `lookupNetwork` is called out of band, the
 * test may run with unexpected results. By stubbing `lookupNetwork` before
 * setting the provider, the test is free to explicitly call it.
 * @returns The set provider.
 */
async function setFakeProvider(
  controller: NetworkController,
  {
    stubs = [],
    stubLookupNetworkWhileSetting = false,
  }: {
    stubs?: FakeProviderStub[];
    stubLookupNetworkWhileSetting?: boolean;
  } = {},
): Promise<void> {
  const fakeProvider = buildFakeProvider(stubs);
  const fakeNetworkClient = buildFakeClient(fakeProvider);
  createNetworkClientMock.mockReturnValue(fakeNetworkClient);
  const lookupNetworkMock = jest.spyOn(controller, 'lookupNetwork');

  if (stubLookupNetworkWhileSetting) {
    lookupNetworkMock.mockResolvedValue(undefined);
  }

  await controller.initializeProvider();
  assert(controller.getProviderAndBlockTracker().provider);

  if (stubLookupNetworkWhileSetting) {
    lookupNetworkMock.mockRestore();
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
 * @param args - The arguments.
 * @param args.controller - The network controller.
 * @param args.operation - The function that presumably involves
 * `lookupNetwork`.
 */
async function withoutCallingLookupNetwork({
  controller,
  operation,
}: {
  controller: NetworkController;
  operation: () => void | Promise<void>;
}) {
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
 * @param args - The arguments.
 * @param args.controller - The network controller.
 * @param args.operation - The function that presumably involves
 * `getEIP1559Compatibility`.
 */
async function withoutCallingGetEIP1559Compatibility({
  controller,
  operation,
}: {
  controller: NetworkController;
  operation: () => void | Promise<void>;
}) {
  const spy = jest
    .spyOn(controller, 'getEIP1559Compatibility')
    .mockResolvedValue(false);
  await operation();
  spy.mockRestore();
}

/**
 * Waits for changes to the primary observable store of a controller to occur
 * before proceeding. May be called with a function, in which case waiting will
 * occur after the function is called; or may be called standalone if you want
 * to assert that no state changes occurred.
 *
 * @param args - The arguments.
 * @param args.controller - The network controller.
 * @param args.propertyPath - The path of the property you expect the state
 * changes to concern.
 * @param args.count - The number of events you expect to occur. If null, this
 * function will wait until no events have occurred in `wait` number of
 * milliseconds. Default: 1.
 * @param args.duration - The amount of time in milliseconds to wait for the
 * expected number of filtered state changes to occur before resolving the
 * promise that this function returns (default: 150).
 * @param args.operation - A function to run that will presumably produce the
 * state changes in question.
 * @param args.beforeResolving - In some tests, state updates happen so fast, we
 * need to make an assertion immediately after the event in question occurs.
 * However, if we wait until the promise this function returns resolves to do
 * so, some other state update to the same
 * property may have happened. This option allows you to make an assertion
 * _before_ the promise resolves. This has the added benefit of allowing you to
 * maintain the "arrange, act, assert" ordering in your test, meaning that you
 * can still call the method that kicks off the event and then make the
 * assertion afterward instead of the other way around.
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
  beforeResolving = async () => {
    // do nothing
  },
}: {
  controller: NetworkController;
  propertyPath: string[];
  count?: number | null;
  duration?: number;
  operation?: () => void | Promise<void>;
  beforeResolving?: () => void | Promise<void>;
}) {
  const initialState = { ...controller.store.getState() };
  let isTimerRunning = false;

  const promiseForStateChanges = new Promise((resolve, reject) => {
    // We need to declare this variable first, then assign it later, so that
    // ESLint won't complain that resetTimer is referring to this variable
    // before it's declared. And we need to use let so that we can assign it
    // below.
    /* eslint-disable-next-line prefer-const */
    let eventListener: (...args: any[]) => void;
    let timer: NodeJS.Timeout | undefined;
    const allStates: NetworkControllerState[] = [];
    const interestingStates: NetworkControllerState[] = [];

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      isTimerRunning = false;
    };

    async function end() {
      stopTimer();

      controller.store.unsubscribe(eventListener);

      await beforeResolving();

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
    }

    const resetTimer = () => {
      stopTimer();
      timer = setTimeout(() => {
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
        propertyPath,
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
 * Waits for controller events to be emitted before proceeding.
 *
 * @param args - The arguments to this function.
 * @param args.messenger - The messenger suited for NetworkController.
 * @param args.eventType - The type of NetworkController event you want to wait
 * for.
 * @param args.count - The number of events you expect to occur (default: 1).
 * @param args.filter - A function used to discard events that are not of
 * interest.
 * @param args.wait - The amount of time in milliseconds to wait for the
 * expected number of filtered events to occur before resolving the promise that
 * this function returns (default: 150).
 * @param args.operation - A function to run that will presumably produce the
 * events in question.
 * @param args.beforeResolving - In some tests, state updates happen so fast, we
 * need to make an assertion immediately after the event in question occurs.
 * However, if we wait until the promise this function returns resolves to do
 * so, some other state update to the same
 * property may have happened. This option allows you to make an assertion
 * _before_ the promise resolves. This has the added benefit of allowing you to
 * maintain the "arrange, act, assert" ordering in your test, meaning that you
 * can still call the method that kicks off the event and then make the
 * assertion afterward instead of the other way around.
 * @returns A promise that resolves to the list of payloads for the set of
 * events, optionally filtered, when a specific number of them have occurred.
 */
async function waitForPublishedEvents<E extends NetworkControllerEvent>({
  messenger,
  eventType,
  count: expectedNumberOfEvents = 1,
  filter: isEventPayloadInteresting = () => true,
  wait: timeBeforeAssumingNoMoreEvents = 150,
  operation = () => {
    // do nothing
  },
  beforeResolving = async () => {
    // do nothing
  },
}: {
  messenger: ControllerMessenger<never, NetworkControllerEvent>;
  eventType: E['type'];
  count?: number;
  filter?: (payload: E['payload']) => boolean;
  wait?: number;
  operation?: () => void | Promise<void>;
  beforeResolving?: () => void | Promise<void>;
}): Promise<E['payload'][]> {
  const promiseForEventPayloads = new Promise<E['payload'][]>(
    (resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      const allEventPayloads: E['payload'][] = [];
      const interestingEventPayloads: E['payload'][] = [];
      let alreadyEnded = false;

      // We're using `any` here because there seems to be some mismatch between
      // the signature of `subscribe` and the way that we're using it. Try
      // changing `any` to either `((...args: E['payload']) => void)` or
      // `ExtractEventHandler<E, E['type']>` to see the issue.
      const eventListener: any = (...payload: E['payload']) => {
        allEventPayloads.push(payload);

        if (isEventPayloadInteresting(payload)) {
          interestingEventPayloads.push(payload);
          if (interestingEventPayloads.length === expectedNumberOfEvents) {
            stopTimer();
            end();
          } else {
            resetTimer();
          }
        }
      };

      async function end() {
        if (!alreadyEnded) {
          alreadyEnded = true;
          messenger.unsubscribe(eventType, eventListener);

          await beforeResolving();

          if (interestingEventPayloads.length === expectedNumberOfEvents) {
            resolve(interestingEventPayloads);
          } else {
            // Using a string instead of an Error leads to better backtraces.
            /* eslint-disable-next-line prefer-promise-reject-errors */
            reject(
              `Expected to receive ${expectedNumberOfEvents} ${eventType} event(s), but received ${
                interestingEventPayloads.length
              } after ${timeBeforeAssumingNoMoreEvents}ms.\n\nAll payloads:\n\n${inspect(
                allEventPayloads,
                { depth: null },
              )}`,
            );
          }
        }
      }

      function stopTimer() {
        if (timer) {
          clearTimeout(timer);
        }
      }

      function resetTimer() {
        stopTimer();
        timer = setTimeout(() => {
          end();
        }, timeBeforeAssumingNoMoreEvents);
      }

      messenger.subscribe(eventType, eventListener);
      resetTimer();
    },
  );

  if (operation) {
    await operation();
  }

  return await promiseForEventPayloads;
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
 * @param args - The arguments.
 * @param args.controller - The network controller.
 * @param args.numberOfNetworkDetailsChanges - The number of times that
 * `networkDetails` is expected to be updated.
 * @param args.operation - The function that presumably involves
 * `lookupNetwork`.
 */
async function waitForLookupNetworkToComplete({
  controller,
  numberOfNetworkDetailsChanges = null,
  operation,
}: {
  controller: NetworkController;
  numberOfNetworkDetailsChanges?: number | null;
  operation: () => void | Promise<void>;
}) {
  await waitForStateChanges({
    controller,
    propertyPath: ['networkDetails'],
    operation,
    count: numberOfNetworkDetailsChanges,
  });
}

/**
 * Returns whether two places in different state objects have different values.
 *
 * @param currentState - The current state object.
 * @param prevState - The previous state object.
 * @param propertyPath - A property path within both objects.
 * @returns True or false, depending on the result.
 */
function isStateChangeInteresting(
  currentState: Record<PropertyKey, unknown>,
  prevState: Record<PropertyKey, unknown>,
  propertyPath: PropertyKey[],
): boolean {
  return !isDeepStrictEqual(
    get(currentState, propertyPath),
    get(prevState, propertyPath),
  );
}
