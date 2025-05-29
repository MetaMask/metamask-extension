import {
  BtcScope,
  SolScope,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
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
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  type MultichainNetworkControllerState,
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getSelectedMultichainNetworkConfiguration,
  getIsEvmMultichainNetworkSelected,
  getActiveNetworksByScopes,
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
      name: 'Bitcoin Signet',
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

const mockAccount = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '0x152387ad22c3f0',
  pinned: false,
  hidden: false,
  lastSelected: 0,
  active: 0,
  keyring: { type: 'HD Key Tree' },
  label: null,
};

const mockBitcoinAccount = {
  ...mockAccount,
  id: 'b5893c59-e376-4cc0-93ad-35ddaab574a1',
  address: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
  type: BtcAccountType.P2wpkh,
  scopes: [MultichainNetworks.BITCOIN],
};

const mockSolanaAccount = {
  ...mockAccount,
  id: 'b7893c54-e376-4cc0-93ad-05dd1ab574a4',
  address: 'B33FvNLyahfDqEZD7erAnr5bXZsw58nmEKiaiAoKmXEr',
  type: SolAccountType.DataAccount,
  scopes: [MultichainNetworks.SOLANA, MultichainNetworks.SOLANA_TESTNET],
};

const mockEvmAccount = {
  ...mockAccount,
  id: 'b7893c54-e376-4cc0-93ad-05dd1ab574a4',
  address: '0x884d0eGA54cc9C222d355D2A3D3e9F0C23155cDz',
  scopes: ['eip155:0'] as `${string}:${string}`[],
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

describe('getActiveNetworksByScopes', () => {
  it('returns EVM networks for account with eip155:0 scope and activeChains', () => {
    const state = {
      metamask: {
        networksWithTransactionActivity: {
          '0x884d0eGA54cc9C222d355D2A3D3e9F0C23155cDz': {
            namespace: 'eip155',
            activeChains: ['1', '137'],
          },
        },
      },
    };
    const result = getActiveNetworksByScopes(state, mockEvmAccount);
    expect(result).toEqual([
      expect.objectContaining({ chainId: '0x1', name: expect.any(String) }),
      expect.objectContaining({ chainId: '0x89', name: expect.any(String) }),
    ]);
  });

  it('returns Solana network for account with solana scope', () => {
    const state = {
      metamask: {
        networksWithTransactionActivity: {
          'solana-address': {
            namespace: 'solana',
            activeChains: [],
          },
        },
      },
    };
    const result = getActiveNetworksByScopes(state, mockSolanaAccount);
    expect(result).toEqual([
      expect.objectContaining({
        chainId: SolScope.Mainnet,
        name: expect.any(String),
      }),
    ]);
  });

  it('returns Bitcoin network for account with bitcoin scope', () => {
    const state = {
      metamask: {
        networksWithTransactionActivity: {
          'btc-address': {
            namespace: 'bip122',
            activeChains: [],
          },
        },
      },
    };
    const result = getActiveNetworksByScopes(state, mockBitcoinAccount);
    expect(result).toEqual([
      expect.objectContaining({
        chainId: BtcScope.Mainnet,
        name: expect.any(String),
      }),
    ]);
  });

  it('returns empty array for account with no scopes', () => {
    const account = { ...mockEvmAccount, scopes: [] };
    const state = {
      metamask: {
        networksWithTransactionActivity: {
          '0xevm1': {
            namespace: 'eip155',
            activeChains: [1],
          },
        },
      },
    };
    const result = getActiveNetworksByScopes(state, account);
    expect(result).toEqual([]);
  });

  it('returns empty array for account with no activity', () => {
    const state = {
      metamask: {
        networksWithTransactionActivity: {},
      },
    };
    const result = getActiveNetworksByScopes(state, mockEvmAccount);
    expect(result).toEqual([]);
  });
});
