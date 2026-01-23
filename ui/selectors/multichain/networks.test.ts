import { BtcScope, SolScope } from '@metamask/keyring-api';
import {
  type NetworkConfiguration,
  RpcEndpointType,
  NetworkStatus,
} from '@metamask/network-controller';
import {
  type Hex,
  type CaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';

import { type NetworkState } from '../../../shared/modules/selectors/networks';
import type { AccountsState } from '../accounts';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../test/data/mock-accounts';
import { RemoteFeatureFlagsState } from '../remote-feature-flags';
import {
  type MultichainNetworkControllerState,
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getSelectedMultichainNetworkConfiguration,
  getIsEvmMultichainNetworkSelected,
  selectFirstUnavailableEvmNetwork,
  getEvmMultichainNetworkConfigurations,
  getAllMultichainNetworkConfigurations,
} from './networks';

jest.mock('./feature-flags', () => ({
  getIsBitcoinSupportEnabled: jest.fn((state) => {
    const { bitcoinAccounts } = state.metamask.remoteFeatureFlags;
    // Keep this simple, only check if it's enabled or not.
    return bitcoinAccounts?.enabled;
  }),
  getIsSolanaSupportEnabled: jest.fn((state) => {
    const { solanaAccounts } = state.metamask.remoteFeatureFlags;
    // Keep this simple, only check if it's enabled or not.
    return solanaAccounts?.enabled;
  }),
  getIsSolanaTestnetSupportEnabled: jest.fn(
    (state) => state.metamask.remoteFeatureFlags.solanaTestnetsEnabled,
  ),
  getIsBitcoinTestnetSupportEnabled: jest.fn(
    (state) => state.metamask.remoteFeatureFlags.bitcoinTestnetsEnabled,
  ),
  getIsTronSupportEnabled: jest.fn((state) => {
    const { tronAccounts } = state.metamask.remoteFeatureFlags;
    // Keep this simple, only check if it's enabled or not.
    return tronAccounts?.enabled;
  }),
  getIsTronTestnetSupportEnabled: jest.fn(
    (state) => state.metamask.remoteFeatureFlags.tronTestnetsEnabled,
  ),
}));

jest.mock('../../../shared/modules/selectors/multichain', () => ({
  getEnabledNetworks: jest.fn(
    (state) => state.metamask.enabledNetworkMap ?? { eip155: {} },
  ),
}));

type TestState = AccountsState &
  MultichainNetworkControllerState &
  NetworkState &
  RemoteFeatureFlagsState;

const mockNonEvmNetworks: Record<CaipChainId, MultichainNetworkConfiguration> =
  {
    [SolScope.Mainnet]: {
      chainId: SolScope.Mainnet,
      name: 'Solana',
      nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
      isEvm: false,
    },
    [SolScope.Devnet]: {
      chainId: SolScope.Devnet,
      name: 'Solana Devnet',
      nativeCurrency: `${SolScope.Devnet}/slip44:501`,
      isEvm: false,
    },
    [BtcScope.Mainnet]: {
      chainId: BtcScope.Mainnet,
      name: 'Bitcoin',
      nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
      isEvm: false,
    },
  };

const mockEvmNetworksWithNewConfig: Record<
  CaipChainId,
  MultichainNetworkConfiguration
> = {
  'eip155:1': {
    chainId: 'eip155:1',
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    isEvm: true,
  },
  'eip155:11155111': {
    chainId: 'eip155:11155111',
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    isEvm: true,
  },
};

const mockEvmNetworksWithOldConfig: Record<Hex, NetworkConfiguration> = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: RpcEndpointType.Infura,
        url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
    defaultRpcEndpointIndex: 1,
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    lastUpdatedAt: 1739466375574,
  },
  '0xaa36a7': {
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    chainId: '0xaa36a7',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    rpcEndpoints: [
      {
        networkClientId: 'sepolia',
        type: RpcEndpointType.Infura,
        url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
};

const mockState: TestState = {
  metamask: {
    remoteFeatureFlags: {
      solanaAccounts: { enabled: true, minimumVersion: '13.6.0' },
      solanaTestnetsEnabled: true,
      bitcoinTestnetsEnabled: false,
      bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
      tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
      tronTestnetsEnabled: false,
    },
    multichainNetworkConfigurationsByChainId: {
      ...mockNonEvmNetworks,
    },
    selectedMultichainNetworkChainId: SolScope.Mainnet,
    isEvmSelected: false,
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      ...mockEvmNetworksWithOldConfig,
    },
    networksMetadata: {
      mainnet: {
        EIPS: { 1559: true },
        status: NetworkStatus.Available,
      },
      sepolia: {
        EIPS: { 1559: true },
        status: NetworkStatus.Available,
      },
    },
    networksWithTransactionActivity: {},
    internalAccounts: {
      selectedAccount: MOCK_ACCOUNT_EOA.id,
      accounts: {
        [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
      },
    },
  },
};

describe('Multichain network selectors', () => {
  describe('getNonEvmMultichainNetworkConfigurationsByChainId', () => {
    it('returns the non-EVM multichain network configurations by chain ID', () => {
      expect(
        getNonEvmMultichainNetworkConfigurationsByChainId(mockState),
      ).toStrictEqual({
        ...mockNonEvmNetworks,
      });
    });
  });

  describe('getMultichainNetworkConfigurationsByChainId', () => {
    it('returns all multichain network configurations by chain ID when Solana and Bitcoin are enabled', () => {
      expect(
        getMultichainNetworkConfigurationsByChainId(mockState),
      ).toStrictEqual([
        { ...mockNonEvmNetworks, ...mockEvmNetworksWithNewConfig },
        mockEvmNetworksWithOldConfig,
      ]);
    });

    it('returns all multichain network configurations by chain ID excluding Solana when support is disabled and there is no Solana account', () => {
      const mockMultichainNetworkStateWithSolanaSupportDisabled = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
          },
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithSolanaSupportDisabled,
        ),
      ).toStrictEqual([
        {
          [BtcScope.Mainnet]: mockNonEvmNetworks[BtcScope.Mainnet],
          ...mockEvmNetworksWithNewConfig,
        },
        mockEvmNetworksWithOldConfig,
      ]);
    });

    it('returns all multichain network configurations by chain ID excluding Bitcoin and Solana when support is disabled and no accounts related to those networks', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
            bitcoinAccounts: { enabled: false, minimumVersion: '13.6.0' },
          },
          // Ensure no accounts with Bitcoin/Solana scopes exist
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_EOA.id,
            accounts: {
              [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
            },
          },
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual([
        mockEvmNetworksWithNewConfig,
        mockEvmNetworksWithOldConfig,
      ]);
    });

    it('returns Solana as part of the multichain network configurations if there is a Solana account', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
            bitcoinAccounts: { enabled: false, minimumVersion: '13.6.0' },
          },
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
            },
          },
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual([
        {
          ...mockEvmNetworksWithNewConfig,
          [SolScope.Mainnet]: mockNonEvmNetworks[SolScope.Mainnet],
          [SolScope.Devnet]: mockNonEvmNetworks[SolScope.Devnet],
        },
        mockEvmNetworksWithOldConfig,
      ]);
    });

    it('returns Bitcoin as part of the multichain network configurations if there is a Bitcoin account', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
            bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
            },
          },
          multichainNetworkConfigurationsByChainId: {
            [BtcScope.Mainnet]: mockNonEvmNetworks[BtcScope.Mainnet],
            ...mockEvmNetworksWithNewConfig,
          },
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual([
        {
          ...mockEvmNetworksWithNewConfig,
          [BtcScope.Mainnet]: mockNonEvmNetworks[BtcScope.Mainnet],
        },
        mockEvmNetworksWithOldConfig,
      ]);
    });

    it('returns Bitcoin and Solana as part of the multichain network configurations if there is Bitcoin and Solana accounts', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
            bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
              [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
            },
          },
        },
      };

      const expectedNonEvmNetworks = {
        [SolScope.Mainnet]: mockNonEvmNetworks[SolScope.Mainnet],
        [SolScope.Devnet]: mockNonEvmNetworks[SolScope.Devnet],
        [BtcScope.Mainnet]: mockNonEvmNetworks[BtcScope.Mainnet],
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual([
        {
          ...mockEvmNetworksWithNewConfig,
          ...expectedNonEvmNetworks,
        },
        mockEvmNetworksWithOldConfig,
      ]);
    });
  });

  describe('getEvmMultichainNetworkConfigurations', () => {
    it('returns EVM networks in multichain format', () => {
      expect(getEvmMultichainNetworkConfigurations(mockState)).toStrictEqual(
        mockEvmNetworksWithNewConfig,
      );
    });

    it('returns stable references when called multiple times with the same state', () => {
      const result1 = getEvmMultichainNetworkConfigurations(mockState);
      const result2 = getEvmMultichainNetworkConfigurations(mockState);

      expect(result1).toBe(result2);
    });

    it('returns a new reference when state changes', () => {
      const result1 = getEvmMultichainNetworkConfigurations(mockState);

      const modifiedState: TestState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            '0x5': {
              chainId: '0x5',
              name: 'Goerli',
              nativeCurrency: 'GoerliETH',
              rpcEndpoints: [
                {
                  networkClientId: 'goerli',
                  type: RpcEndpointType.Infura,
                  url: 'https://goerli.infura.io/v3/{infuraProjectId}',
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
        },
      };

      const result2 = getEvmMultichainNetworkConfigurations(modifiedState);

      expect(result1).not.toBe(result2);
      expect(Object.keys(result2)).toHaveLength(3);
    });
  });

  describe('getAllMultichainNetworkConfigurations', () => {
    it('returns all multichain networks (EVM + non-EVM)', () => {
      expect(getAllMultichainNetworkConfigurations(mockState)).toStrictEqual({
        ...mockNonEvmNetworks,
        ...mockEvmNetworksWithNewConfig,
      });
    });

    it('returns stable references when called multiple times with the same state', () => {
      const result1 = getAllMultichainNetworkConfigurations(mockState);
      const result2 = getAllMultichainNetworkConfigurations(mockState);

      expect(result1).toBe(result2);
    });

    it('returns a new reference when state changes', () => {
      const result1 = getAllMultichainNetworkConfigurations(mockState);

      const modifiedState: TestState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            '0x5': {
              chainId: '0x5',
              name: 'Goerli',
              nativeCurrency: 'GoerliETH',
              rpcEndpoints: [
                {
                  networkClientId: 'goerli',
                  type: RpcEndpointType.Infura,
                  url: 'https://goerli.infura.io/v3/{infuraProjectId}',
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
        },
      };

      const result2 = getAllMultichainNetworkConfigurations(modifiedState);

      expect(result1).not.toBe(result2);
    });
  });

  describe('getMultichainNetworkConfigurationsByChainId - reference stability', () => {
    it('returns stable references when called multiple times with the same state', () => {
      const result1 = getMultichainNetworkConfigurationsByChainId(mockState);
      const result2 = getMultichainNetworkConfigurationsByChainId(mockState);

      // The tuple itself should be the same reference
      expect(result1).toBe(result2);
      // Each element should also be the same reference
      expect(result1[0]).toBe(result2[0]);
      expect(result1[1]).toBe(result2[1]);
    });

    it('returns a new reference when EVM networks change', () => {
      const result1 = getMultichainNetworkConfigurationsByChainId(mockState);

      const modifiedState: TestState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            '0x5': {
              chainId: '0x5',
              name: 'Goerli',
              nativeCurrency: 'GoerliETH',
              rpcEndpoints: [
                {
                  networkClientId: 'goerli',
                  type: RpcEndpointType.Infura,
                  url: 'https://goerli.infura.io/v3/{infuraProjectId}',
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
        },
      };

      const result2 =
        getMultichainNetworkConfigurationsByChainId(modifiedState);

      // References should be different when state changes
      expect(result1).not.toBe(result2);
      expect(result1[0]).not.toBe(result2[0]);
      expect(result1[1]).not.toBe(result2[1]);
    });
  });

  describe('getSelectedMultichainNetworkConfiguration - reference stability', () => {
    it('returns stable references when called multiple times with the same state', () => {
      const result1 = getSelectedMultichainNetworkConfiguration(mockState);
      const result2 = getSelectedMultichainNetworkConfiguration(mockState);

      expect(result1).toBe(result2);
    });

    it('returns same reference when unrelated state changes', () => {
      const result1 = getSelectedMultichainNetworkConfiguration(mockState);

      // Change something unrelated to selected network
      const modifiedState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          networksMetadata: {
            ...mockState.metamask.networksMetadata,
            mainnet: {
              EIPS: { 1559: false },
              status: NetworkStatus.Unavailable,
            },
          },
        },
      };

      const result2 = getSelectedMultichainNetworkConfiguration(modifiedState);

      // Should be the same reference since selected network config didn't change
      expect(result1).toBe(result2);
    });
  });

  describe('getSelectedMultichainNetworkChainId', () => {
    it('returns the selected multichain network chain ID', () => {
      expect(getSelectedMultichainNetworkChainId(mockState)).toStrictEqual(
        SolScope.Mainnet,
      );
    });
  });

  describe('getIsEvmMultichainNetworkSelected', () => {
    it('returns whether the EVM network is selected', () => {
      expect(getIsEvmMultichainNetworkSelected(mockState)).toStrictEqual(false);
    });
  });

  describe('getSelectedMultichainNetworkConfiguration', () => {
    it('returns the selected non EVM multichain network configuration if isEvmSelected is false', () => {
      expect(
        getSelectedMultichainNetworkConfiguration(mockState),
      ).toStrictEqual(mockNonEvmNetworks[SolScope.Mainnet]);
    });
    it('returns the selected EVM multichain network configuration if isEvmSelected is true', () => {
      const mockMultichainNetworkStateWithEvmSelected = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isEvmSelected: true,
        },
      };

      expect(
        getSelectedMultichainNetworkConfiguration(
          mockMultichainNetworkStateWithEvmSelected,
        ),
      ).toStrictEqual(mockEvmNetworksWithNewConfig['eip155:1']);
    });
  });

  describe('selectFirstUnavailableEvmNetwork', () => {
    it('returns the first EVM Infura-powered network that does not have a status of "available"', () => {
      const mockStateWithMultipleUnavailableNetworks = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
              '0xaa36a7': true,
            },
          },
          networksMetadata: {
            mainnet: {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
            sepolia: {
              EIPS: {},
              status: NetworkStatus.Blocked,
            },
          },
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1' as const,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'mainnet' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
            '0xaa36a7': {
              chainId: '0xaa36a7' as const,
              name: 'Sepolia',
              nativeCurrency: 'SepoliaETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://sepolia.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'sepolia' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(
          mockStateWithMultipleUnavailableNetworks,
        ),
      ).toStrictEqual({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
    });

    it('returns the first EVM custom network that does not have a status of "available"', () => {
      const mockStateWithMultipleUnavailableNetworks = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1000': true,
              '0xaa36a7': true,
            },
          },
          networksMetadata: {
            'AAAA-BBBB-CCCC-DDDD': {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
            sepolia: {
              EIPS: {},
              status: NetworkStatus.Blocked,
            },
          },
          networkConfigurationsByChainId: {
            '0x1000': {
              chainId: '0x1000' as const,
              name: 'Custom Network',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom as const,
                  url: 'https://custom.network',
                  networkClientId: 'AAAA-BBBB-CCCC-DDDD' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
            '0xaa36a7': {
              chainId: '0xaa36a7' as const,
              name: 'Sepolia',
              nativeCurrency: 'SepoliaETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://sepolia.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'sepolia' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'AAAA-BBBB-CCCC-DDDD',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(
          mockStateWithMultipleUnavailableNetworks,
        ),
      ).toStrictEqual({
        networkName: 'Custom Network',
        networkClientId: 'AAAA-BBBB-CCCC-DDDD',
        chainId: '0x1000',
        isInfuraEndpoint: false,
        infuraEndpointIndex: undefined,
      });
    });

    it('returns null when all enabled EVM networks are available', () => {
      const mockStateWithAvailableEvmNetworks = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
              '0xaa36a7': true,
            },
          },
          networksMetadata: {
            mainnet: {
              EIPS: {},
              status: NetworkStatus.Available,
            },
            sepolia: {
              EIPS: {},
              status: NetworkStatus.Available,
            },
          },
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1' as const,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'mainnet' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
            '0xaa36a7': {
              chainId: '0xaa36a7' as const,
              name: 'Sepolia',
              nativeCurrency: 'SepoliaETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://sepolia.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'sepolia' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(mockStateWithAvailableEvmNetworks),
      ).toBeNull();
    });

    it('returns null when no EVM networks are enabled', () => {
      const mockStateWithNoEnabledEvmNetworks = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {},
          },
          networksMetadata: {},
          networkConfigurationsByChainId: {},
          selectedNetworkClientId: 'mainnet',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(mockStateWithNoEnabledEvmNetworks),
      ).toBeNull();
    });

    it('skips networks with missing metadata', () => {
      const mockStateWithMissingMetadata = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
            },
          },
          networksMetadata: {},
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1' as const,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'mainnet' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(mockStateWithMissingMetadata),
      ).toBeNull();
    });

    it('skips networks that do not have network configurations', () => {
      const mockStateWithMissingNetworkConfig = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
            },
          },
          networksMetadata: {
            mainnet: {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
          },
          networkConfigurationsByChainId: {},
          selectedNetworkClientId: 'mainnet',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(mockStateWithMissingNetworkConfig),
      ).toBeNull();
    });

    it('returns infuraEndpointIndex when custom network has an Infura endpoint available', () => {
      const mockStateWithCustomAndInfuraEndpoints = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0xa4b1': true,
            },
          },
          networksMetadata: {
            'custom-arbitrum': {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
          },
          networkConfigurationsByChainId: {
            '0xa4b1': {
              chainId: '0xa4b1' as const,
              name: 'Arbitrum One',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom as const,
                  url: 'https://custom.arbitrum.rpc',
                  networkClientId: 'custom-arbitrum' as const,
                },
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://arbitrum-mainnet.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'arbitrum-mainnet' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'custom-arbitrum',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(
          mockStateWithCustomAndInfuraEndpoints as Parameters<
            typeof selectFirstUnavailableEvmNetwork
          >[0],
        ),
      ).toStrictEqual({
        networkName: 'Arbitrum One',
        networkClientId: 'custom-arbitrum',
        chainId: '0xa4b1',
        isInfuraEndpoint: false,
        infuraEndpointIndex: 1,
      });
    });

    it('returns undefined infuraEndpointIndex when custom network has no Infura endpoint', () => {
      const mockStateWithOnlyCustomEndpoint = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1000': true,
            },
          },
          networksMetadata: {
            'custom-network': {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
          },
          networkConfigurationsByChainId: {
            '0x1000': {
              chainId: '0x1000' as const,
              name: 'Custom Network',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom as const,
                  url: 'https://custom.network.rpc',
                  networkClientId: 'custom-network' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'custom-network',
        },
      };

      expect(
        selectFirstUnavailableEvmNetwork(mockStateWithOnlyCustomEndpoint),
      ).toStrictEqual({
        networkName: 'Custom Network',
        networkClientId: 'custom-network',
        chainId: '0x1000',
        isInfuraEndpoint: false,
        infuraEndpointIndex: undefined,
      });
    });

    it('does not return infuraEndpointIndex when already using Infura endpoint', () => {
      const mockStateWithInfuraAsDefault = {
        metamask: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
            },
          },
          networksMetadata: {
            mainnet: {
              EIPS: {},
              status: NetworkStatus.Unavailable,
            },
          },
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1' as const,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura as const,
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}' as const,
                  networkClientId: 'mainnet' as const,
                },
              ],
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              defaultBlockExplorerUrlIndex: 0,
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      };

      const result = selectFirstUnavailableEvmNetwork(
        mockStateWithInfuraAsDefault,
      );
      expect(result).toStrictEqual({
        networkName: 'Ethereum Mainnet',
        networkClientId: 'mainnet',
        chainId: '0x1',
        isInfuraEndpoint: true,
        infuraEndpointIndex: undefined,
      });
    });
  });
});
