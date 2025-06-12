import { BtcScope, SolScope } from '@metamask/keyring-api';
import {
  type NetworkConfiguration,
  RpcEndpointType,
  NetworkStatus,
} from '@metamask/network-controller';
import type { Hex, CaipChainId } from '@metamask/utils';
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
} from './networks';

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
    [BtcScope.Testnet]: {
      chainId: BtcScope.Testnet,
      name: 'Bitcoin Testnet',
      nativeCurrency: `${BtcScope.Testnet}/slip44:0`,
      isEvm: false,
    },
    [BtcScope.Signet]: {
      chainId: BtcScope.Signet,
      name: 'Bitcoin Mutinynet',
      nativeCurrency: `${BtcScope.Signet}/slip44:0`,
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
      addSolanaAccount: true,
      solanaTestnetsEnabled: true,
      addBitcoinAccount: true,
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
            addSolanaAccount: false,
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
          [BtcScope.Testnet]: mockNonEvmNetworks[BtcScope.Testnet],
          [BtcScope.Signet]: mockNonEvmNetworks[BtcScope.Signet],
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
            addSolanaAccount: false,
            addBitcoinAccount: false,
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
            addSolanaAccount: false,
            addBitcoinAccount: false,
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
            addSolanaAccount: false,
            addBitcoinAccount: true,
          },
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
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
          [BtcScope.Mainnet]: mockNonEvmNetworks[BtcScope.Mainnet],
          [BtcScope.Testnet]: mockNonEvmNetworks[BtcScope.Testnet],
          [BtcScope.Signet]: mockNonEvmNetworks[BtcScope.Signet],
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
            addSolanaAccount: false,
            addBitcoinAccount: true,
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

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual([
        {
          ...mockEvmNetworksWithNewConfig,
          ...mockNonEvmNetworks,
        },
        mockEvmNetworksWithOldConfig,
      ]);
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
});
