import { ethErrors } from 'eth-rpc-errors';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import addEthereumChain from './add-ethereum-chain';
import { upsertNetworkConfiguration } from '../../../../../ui/store/actions';

const NON_INFURA_CHAIN_ID = '0x123456789';

const MOCK_MAINNET_CONFIGURATION = {
  chainId: CHAIN_IDS.MAINNET,
  nickname: 'Ethereum Mainnet',
  rpcUrl: 'https://mainnet.infura.io/v3/',
  type: NETWORK_TYPES.MAINNET,
  ticker: 'ETH',
  rpcPrefs: {
    blockExplorerUrl: 'https://etherscan.io',
  },
};

const MOCK_OPTIMISM_CONFIGURATION = {
  chainId: CHAIN_IDS.OPTIMISM,
  nickname: 'Optimism',
  rpcUrl: 'https://optimism.llamarpc.com',
  rpcPrefs: {
    blockExplorerUrl: 'https://optimistic.etherscan.io',
  },
  ticker: 'ETH',
};

const MOCK_NON_INFURA_CONFIGURATION = {
  chainId: NON_INFURA_CHAIN_ID,
  rpcUrl: 'https://custom.network',
  ticker: 'CUST',
  nickname: 'Custom Network',
  rpcPrefs: {
    blockExplorerUrl: 'https://custom.blockexplorer',
  },
};

