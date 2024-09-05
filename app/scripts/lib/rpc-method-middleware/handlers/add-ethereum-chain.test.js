import { ethErrors } from 'eth-rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import addEthereumChain from './add-ethereum-chain';

const NON_INFURA_CHAIN_ID = '0x123456789';

const createMockMainnetConfiguration = () => ({
  chainId: CHAIN_IDS.MAINNET,
  nickname: 'Ethereum Mainnet',
  rpcUrl: 'https://mainnet.infura.io/v3/',
  type: NETWORK_TYPES.MAINNET,
  ticker: 'ETH',
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
  },
});

const createMockOptimismConfiguration = () => ({
  chainId: CHAIN_IDS.OPTIMISM,
  nickname: 'Optimism',
  rpcUrl: 'https://optimism.llamarpc.com',
  rpcPrefs: {
    blockExplorerUrl: 'https://optimistic.etherscan.io',
  },
  ticker: 'ETH',
});

const createMockNonInfuraConfiguration = () => ({
  chainId: NON_INFURA_CHAIN_ID,
  rpcUrl: 'https://custom.network',
  ticker: 'CUST',
  nickname: 'Custom Network',
  rpcPrefs: {
    blockExplorerUrl: 'https://custom.blockexplorer',
  },
});

describe('addEthereumChainHandler', () => {
  const addEthereumChainHandler = addEthereumChain.implementation;

  const makeMocks = ({
    permissionedChainIds = [],
    permissionsFeatureFlagIsActive,
    overrides = {},
  } = {}) => {
    return {
      getChainPermissionsFeatureFlag: () => permissionsFeatureFlagIsActive,
      getCurrentChainIdForDomain: jest
        .fn()
        .mockReturnValue(NON_INFURA_CHAIN_ID),
      setNetworkClientIdForDomain: jest.fn(),
      findNetworkConfigurationBy: jest
        .fn()
        .mockReturnValue(createMockMainnetConfiguration()),
      setActiveNetwork: jest.fn(),
      getCurrentRpcUrl: jest
        .fn()
        .mockReturnValue(createMockMainnetConfiguration().rpcUrl),
      requestUserApproval: jest.fn().mockResolvedValue(123),
      requestPermittedChainsPermission: jest.fn(),
      getCaveat: jest.fn().mockReturnValue({ value: permissionedChainIds }),
      upsertNetworkConfiguration: jest.fn().mockResolvedValue(123),
      startApprovalFlow: () => ({ id: 'approvalFlowId' }),
      endApprovalFlow: jest.fn(),
      ...overrides,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with `endowment:permitted-chains` permissioning inactive', () => {
    it('creates a new network configuration for the given chainid and switches to it if none exists', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive: false,
      });
      await addEthereumChainHandler(
        {
          origin: 'example.com',
          params: [
            {
              chainId: CHAIN_IDS.OPTIMISM,
              chainName: 'Optimism Mainnet',
              rpcUrls: ['https://optimism.llamarpc.com'],
              nativeCurrency: {
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://optimistic.etherscan.io'],
              iconUrls: ['https://optimism.icon.com'],
            },
          ],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );

      // called twice, once for the add and once for the switch
      expect(mocks.requestUserApproval).toHaveBeenCalledTimes(2);
      expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
      expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledWith(
        {
          chainId: CHAIN_IDS.OPTIMISM,
          nickname: 'Optimism Mainnet',
          rpcUrl: 'https://optimism.llamarpc.com',
          ticker: 'ETH',
          rpcPrefs: {
            blockExplorerUrl: 'https://optimistic.etherscan.io',
          },
        },
        { referrer: 'example.com', source: 'dapp' },
      );
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
    });

    it('creates a new networkConfiguration when called without "blockExplorerUrls" property', async () => {
      const mocks = makeMocks({
        permissionsFeatureFlagIsActive: false,
      });
      await addEthereumChainHandler(
        {
          origin: 'example.com',
          params: [
            {
              chainId: CHAIN_IDS.OPTIMISM,
              chainName: 'Optimism Mainnet',
              rpcUrls: ['https://optimism.llamarpc.com'],
              nativeCurrency: {
                symbol: 'ETH',
                decimals: 18,
              },
              iconUrls: ['https://optimism.icon.com'],
            },
          ],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );
      expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      it('creates a new network configuration for the given chainid and switches to it if proposed networkConfiguration has a different rpcUrl from all existing networkConfigurations', async () => {
        const mocks = makeMocks({
          permissionsFeatureFlagIsActive: false,
          overrides: {
            upsertNetworkConfiguration: jest.fn().mockResolvedValue(123456),
          },
        });
        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: CHAIN_IDS.MAINNET,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://eth.llamarpc.com'],
                nativeCurrency: {
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://etherscan.io'],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          mocks,
        );

        expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123456);
      });

      it('switches to the existing networkConfiguration if the proposed networkConfiguration has the same rpcUrl as an existing networkConfiguration and the currently selected network doesnt match the requested one', async () => {
        const mocks = makeMocks({
          permissionsFeatureFlagIsActive: false,
          overrides: {
            getCurrentRpcUrl: jest
              .fn()
              .mockReturnValue(createMockNonInfuraConfiguration().rpcUrl),
            getCurrentChainIdForDomain: jest
              .fn()
              .mockReturnValue(createMockNonInfuraConfiguration().chainId),
            findNetworkConfigurationBy: jest
              .fn()
              .mockImplementation(({ chainId }) => {
                switch (chainId) {
                  case createMockNonInfuraConfiguration().chainId:
                    return createMockNonInfuraConfiguration();
                  case createMockOptimismConfiguration().chainId:
                    return createMockOptimismConfiguration();
                  default:
                    return undefined;
                }
              }),
            upsertNetworkConfiguration: jest.fn().mockResolvedValue(123),
          },
        });

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: createMockOptimismConfiguration().chainId,
                chainName: createMockOptimismConfiguration().nickname,
                rpcUrls: [createMockOptimismConfiguration().rpcUrl],
                nativeCurrency: {
                  symbol: createMockOptimismConfiguration().ticker,
                  decimals: 18,
                },
                blockExplorerUrls: [
                  createMockOptimismConfiguration().rpcPrefs.blockExplorerUrl,
                ],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          mocks,
        );

        expect(mocks.requestUserApproval).toHaveBeenCalledTimes(1);
        expect(mocks.requestUserApproval).toHaveBeenCalledWith({
          origin: 'example.com',
          requestData: {
            fromNetworkConfiguration: createMockNonInfuraConfiguration(),
            toNetworkConfiguration: {
              chainId: '0xa',
              nickname: 'Optimism',
              rpcPrefs: {
                blockExplorerUrl: 'https://optimistic.etherscan.io',
              },
              rpcUrl: 'https://optimism.llamarpc.com',
              ticker: 'ETH',
            },
          },
          type: 'wallet_switchEthereumChain',
        });
        expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
          createMockOptimismConfiguration().id,
        );
      });

      it('should return error for invalid chainId', async () => {
        const mocks = makeMocks({
          permissionsFeatureFlagIsActive: false,
        });
        const mockEnd = jest.fn();

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [{ chainId: 'invalid_chain_id' }],
          },
          {},
          jest.fn(),
          mockEnd,
          mocks,
        );

        expect(mockEnd).toHaveBeenCalledWith(
          ethErrors.rpc.invalidParams({
            message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
          }),
        );
      });
    });
  });

  describe('with `endowment:permitted-chains` permissioning active', () => {
    it('creates a new network configuration for the given chainid, requests `endowment:permitted-chains` permission and switches to it if no networkConfigurations with the same chainId exist', async () => {
      const mocks = makeMocks({
        permissionedChainIds: [],
        permissionsFeatureFlagIsActive: true,
      });
      await addEthereumChainHandler(
        {
          origin: 'example.com',
          params: [
            {
              chainId: createMockNonInfuraConfiguration().chainId,
              chainName: createMockNonInfuraConfiguration().nickname,
              rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
              nativeCurrency: {
                symbol: createMockNonInfuraConfiguration().ticker,
                decimals: 18,
              },
              blockExplorerUrls: [
                createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
              ],
            },
          ],
        },
        {},
        jest.fn(),
        jest.fn(),
        mocks,
      );

      expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledWith(
        createMockNonInfuraConfiguration(),
        { referrer: 'example.com', source: 'dapp' },
      );
      expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledTimes(1);
      expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledWith([
        createMockNonInfuraConfiguration().chainId,
      ]);
      expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
      expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      describe('if the proposed networkConfiguration has a different rpcUrl from the one already in state', () => {
        it('create a new networkConfiguration and switches to it without requesting permissions, if the requested chainId has `endowment:permitted-chains` permission granted for requesting origin', async () => {
          const mocks = makeMocks({
            permissionedChainIds: [CHAIN_IDS.MAINNET],
            permissionsFeatureFlagIsActive: true,
          });

          await addEthereumChainHandler(
            {
              origin: 'example.com',
              params: [
                {
                  chainId: CHAIN_IDS.MAINNET,
                  chainName: 'Ethereum Mainnet',
                  rpcUrls: ['https://eth.llamarpc.com'],
                  nativeCurrency: {
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://etherscan.io'],
                },
              ],
            },
            {},
            jest.fn(),
            jest.fn(),
            mocks,
          );

          expect(mocks.requestUserApproval).toHaveBeenCalledTimes(1);
          expect(mocks.requestPermittedChainsPermission).not.toHaveBeenCalled();
          expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
          expect(mocks.setActiveNetwork).toHaveBeenCalledWith(123);
        });

        it('create a new networkConfiguration, requests permissions and switches to it, if the requested chainId does not have permittedChains permission granted for requesting origin', async () => {
          const mocks = makeMocks({
            permissionsFeatureFlagIsActive: true,
            permissionedChainIds: [],
            overrides: {
              findNetworkConfigurationBy: jest
                .fn()
                .mockReturnValue(createMockNonInfuraConfiguration()),
              getCurrentChainIdForDomain: jest
                .fn()
                .mockReturnValue(CHAIN_IDS.MAINNET),
            },
          });

          await addEthereumChainHandler(
            {
              origin: 'example.com',
              params: [
                {
                  chainId: NON_INFURA_CHAIN_ID,
                  chainName: 'Custom Network',
                  rpcUrls: ['https://new-custom.network'],
                  nativeCurrency: {
                    symbol: 'CUST',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://custom.blockexplorer'],
                },
              ],
            },
            {},
            jest.fn(),
            jest.fn(),
            mocks,
          );

          expect(mocks.upsertNetworkConfiguration).toHaveBeenCalledTimes(1);
          expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledTimes(
            1,
          );
          expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledWith([
            NON_INFURA_CHAIN_ID,
          ]);
          expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
        });
      });

      it('should switch to the existing networkConfiguration if the proposed networkConfiguration has the same rpcUrl as the one already in state (and is not currently selected)', async () => {
        const mocks = makeMocks({
          permissionedChainIds: [createMockOptimismConfiguration().chainId],
          permissionsFeatureFlagIsActive: true,
          overrides: {
            getCurrentRpcUrl: jest
              .fn()
              .mockReturnValue('https://eth.llamarpc.com'),
            findNetworkConfigurationBy: jest
              .fn()
              .mockReturnValue(createMockOptimismConfiguration()),
          },
        });

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: createMockOptimismConfiguration().chainId,
                chainName: createMockOptimismConfiguration().nickname,
                rpcUrls: [createMockOptimismConfiguration().rpcUrl],
                nativeCurrency: {
                  symbol: createMockOptimismConfiguration().ticker,
                  decimals: 18,
                },
                blockExplorerUrls: [
                  createMockOptimismConfiguration().rpcPrefs.blockExplorerUrl,
                ],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          mocks,
        );

        expect(mocks.requestUserApproval).not.toHaveBeenCalled();
        expect(mocks.requestPermittedChainsPermission).not.toHaveBeenCalled();
        expect(mocks.setActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveNetwork).toHaveBeenCalledWith(
          createMockOptimismConfiguration().id,
        );
      });
    });
  });

  it('should return an error if an unexpected parameter is provided', async () => {
    const mocks = makeMocks({
      permissionsFeatureFlagIsActive: false,
    });
    const mockEnd = jest.fn();

    const unexpectedParam = 'unexpected';

    await addEthereumChainHandler(
      {
        origin: 'example.com',
        params: [
          {
            chainId: createMockNonInfuraConfiguration().chainId,
            chainName: createMockNonInfuraConfiguration().nickname,
            rpcUrls: [createMockNonInfuraConfiguration().rpcUrl],
            nativeCurrency: {
              symbol: createMockNonInfuraConfiguration().ticker,
              decimals: 18,
            },
            blockExplorerUrls: [
              createMockNonInfuraConfiguration().rpcPrefs.blockExplorerUrl,
            ],
            [unexpectedParam]: 'parameter',
          },
        ],
      },
      {},
      jest.fn(),
      mockEnd,
      mocks,
    );

    expect(mockEnd).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${unexpectedParam}`,
      }),
    );
  });

  it('should handle errors during the switch network permission request', async () => {
    const mockError = new Error('Permission request failed');
    const mocks = makeMocks({
      permissionsFeatureFlagIsActive: true,
      permissionedChainIds: [],
      overrides: {
        requestPermittedChainsPermission: jest
          .fn()
          .mockRejectedValue(mockError),
      },
    });
    const mockEnd = jest.fn();

    await addEthereumChainHandler(
      {
        origin: 'example.com',
        params: [
          {
            chainId: CHAIN_IDS.MAINNET,
            chainName: 'Ethereum Mainnet',
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            nativeCurrency: {
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://etherscan.io'],
          },
        ],
      },
      {},
      jest.fn(),
      mockEnd,
      mocks,
    );

    expect(mocks.requestPermittedChainsPermission).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledWith(mockError);
    expect(mocks.setActiveNetwork).not.toHaveBeenCalled();
  });

  it('should return an error if nativeCurrency.symbol does not match an existing network with the same chainId', async () => {
    const mocks = makeMocks({
      permissionedChainIds: [CHAIN_IDS.MAINNET],
      permissionsFeatureFlagIsActive: true,
    });
    const mockEnd = jest.fn();

    await addEthereumChainHandler(
      {
        origin: 'example.com',
        params: [
          {
            chainId: CHAIN_IDS.MAINNET,
            chainName: 'Ethereum Mainnet',
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            nativeCurrency: {
              symbol: 'WRONG',
              decimals: 18,
            },
            blockExplorerUrls: ['https://etherscan.io'],
          },
        ],
      },
      {},
      jest.fn(),
      mockEnd,
      mocks,
    );

    expect(mockEnd).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
      }),
    );
  });

  it('should add result set to null to response object if the requested rpcUrl (and chainId) is currently selected', async () => {
    const CURRENT_RPC_CONFIG = createMockNonInfuraConfiguration();

    const mocks = makeMocks({
      permissionsFeatureFlagIsActive: false,
      overrides: {
        getCurrentChainIdForDomain: jest
          .fn()
          .mockReturnValue(CURRENT_RPC_CONFIG.chainId),
        findNetworkConfigurationBy: jest
          .fn()
          .mockReturnValue(CURRENT_RPC_CONFIG),
        getCurrentRpcUrl: jest.fn().mockReturnValue(CURRENT_RPC_CONFIG.rpcUrl),
      },
    });
    const res = {};

    await addEthereumChainHandler(
      {
        origin: 'example.com',
        params: [
          {
            chainId: CURRENT_RPC_CONFIG.chainId,
            chainName: 'Custom Network',
            rpcUrls: [CURRENT_RPC_CONFIG.rpcUrl],
            nativeCurrency: {
              symbol: CURRENT_RPC_CONFIG.ticker,
              decimals: 18,
            },
            blockExplorerUrls: ['https://custom.blockexplorer'],
          },
        ],
      },
      res,
      jest.fn(),
      jest.fn(),
      mocks,
    );
    expect(res.result).toBeNull();
  });
});
