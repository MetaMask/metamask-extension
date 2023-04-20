import { inspect, isDeepStrictEqual, promisify } from 'util';
import assert from 'assert';
import { get } from 'lodash';
import { v4 } from 'uuid';
import nock from 'nock';
import { ControllerMessenger } from '@metamask/base-controller';
import { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import { when, resetAllWhenMocks } from 'jest-when';
import { ethErrors } from 'eth-rpc-errors';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { MetaMetricsNetworkEventSource } from '../../../../shared/constants/metametrics';
import {
  NetworkController,
  NetworkControllerEvent,
  NetworkControllerEventType,
  NetworkControllerOptions,
  NetworkControllerState,
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
// const providerFromEngineMock = jest.mocked(providerFromEngine);
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
 * A dummy value for the `projectId` option that `createInfuraClient` needs.
 * (Infura should not be hit during tests, but just in case, this should not
 * refer to a real project ID.)
 */
const DEFAULT_INFURA_PROJECT_ID = 'fake-infura-project-id';

/**
 * The networks that NetworkController recognizes as built-in Infura networks,
 * along with information we expect to be true for those networks.
 */
const INFURA_NETWORKS = [
  {
    networkType: NETWORK_TYPES.MAINNET,
    chainId: '0x1',
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    networkType: NETWORK_TYPES.GOERLI,
    chainId: '0x5',
    ticker: 'GoerliETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    networkType: NETWORK_TYPES.SEPOLIA,
    chainId: '0xaa36a7',
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
  });

  describe('constructor', () => {
    const invalidInfuraProjectIds = [undefined, null, {}, 1];
    invalidInfuraProjectIds.forEach((invalidProjectId) => {
      it(`throws if an invalid Infura ID of "${inspect(
        invalidProjectId,
      )}" is provided`, () => {
        expect(
          // @ts-expect-error We are intentionally passing bad input.
          () => new NetworkController({ infuraProjectId: invalidProjectId }),
        ).toThrow('Invalid Infura project ID');
      });
    });

    it('accepts initial state', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'http://example-custom-rpc.metamask.io',
              chainId: '0x9999' as const,
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
      const controller = new NetworkController(
        buildDefaultNetworkControllerOptions(),
      );

      expect(await controller.destroy()).toBeUndefined();
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
        expect(blockTracker.isRunning()).toBeTruthy();

        await controller.destroy();

        expect(blockTracker.isRunning()).toBe(false);
      });
    });
  });

  describe('initializeProvider', () => {
    it('throws if the provider configuration is invalid', async () => {
      const invalidProviderConfig = {};
      await withController(
        /* @ts-expect-error We're intentionally passing bad input. */
        {
          state: {
            provider: invalidProviderConfig,
          },
        },
        async ({ controller }) => {
          await expect(async () => {
            await controller.initializeProvider();
          }).rejects.toThrow(
            'NetworkController - #configureProvider - unknown type "undefined"',
          );
        },
      );
    });

    for (const { networkType } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        it(`initializes a provider pointed to the "${networkType}" Infura network`, async () => {
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
              infuraProjectId: 'some-infura-project-id',
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient()
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClient);

              await controller.initializeProvider();

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

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID
                  // of the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              const infuraIsUnblocked = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsUnblocked,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              expect(infuraIsUnblocked).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              expect(controller.store.getState().networkStatus).toBe('unknown');

              await controller.initializeProvider();

              expect(controller.store.getState().networkStatus).toBe(
                'available',
              );
            },
          );
        });

        it('determines whether the network supports EIP-1559 and stores the result in state without overwriting other state in the networkDetails store', async () => {
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
                chainId: '0x1337',
                rpcUrl: 'https://mock-rpc-url',
                ticker: 'TEST',
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'test',
                },
                response: {
                  result: 'test response',
                },
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient()
              .calledWith({
                chainId: '0x1337',
                rpcUrl: 'https://mock-rpc-url',
                type: NetworkClientType.Custom,
              })
              .mockReturnValue(fakeNetworkClient);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            await controller.initializeProvider();

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

      it('emits infuraIsUnblocked', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
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
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const infuraIsUnblocked = await waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsUnblocked,
              operation: async () => {
                await controller.initializeProvider();
              },
            });

            expect(infuraIsUnblocked).toBeTruthy();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0xtest',
                ticker: 'TEST',
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
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsBlocked,
              count: 0,
              operation: async () => {
                await controller.initializeProvider();
              },
            });

            expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
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
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
                provider: {
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
              provider: {
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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          { messenger: restrictedMessenger },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const promiseForNoInfuraIsUnblockedEvents = waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsUnblocked,
              count: 0,
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          { messenger: restrictedMessenger },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsBlocked,
              count: 0,
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
          },
        );
      });
    });

    describe('if the provider has initialized, but the current network has no chainId', () => {
      it('does not update state in any way', async () => {
        await withController(
          /* @ts-expect-error We are intentionally not including a chainId in the provider config. */
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          /* @ts-expect-error We are intentionally not including a chainId in the provider config. */
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'http://example-custom-rpc.metamask.io',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();

            const promiseForNoInfuraIsUnblockedEvents = waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsUnblocked,
              count: 0,
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
          },
        );
      });

      it('does not emit infuraIsBlocked', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          /* @ts-expect-error We are intentionally not including a chainId in the provider config. */
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'http://example-custom-rpc.metamask.io',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();

            const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsBlocked,
              count: 0,
              operation: async () => {
                await controller.lookupNetwork();
              },
            });

            expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
          },
        );
      });
    });

    INFURA_NETWORKS.forEach(({ networkType }) => {
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
              async ({ controller }) => {
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'net_version',
                    },
                    response: {
                      result: '1',
                    },
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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

                expect(controller.store.getState().networkId).toBe('1');
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
                ).toBeTruthy();
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
            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
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
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const infuraIsUnblocked = await waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(infuraIsUnblocked).toBeTruthy();
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
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
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
                expect(controller.store.getState().networkId).toBeNull();
              },
            );
          });

          it('clears whether the network supports EIP-1559 from state along with any other network details', async () => {
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const infuraIsBlocked = await waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsBlocked,
                  operation: async () => {
                    await controller.lookupNetwork();
                  },
                });

                expect(infuraIsBlocked).toBeTruthy();
              },
            );
          });

          it('does not emit infuraIsUnblocked', async () => {
            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: BLOCKED_INFURA_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForNoInfuraIsUnblockedEvents =
                  waitForPublishedEvents({
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.InfuraIsUnblocked,
                    count: 0,
                    operation: async () => {
                      await controller.lookupNetwork();
                    },
                  });

                expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
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
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: ethErrors.rpc.methodNotFound(),
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
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
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
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
                      result: '2',
                    },
                  },
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
                expect(controller.store.getState().networkId).toBeNull();
              },
            );
          });

          it('clears whether the network supports EIP-1559 from state along with any other network details', async () => {
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
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForNoInfuraIsBlockedEvents =
                  waitForPublishedEvents({
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.InfuraIsBlocked,
                    count: 0,
                    operation: async () => {
                      await controller.lookupNetwork();
                    },
                  });

                expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
              },
            );
          });

          it('does not emit infuraIsUnblocked', async () => {
            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID of
                    // the network selected, it just needs to exist
                    chainId: '0x9999999',
                  },
                },
              },
              async ({ controller }) => {
                const fakeProvider = buildFakeProvider([
                  {
                    request: {
                      method: 'eth_getBlockByNumber',
                    },
                    error: GENERIC_JSON_RPC_ERROR,
                  },
                ]);
                const fakeNetworkClient = buildFakeClient(fakeProvider);
                mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
                await withoutCallingLookupNetwork({
                  controller,
                  operation: async () => {
                    await controller.initializeProvider();
                  },
                });

                const promiseForNoInfuraIsUnblockedEvents =
                  waitForPublishedEvents({
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.InfuraIsUnblocked,
                    count: 0,
                    operation: async () => {
                      await controller.lookupNetwork();
                    },
                  });

                expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
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

            const { unrestrictedMessenger, restrictedMessenger } =
              buildMessengerGroup();

            await withController(
              {
                messenger: restrictedMessenger,
                state: {
                  provider: {
                    type: networkType,
                    // NOTE: This doesn't need to match the logical chain ID
                    // of the network selected, it just needs to exist
                    chainId: '0x9999999',
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
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.InfuraIsUnblocked,
                    count: 0,
                  });
                const promiseForInfuraIsBlocked = waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsBlocked,
                });

                await controller.lookupNetwork();

                expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
                expect(await promiseForInfuraIsBlocked).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: {
                    result: '42',
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
              ).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsUnblocked,
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(infuraIsUnblocked).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: ethErrors.rpc.methodNotFound(),
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: {
                    result: '42',
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('42');

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

        it('clears whether the network supports EIP-1559 from state along with any other network details', async () => {
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                {
                  request: {
                    method: 'net_version',
                  },
                  error: GENERIC_JSON_RPC_ERROR,
                },
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
              await waitForStateChanges({
                controller,
                propertyPath: ['networkStatus'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: false,
                },
                other: 'details',
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  error: GENERIC_JSON_RPC_ERROR,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
                count: 0,
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
            },
          );
        });

        it('emits infuraIsUnblocked', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  error: GENERIC_JSON_RPC_ERROR,
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  response: SUCCESSFUL_ETH_GET_BLOCK_BY_NUMBER_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsUnblocked,
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: {
                    result: '42',
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
                    result: '42',
                  },
                },
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  error: GENERIC_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await waitForStateChanges({
                controller,
                propertyPath: ['networkId'],
                operation: async () => {
                  await controller.initializeProvider();
                },
              });
              expect(controller.store.getState().networkId).toBe('42');

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

        it('clears whether the network supports EIP-1559 from state along with any other network details', async () => {
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
                  other: 'details',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const promiseForNoInfuraIsBlockedEvents = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
                count: 0,
                operation: async () => {
                  await controller.lookupNetwork();
                },
              });

              expect(await promiseForNoInfuraIsBlockedEvents).toBeTruthy();
            },
          );
        });

        it('emits infuraIsUnblocked', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
                  error: GENERIC_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await withoutCallingLookupNetwork({
                controller,
                operation: async () => {
                  await controller.initializeProvider();
                },
              });

              const infuraIsUnblocked = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsUnblocked,
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
                provider: {
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
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
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
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
                provider: {
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
                provider: {
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
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
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
              });

              await controller.lookupNetwork();

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
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
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

          await expect(() =>
            controller.setActiveNetwork('invalid-network-configuration-id'),
          ).rejects.toThrow(
            new Error(
              'networkConfigurationId invalid-network-configuration-id does not match a configured networkConfiguration',
            ),
          );
        },
      );
    });

    it('overwrites the provider configuration given a networkConfigurationId that matches a configured networkConfiguration', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
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
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x222',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          await controller.setActiveNetwork('testNetworkConfiguration');

          expect(controller.store.getState().provider).toStrictEqual({
            id: 'testNetworkConfiguration',
            type: 'rpc',
            rpcUrl: 'https://mock-rpc-url-2',
            chainId: '0x222',
            ticker: 'TEST2',
            nickname: 'test network 2',
            rpcPrefs: {
              blockExplorerUrl: 'https://test-block-explorer-2.com',
            },
          });
        },
      );
    });

    it('emits networkWillChange before making any changes to the network status', async () => {
      const { unrestrictedMessenger, restrictedMessenger } =
        buildMessengerGroup();

      await withController(
        {
          messenger: restrictedMessenger,
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST1',
            },
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
              },
            },
          },
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
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[0])
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x222',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[1]);
          await waitForLookupNetworkToComplete({
            controller,
            operation: async () => {
              await controller.initializeProvider();
            },
          });
          const initialNetworkStatus =
            controller.store.getState().networkStatus;
          expect(initialNetworkStatus).toBe('available');

          const networkWillChange = await waitForPublishedEvents({
            messenger: unrestrictedMessenger,
            eventType: NetworkControllerEventType.NetworkWillChange,
            operation: () => {
              // Intentionally not awaited because we're checking state
              // partway through the operation
              controller.setActiveNetwork('testNetworkConfiguration');
            },
            beforeResolving: () => {
              expect(controller.store.getState().networkStatus).toBe(
                initialNetworkStatus,
              );
            },
          });
          expect(networkWillChange).toBeTruthy();
        },
      );
    });

    it('resets the network status to "unknown" before emitting networkDidChange', async () => {
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST1',
            },
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
              },
            },
          },
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
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[0])
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x222',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[1]);
          await controller.initializeProvider();
          expect(controller.store.getState().networkStatus).toBe('available');

          await waitForStateChanges({
            controller,
            propertyPath: ['networkStatus'],
            // We only care about the first state change, because it happens
            // before networkDidChange
            count: 1,
            operation: () => {
              // Intentionally not awaited because we're checking state
              // partway through the operation.
              controller.setActiveNetwork('testNetworkConfiguration');
            },
            beforeResolving: () => {
              expect(controller.store.getState().networkStatus).toBe('unknown');
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
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST1',
            },
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
              },
            },
            networkDetails: {
              EIPS: {},
              other: 'details',
            },
          },
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
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[0])
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x222',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[1]);
          await controller.initializeProvider();
          expect(controller.store.getState().networkDetails).toStrictEqual({
            EIPS: {
              1559: true,
            },
            other: 'details',
          });

          await waitForStateChanges({
            controller,
            propertyPath: ['networkDetails'],
            // We only care about the first state change, because it happens
            // before networkDidChange
            count: 1,
            operation: () => {
              // Intentionally not awaited because we're checking state
              // partway through the operation
              controller.setActiveNetwork('testNetworkConfiguration');
            },
            beforeResolving: () => {
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: undefined,
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
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
            {
              request: {
                method: 'test',
              },
              response: {
                result: 'test response',
              },
            },
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0x1337',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          await controller.setActiveNetwork('testNetworkConfiguration');

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
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              ticker: 'TEST1',
            },
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url-2',
                chainId: '0x222',
                ticker: 'TEST2',
              },
            },
          },
        },
        async ({ controller }) => {
          const fakeProviders = [buildFakeProvider(), buildFakeProvider()];
          const fakeNetworkClients = [
            buildFakeClient(fakeProviders[0]),
            buildFakeClient(fakeProviders[1]),
          ];
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-1',
              chainId: '0x111',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[0])
            .calledWith({
              rpcUrl: 'https://mock-rpc-url-2',
              chainId: '0x222',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClients[1]);
          await controller.initializeProvider();
          const { provider: providerBefore } =
            controller.getProviderAndBlockTracker();

          await controller.setActiveNetwork('testNetworkConfiguration');

          const { provider: providerAfter } =
            controller.getProviderAndBlockTracker();
          expect(providerBefore).toBe(providerAfter);
        },
      );
    });

    it('emits networkDidChange', async () => {
      const { unrestrictedMessenger, restrictedMessenger } =
        buildMessengerGroup();

      await withController(
        {
          messenger: restrictedMessenger,
          state: {
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
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
              chainId: '0x1337',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          const networkDidChange = await waitForPublishedEvents({
            messenger: unrestrictedMessenger,
            eventType: NetworkControllerEventType.NetworkDidChange,
            operation: async () => {
              await controller.setActiveNetwork('testNetworkConfiguration');
            },
          });

          expect(networkDidChange).toBeTruthy();
        },
      );
    });

    it('emits infuraIsUnblocked', async () => {
      const { unrestrictedMessenger, restrictedMessenger } =
        buildMessengerGroup();

      await withController(
        {
          messenger: restrictedMessenger,
          state: {
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
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
              chainId: '0x1337',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          const infuraIsUnblocked = await waitForPublishedEvents({
            messenger: unrestrictedMessenger,
            eventType: NetworkControllerEventType.InfuraIsUnblocked,
            operation: async () => {
              await controller.setActiveNetwork('testNetworkConfiguration');
            },
          });

          expect(infuraIsUnblocked).toBeTruthy();
        },
      );
    });

    it('determines the status of the network, storing it in state', async () => {
      await withController(
        {
          state: {
            networkConfigurations: {
              testNetworkConfiguration: {
                id: 'testNetworkConfiguration',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
                ticker: 'TEST',
              },
            },
          },
        },
        async ({ controller }) => {
          const fakeProvider = buildFakeProvider([
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
          ]);
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0x1337',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          await controller.setActiveNetwork('testNetworkConfiguration');

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
                chainId: '0x1337',
                ticker: 'TEST',
              },
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
          mockCreateNetworkClient()
            .calledWith({
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0x1337',
              type: NetworkClientType.Custom,
            })
            .mockReturnValue(fakeNetworkClient);

          await controller.setActiveNetwork('testNetworkConfigurationId');

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
    for (const {
      networkType,
      chainId,
      ticker,
      blockExplorerUrl,
    } of INFURA_NETWORKS) {
      describe(`given a type of "${networkType}"`, () => {
        it(`overwrites the provider configuration using type: "${networkType}", chainId: "${chainId}", ticker "${ticker}", and blockExplorerUrl "${blockExplorerUrl}", clearing rpcUrl and nickname`, async () => {
          await withController(
            {
              state: {
                provider: {
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

              expect(controller.store.getState().provider).toStrictEqual({
                type: networkType,
                rpcUrl: '',
                chainId,
                ticker,
                nickname: '',
                rpcPrefs: { blockExplorerUrl },
              });
            },
          );
        });

        it('emits networkWillChange', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            { messenger: restrictedMessenger },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              const networkWillChange = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.NetworkWillChange,
                operation: () => {
                  // Intentionally not awaited because we're capturing an event
                  // emitted partway through the operation
                  controller.setProviderType(networkType);
                },
              });

              expect(networkWillChange).toBeTruthy();
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
                  chainId: '0x1337',
                  ticker: 'TEST',
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
                  chainId: '0x1337',
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
                  // Intentionally not awaited because we're checking the state
                  // partway through the operation
                  controller.setProviderType(networkType);
                },
                beforeResolving: () => {
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
                  chainId: '0x1337',
                  ticker: 'TEST',
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
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
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
              expect(controller.store.getState().networkDetails).toStrictEqual({
                EIPS: {
                  1559: true,
                },
                other: 'details',
              });

              await waitForStateChanges({
                controller,
                propertyPath: ['networkDetails'],
                // We only care about the first state change, because it
                // happens before networkDidChange
                count: 1,
                operation: () => {
                  // Intentionally not awaited because we're checking the state
                  // partway through the operation
                  controller.setProviderType(networkType);
                },
                beforeResolving: () => {
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

        it(`initializes a provider pointed to the "${networkType}" Infura network`, async () => {
          await withController(
            { infuraProjectId: 'some-infura-project-id' },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient()
                .calledWith({
                  network: networkType,
                  infuraProjectId: 'some-infura-project-id',
                  type: NetworkClientType.Infura,
                })
                .mockReturnValue(fakeNetworkClient);

              await controller.setProviderType(networkType);

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
                provider: {
                  type: 'rpc',
                  rpcUrl: 'https://mock-rpc-url',
                  chainId: '0x1337',
                  ticker: 'TEST',
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
                  chainId: '0x1337',
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
              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();

              await controller.setProviderType(networkType);

              const { provider: providerAfter } =
                controller.getProviderAndBlockTracker();
              expect(providerBefore).toBe(providerAfter);
            },
          );
        });

        it('emits networkDidChange', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            { messenger: restrictedMessenger },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              const networkDidChange = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.NetworkDidChange,
                operation: async () => {
                  await controller.setProviderType(networkType);
                },
              });

              expect(networkDidChange).toBeTruthy();
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            { messenger: restrictedMessenger },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              const promiseForNoInfuraIsUnblockedEvents =
                waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
              });

              await controller.setProviderType(networkType);

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
            },
          );
        });

        it('determines the status of the network, storing it in state', async () => {
          await withController(async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
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
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            await controller.setProviderType(networkType);

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

              await controller.setProviderType(networkType);

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
    for (const { networkType } of INFURA_NETWORKS) {
      describe(`when the type in the provider configuration is "${networkType}"`, () => {
        it('emits networkWillChange', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              const networkWillChange = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.NetworkWillChange,
                operation: () => {
                  // Intentionally not awaited because we want to capture an
                  // event emitted partway throught this operation
                  controller.resetConnection();
                },
              });

              expect(networkWillChange).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'net_version',
                  },
                  response: SUCCESSFUL_NET_VERSION_RESPONSE,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
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
                  // Intentionally not awaited because we want to capture a
                  // state change made partway through the operation
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
                  // Intentionally not awaited because we want to check state
                  // partway through the operation
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

        it(`initializes a new provider object pointed to the current Infura network (type: "${networkType}")`, async () => {
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'test',
                  },
                  response: {
                    result: 'test response',
                  },
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              await controller.resetConnection();

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
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              await controller.initializeProvider();
              const { provider: providerBefore } =
                controller.getProviderAndBlockTracker();

              await controller.resetConnection();

              const { provider: providerAfter } =
                controller.getProviderAndBlockTracker();
              expect(providerBefore).toBe(providerAfter);
            },
          );
        });

        it('emits networkDidChange', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider();
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              const networkDidChange = await waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.NetworkDidChange,
                operation: async () => {
                  await controller.resetConnection();
                },
              });

              expect(networkDidChange).toBeTruthy();
            },
          );
        });

        it('emits infuraIsBlocked or infuraIsUnblocked, depending on whether Infura is blocking requests', async () => {
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
                  type: networkType,
                  // NOTE: This doesn't need to match the logical chain ID of
                  // the network selected, it just needs to exist
                  chainId: '0x9999999',
                },
              },
            },
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
                {
                  request: {
                    method: 'eth_getBlockByNumber',
                  },
                  error: BLOCKED_INFURA_JSON_RPC_ERROR,
                },
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
              const promiseForNoInfuraIsUnblockedEvents =
                waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
              });

              await controller.resetConnection();

              expect(await promiseForNoInfuraIsUnblockedEvents).toBeTruthy();
              expect(await promiseForInfuraIsBlocked).toBeTruthy();
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
            async ({ controller }) => {
              const fakeProvider = buildFakeProvider([
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
              ]);
              const fakeNetworkClient = buildFakeClient(fakeProvider);
              mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

              await controller.resetConnection();

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
                networkDetails: {
                  EIPS: {},
                  other: 'details',
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

              await controller.resetConnection();

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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const networkWillChange = await waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.NetworkWillChange,
              operation: () => {
                // Intentionally not awaited because we're capturing an event
                // emitted partway through the operation
                controller.resetConnection();
              },
            });

            expect(networkWillChange).toBeTruthy();
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
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'net_version',
                },
                response: SUCCESSFUL_NET_VERSION_RESPONSE,
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();
            expect(controller.store.getState().networkStatus).toBe('available');

            await waitForStateChanges({
              controller,
              propertyPath: ['networkStatus'],
              // We only care about the first state change, because it happens
              // before networkDidChange
              count: 1,
              operation: () => {
                // Intentionally not awaited because we want to check state
                // partway through the operation
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
                chainId: '0x1337',
              },
              networkDetails: {
                EIPS: {},
                other: 'details',
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
            expect(controller.store.getState().networkDetails).toStrictEqual({
              EIPS: {
                1559: true,
              },
              other: 'details',
            });

            await waitForStateChanges({
              controller,
              propertyPath: ['networkDetails'],
              // We only care about the first state change, because it happens
              // before networkDidChange
              count: 1,
              operation: () => {
                // Intentionally not awaited because we want to check state
                // partway through the operation
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

      it('initializes a new provider object pointed to the same RPC URL as the current network', async () => {
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
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
              {
                request: {
                  method: 'test',
                },
                response: {
                  result: 'test response',
                },
              },
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            await controller.resetConnection();

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
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
            await controller.initializeProvider();
            const { provider: providerBefore } =
              controller.getProviderAndBlockTracker();

            await controller.resetConnection();

            const { provider: providerAfter } =
              controller.getProviderAndBlockTracker();
            expect(providerBefore).toBe(providerAfter);
          },
        );
      });

      it('emits networkDidChange', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const networkDidChange = await waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.NetworkDidChange,
              operation: async () => {
                await controller.resetConnection();
              },
            });

            expect(networkDidChange).toBeTruthy();
          },
        );
      });

      it('emits infuraIsUnblocked', async () => {
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
                type: 'rpc',
                rpcUrl: 'https://mock-rpc-url',
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider();
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            const infuraIsUnblocked = await waitForPublishedEvents({
              messenger: unrestrictedMessenger,
              eventType: NetworkControllerEventType.InfuraIsUnblocked,
              operation: async () => {
                await controller.resetConnection();
              },
            });

            expect(infuraIsUnblocked).toBeTruthy();
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
                chainId: '0x1337',
              },
            },
          },
          async ({ controller }) => {
            const fakeProvider = buildFakeProvider([
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
            ]);
            const fakeNetworkClient = buildFakeClient(fakeProvider);
            mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);

            await controller.resetConnection();

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
                chainId: '0x1337',
              },
              networkDetails: {
                EIPS: {},
                other: 'details',
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

            await controller.resetConnection();

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
    for (const { networkType } of INFURA_NETWORKS) {
      describe(`if the previous provider configuration had a type of "${networkType}"`, () => {
        it('overwrites the the current provider configuration with the previous provider configuration', async () => {
          await withController(
            {
              state: {
                provider: {
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
              expect(controller.store.getState().provider).toStrictEqual({
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

              expect(controller.store.getState().provider).toStrictEqual({
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
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

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkWillChange = await waitForPublishedEvents({
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.NetworkWillChange,
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
                provider: {
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
                provider: {
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
                        EIPS: {
                          1559: undefined,
                        },
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
                provider: {
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
                provider: {
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
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

              await waitForLookupNetworkToComplete({
                controller,
                operation: async () => {
                  const networkDidChange = await waitForPublishedEvents({
                    messenger: unrestrictedMessenger,
                    eventType: NetworkControllerEventType.NetworkDidChange,
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
          const { unrestrictedMessenger, restrictedMessenger } =
            buildMessengerGroup();

          await withController(
            {
              messenger: restrictedMessenger,
              state: {
                provider: {
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
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
                  count: 0,
                });
              const promiseForInfuraIsBlocked = waitForPublishedEvents({
                messenger: unrestrictedMessenger,
                eventType: NetworkControllerEventType.InfuraIsBlocked,
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
                provider: {
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
                provider: {
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
              provider: {
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
              operation: async () => {
                await controller.rollbackToPreviousProvider();
              },
            });
            expect(controller.store.getState().provider).toStrictEqual({
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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
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

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkWillChange = await waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.NetworkWillChange,
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
              provider: {
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
              provider: {
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
                      EIPS: {
                        1559: undefined,
                      },
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
              provider: {
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
              provider: {
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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
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

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const networkDidChange = await waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.NetworkDidChange,
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
        const { unrestrictedMessenger, restrictedMessenger } =
          buildMessengerGroup();

        await withController(
          {
            messenger: restrictedMessenger,
            state: {
              provider: {
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

            await waitForLookupNetworkToComplete({
              controller,
              operation: async () => {
                const infuraIsUnblocked = await waitForPublishedEvents({
                  messenger: unrestrictedMessenger,
                  eventType: NetworkControllerEventType.InfuraIsUnblocked,
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
              provider: {
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
              provider: {
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
    it('throws if the given chain ID is not a 0x-prefixed hex number', async () => {
      const invalidChainId = '1';
      await withController(async ({ controller }) => {
        await expect(() =>
          controller.upsertNetworkConfiguration(
            {
              /* @ts-expect-error We are intentionally passing bad input. */
              chainId: invalidChainId,
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'rpc_url',
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: MetaMetricsNetworkEventSource.Dapp,
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
        await expect(() =>
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
              source: MetaMetricsNetworkEventSource.Dapp,
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
              chainId: '0x9999',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              ticker: 'RPC',
            },
            {
              referrer: 'https://test-dapp.com',
              source: MetaMetricsNetworkEventSource.Dapp,
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
        await expect(() =>
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
              source: MetaMetricsNetworkEventSource.Dapp,
            },
          ),
        ).rejects.toThrow(new Error('rpcUrl must be a valid URL'));
      });
    });

    it('throws if the no (or a falsy) ticker is passed', async () => {
      await withController(async ({ controller }) => {
        await expect(() =>
          controller.upsertNetworkConfiguration(
            /* @ts-expect-error We are intentionally passing bad input. */
            {
              chainId: '0x5',
              nickname: 'RPC',
              rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
              rpcUrl: 'https://mock-rpc-url',
            },
            {
              referrer: 'https://test-dapp.com',
              source: MetaMetricsNetworkEventSource.Dapp,
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
        await expect(() =>
          /* @ts-expect-error We are intentionally passing bad input. */
          controller.upsertNetworkConfiguration({
            chainId: '0x5',
            nickname: 'RPC',
            rpcPrefs: { blockExplorerUrl: 'test-block-explorer.com' },
            rpcUrl: 'https://mock-rpc-url',
          }),
        ).rejects.toThrow(
          new Error(
            "Cannot read properties of undefined (reading 'setActive')",
          ),
        );
      });
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
            chainId: '0x1' as const,
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
            chainId: '0x1' as const,
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
            invalidKey: 'new-chain',
            invalidKey2: {},
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
                chainId: '0x1',
                id: 'networkConfigurationId',
              },
            },
          },
        },
        async ({ controller }) => {
          const rpcUrlNetwork = {
            chainId: '0x1' as const,
            nickname: 'RPC',
            rpcPrefs: undefined,
            rpcUrl: 'https://test-rpc-url-2',
            ticker: 'RPC',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
            chainId: '0x1' as const,
          };
          await controller.upsertNetworkConfiguration(updatedConfiguration, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
          await controller.upsertNetworkConfiguration(
            {
              rpcUrl: 'https://test-rpc-url',
              ticker: 'new-ticker',
              nickname: 'new-nickname',
              rpcPrefs: { blockExplorerUrl: 'alternativetestchainscan.io' },
              chainId: '0x1',
            },
            {
              referrer: 'https://test-dapp.com',
              source: MetaMetricsNetworkEventSource.Dapp,
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
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const originalProvider = {
        type: NETWORK_TYPES.RPC,
        rpcUrl: 'https://mock-rpc-url',
        chainId: '0xtest' as const,
        ticker: 'TEST',
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
            chainId: '0x1' as const,
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
          });

          expect(controller.store.getState().provider).toStrictEqual(
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
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
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
          const fakeProvider = buildFakeProvider();
          const fakeNetworkClient = buildFakeClient(fakeProvider);
          mockCreateNetworkClient().mockReturnValue(fakeNetworkClient);
          const rpcUrlNetwork = {
            chainId: '0x1' as const,
            rpcUrl: 'https://test-rpc-url',
            ticker: 'test_ticker',
          };

          await controller.upsertNetworkConfiguration(rpcUrlNetwork, {
            setActive: true,
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
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
            chainId: '0x9999' as const,
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          await controller.upsertNetworkConfiguration(newNetworkConfiguration, {
            referrer: 'https://test-dapp.com',
            source: MetaMetricsNetworkEventSource.Dapp,
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
      uuidV4Mock.mockImplementationOnce(() => 'networkConfigurationId');
      const trackEventSpy = jest.fn();
      await withController(
        {
          state: {
            provider: {
              type: 'rpc',
              rpcUrl: 'https://mock-rpc-url',
              chainId: '0xtest',
              ticker: 'TEST',
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
            chainId: '0x9999' as const,
            ticker: 'NEW',
            nickname: 'new-chain',
            rpcPrefs: { blockExplorerUrl: 'https://block-explorer' },
          };

          await expect(() =>
            /* @ts-expect-error We are intentionally passing bad input. */
            controller.upsertNetworkConfiguration(newNetworkConfiguration, {}),
          ).rejects.toThrow(
            'referrer and source are required arguments for adding or updating a network configuration',
          );
        },
      );
    });
  });

  describe('removeNetworkConfigurations', () => {
    it('removes a network configuration', async () => {
      const networkConfigurationId = 'testNetworkConfigurationId';
      await withController(
        {
          state: {
            networkConfigurations: {
              [networkConfigurationId]: {
                id: networkConfigurationId,
                rpcUrl: 'https://test-rpc-url',
                ticker: 'old_rpc_ticker',
                nickname: 'old_rpc_chainName',
                rpcPrefs: { blockExplorerUrl: 'testchainscan.io' },
                chainId: '0x1',
              },
            },
          },
        },
        async ({ controller }) => {
          controller.removeNetworkConfiguration(networkConfigurationId);

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
                chainId: '0x1',
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
 * Builds the set of controller messengers that recognizes the events that
 * NetworkController emits: one designed to be used directly by
 * NetworkController, and one designed to be used in tests.
 *
 * @returns The controller messenger.
 */
function buildMessengerGroup() {
  const unrestrictedMessenger = new ControllerMessenger<
    never,
    NetworkControllerEvent
  >();
  const restrictedMessenger = unrestrictedMessenger.getRestricted<
    'NetworkController',
    never,
    NetworkControllerEventType
  >({
    name: 'NetworkController',
    allowedEvents: [
      NetworkControllerEventType.NetworkDidChange,
      NetworkControllerEventType.NetworkWillChange,
      NetworkControllerEventType.InfuraIsBlocked,
      NetworkControllerEventType.InfuraIsUnblocked,
    ],
  });
  return { unrestrictedMessenger, restrictedMessenger };
}

/**
 * Despite the signature of its constructor, NetworkController must take an
 * Infura project ID. The object that this function returns is mixed into the
 * options first when a NetworkController is instantiated in tests.
 *
 * @returns The controller options.
 */
function buildDefaultNetworkControllerOptions() {
  const { restrictedMessenger } = buildMessengerGroup();
  return {
    messenger: restrictedMessenger,
    infuraProjectId: DEFAULT_INFURA_PROJECT_ID,
    trackMetaMetricsEvent: jest.fn(),
  };
}

/**
 * The callback that `withController` takes.
 */
type WithControllerCallback<ReturnValue> = ({
  controller,
}: {
  controller: NetworkController;
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
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

/**
 * Builds a controller based on the given options, and calls the given function
 * with that controller.
 *
 * @param args - Either a function, or an options bag + a function. The options
 * bag is equivalent to the options that NetworkController takes (although
 * `messenger` is filled in if not given); the function will be called with the
 * built controller.
 * @returns Whatever the callback returns.
 */
async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [givenNetworkControllerOptions, fn] =
    args.length === 2 ? args : [{}, args[0]];
  const networkControllerOptions = {
    ...buildDefaultNetworkControllerOptions(),
    ...givenNetworkControllerOptions,
  };
  const controller = new NetworkController(networkControllerOptions);
  try {
    return await fn({ controller });
  } finally {
    await controller.destroy();
  }
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