describe('addEthereumChainHandler', () => {
  const addEthereumChainHandler = addEthereumChain.implementation;

  const setupMocks = ({
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
        .mockReturnValue(MOCK_MAINNET_CONFIGURATION),
      setActiveNetwork: jest.fn(),
      getCurrentRpcUrl: jest
        .fn()
        .mockReturnValue(MOCK_MAINNET_CONFIGURATION.rpcUrl),
      requestUserApproval: jest.fn().mockResolvedValue(123),
      requestSwitchNetworkPermission: jest.fn(),
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

  describe('when getChainPermissionsFeatureFlag() returns false', () => {
    describe('if a networkConfiguration for the given chainId does not already exist', () => {
      it('should call requestApproval, mockUpsertNetworkConfiguration with the requested chain, and setActiveNetwork', async () => {
        const mocks = setupMocks({
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
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      describe('if proposed networkConfiguration has a different rpcUrl from all existing networkConfigurations', () => {
        it('should call upsertNetworkConfiguration and then setActiveNetwork', async () => {
          const mocks = setupMocks({
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
      });

      describe('if proposed networkConfiguration has the same rpcUrl as an existing networkConfiguration', () => {
        describe('if currentRpcUrl doesnt match the requested rpcUrl', () => {
          it('should call setActiveNetwork with the matched existing networkConfiguration id', async () => {
            mockGetCurrentRpcUrl.mockReturnValue(
              MOCK_NON_INFURA_CONFIGURATION.rpcUrl,
            );
            mockGetCurrentChainIdForDomain.mockReturnValue(
              MOCK_NON_INFURA_CONFIGURATION.chainId,
            );
            mockFindNetworkConfigurationBy.mockImplementation(({ chainId }) => {
              console.log('chainId', chainId);
              switch (chainId) {
                case MOCK_NON_INFURA_CONFIGURATION.chainId:
                  return MOCK_NON_INFURA_CONFIGURATION;
                case MOCK_OPTIMISM_CONFIGURATION.chainId:
                  return MOCK_OPTIMISM_CONFIGURATION;
                default:
                  return undefined;
              }
            });

            mockUpsertNetworkConfiguration.mockResolvedValue(123);

            await addEthereumChainHandler(
              {
                origin: 'example.com',
                params: [
                  {
                    chainId: MOCK_OPTIMISM_CONFIGURATION.chainId,
                    chainName: MOCK_OPTIMISM_CONFIGURATION.nickname,
                    rpcUrls: [MOCK_OPTIMISM_CONFIGURATION.rpcUrl],
                    nativeCurrency: {
                      symbol: MOCK_OPTIMISM_CONFIGURATION.ticker,
                      decimals: 18,
                    },
                    blockExplorerUrls: [
                      MOCK_OPTIMISM_CONFIGURATION.rpcPrefs.blockExplorerUrl,
                    ],
                  },
                ],
              },
              {},
              jest.fn(),
              jest.fn(),
              setupMocks({
                permissionsFeatureFlagIsActive: false,
              }),
            );

            expect(mockRequestUserApproval).toHaveBeenCalledTimes(1);
            expect(mockRequestUserApproval).toHaveBeenCalledWith({
              origin: 'example.com',
              requestData: {
                fromNetworkConfiguration: MOCK_NON_INFURA_CONFIGURATION,
                // {
                //   chainId: MOCK_NON_INFURA_CONFIGURATION.chainId,
                //   nickname: MOCK_NON_INFURA_CONFIGURATION.nickname,
                //   rpcUrl: MOCK_NON_INFURA_CONFIGURATION.rpcUrl,
                //   ticker: MOCK_NON_INFURA_CONFIGURATION.ticker,
                // },
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
            expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
            expect(mockSetActiveNetwork).toHaveBeenCalledWith(
              MOCK_OPTIMISM_CONFIGURATION.id,
            );
          });
        });
      });

      it('should return error for invalid chainId', async () => {
        const mockEnd = jest.fn();

        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [{ chainId: 'invalid_chain_id' }],
          },
          {},
          jest.fn(),
          mockEnd,
          setupMocks({
            permissionsFeatureFlagIsActive: false,
          }),
        );

        expect(mockEnd).toHaveBeenCalledWith(
          ethErrors.rpc.invalidParams({
            message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\ninvalid_chain_id`,
          }),
        );
      });
    });
  });

  describe('when getChainPermissionsFeatureFlag() returns true', () => {
    describe('if a networkConfiguration for the given chainId does not already exist', () => {
      it('should call upsertNetworkConfiguration, requestSwitchNetworkPermission, and call setActiveNetwork', async () => {
        mockUpsertNetworkConfiguration.mockResolvedValue(123);
        await addEthereumChainHandler(
          {
            origin: 'example.com',
            params: [
              {
                chainId: MOCK_NON_INFURA_CONFIGURATION.chainId,
                chainName: MOCK_NON_INFURA_CONFIGURATION.nickname,
                rpcUrls: [MOCK_NON_INFURA_CONFIGURATION.rpcUrl],
                nativeCurrency: {
                  symbol: MOCK_NON_INFURA_CONFIGURATION.ticker,
                  decimals: 18,
                },
                blockExplorerUrls: [
                  MOCK_NON_INFURA_CONFIGURATION.rpcPrefs.blockExplorerUrl,
                ],
              },
            ],
          },
          {},
          jest.fn(),
          jest.fn(),
          setupMocks({
            permissionedChainIds: [],
            permissionsFeatureFlagIsActive: true,
          }),
        );

        expect(mockUpsertNetworkConfiguration).toHaveBeenCalledWith(
          MOCK_NON_INFURA_CONFIGURATION,
          { referrer: 'example.com', source: 'dapp' },
        );
        expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
        expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledWith([
          MOCK_NON_INFURA_CONFIGURATION.chainId,
        ]);
        expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
        expect(mockSetActiveNetwork).toHaveBeenCalledWith(123);
      });
    });

    describe('if a networkConfiguration for the given chainId already exists', () => {
      describe('if the proposed networkConfiguration has a different rpcUrl from the one already in state', () => {
        describe('if the requested chainId has permittedChains permission granted for requesting origin', () => {
          it('should, after adding the chain, call setActiveNetwork without calling mockRequestSwitchNetworkPermission', async () => {
            await addEthereumChainHandler(
              {
                origin: 'example.com',
                params: [
                  {
                    chainId: CHAIN_IDS.MAINNET,
                    chainName: 'Ethereum Mainnet',
                    rpcUrls: ['https://eth.llamarpc.com'], // different rpcUrl from the one mocked in state
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
              setupMocks({
                permissionedChainIds: [CHAIN_IDS.MAINNET],
                permissionsFeatureFlagIsActive: true,
              }),
            );

            // request user approval is only called once, for the add, but not for the switch
            expect(mockRequestUserApproval).toHaveBeenCalledTimes(1);
            expect(mockRequestSwitchNetworkPermission).not.toHaveBeenCalled();
            expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
            expect(mockSetActiveNetwork).toHaveBeenCalledWith(123);
          });
        });

        describe('if the requested chainId does not have permittedChains permission granted for requesting origin', () => {
          it('should call upsertNetworkConfiguration, requestSwitchPermissions and setActiveNetwork', async () => {
            mockFindNetworkConfigurationBy.mockReturnValue(
              MOCK_NON_INFURA_CONFIGURATION,
            );
            mockGetCurrentChainIdForDomain.mockReturnValue(CHAIN_IDS.MAINNET);
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
              setupMocks({
                permissionsFeatureFlagIsActive: true,
                permissionedChainIds: [],
              }),
            );

            expect(mockUpsertNetworkConfiguration).toHaveBeenCalledTimes(1);
            expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
            expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledWith([
              NON_INFURA_CHAIN_ID,
            ]);
            expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('if the proposed networkConfiguration has the same rpcUrl as the one already in state', () => {
        describe('if the rpcUrl of the currently selected network does not match the requested rpcUrl', () => {
          it('should not call neither requestUserApproval nor mockRequestSwitchNetworkPermission, should call setActiveNetwork', async () => {
            mockGetCurrentRpcUrl.mockReturnValue('https://eth.llamarpc.com');
            mockFindNetworkConfigurationBy.mockReturnValue(
              MOCK_OPTIMISM_CONFIGURATION,
            );

            await addEthereumChainHandler(
              {
                origin: 'example.com',
                params: [
                  {
                    chainId: MOCK_OPTIMISM_CONFIGURATION.chainId,
                    chainName: MOCK_OPTIMISM_CONFIGURATION.nickname,
                    rpcUrls: [MOCK_OPTIMISM_CONFIGURATION.rpcUrl],
                    nativeCurrency: {
                      symbol: MOCK_OPTIMISM_CONFIGURATION.ticker,
                      decimals: 18,
                    },
                    blockExplorerUrls: [
                      MOCK_OPTIMISM_CONFIGURATION.rpcPrefs.blockExplorerUrl,
                    ],
                  },
                ],
              },
              {},
              jest.fn(),
              jest.fn(),
              setupMocks({
                permissionedChainIds: [MOCK_OPTIMISM_CONFIGURATION.chainId],
                permissionsFeatureFlagIsActive: true,
              }),
            );

            expect(mockRequestUserApproval).not.toHaveBeenCalled();
            expect(mockRequestSwitchNetworkPermission).not.toHaveBeenCalled();
            expect(mockSetActiveNetwork).toHaveBeenCalledTimes(1);
            expect(mockSetActiveNetwork).toHaveBeenCalledWith(
              MOCK_OPTIMISM_CONFIGURATION.id,
            );
          });
        });
      });

      it('should handle errors during the switch network permission request', async () => {
        const mockError = new Error('Permission request failed');
        mockRequestSwitchNetworkPermission.mockRejectedValue(mockError);

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
          setupMocks({
            permissionedChainIds: [],
            permissionsFeatureFlagIsActive: true,
          }),
        );

        expect(mockRequestSwitchNetworkPermission).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenCalledWith(mockError);
        expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      });
    });

    it('should return error if nativeCurrency.symbol does not match existing network', async () => {
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
        setupMocks({
          permissionedChainIds: [CHAIN_IDS.MAINNET],
          permissionsFeatureFlagIsActive: true,
        }),
      );

      expect(mockEnd).toHaveBeenCalledWith(
        ethErrors.rpc.invalidParams({
          message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\nWRONG`,
        }),
      );
    });
  });
});
