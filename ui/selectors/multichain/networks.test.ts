import { BtcScope, SolScope } from '@metamask/keyring-api';
import {
  type NetworkConfiguration,
  RpcEndpointType,
  NetworkStatus,
} from '@metamask/network-controller';
import type { Hex, CaipChainId } from '@metamask/utils';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';

import { type NetworkState } from '../../../shared/modules/selectors/networks';
import {
  type MultichainNetworkControllerState,
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getSelectedMultichainNetworkConfiguration,
  getIsEvmSelected,
} from './networks';

type TestState = MultichainNetworkControllerState &
  NetworkState & {
    metamask: { solanaSupportEnabled: boolean; bitcoinSupportEnabled: boolean };
  };

const nonEvmNetworks: Record<CaipChainId, MultichainNetworkConfiguration> = {
  [SolScope.Mainnet]: {
    chainId: SolScope.Mainnet,
    name: 'Solana Mainnet',
    nativeCurrency: `${SolScope.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
    isEvm: false,
  },
  [BtcScope.Mainnet]: {
    chainId: BtcScope.Mainnet,
    name: 'Bitcoin Mainnet',
    nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
    isEvm: false,
  },
};

const evmNetworksWithNewConfig: Record<
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

const evmNetworksWithOldConfig: Record<Hex, NetworkConfiguration> = {
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

const mockMultichainNetworkState: TestState = {
  metamask: {
    solanaSupportEnabled: true,
    bitcoinSupportEnabled: true,
    multichainNetworkConfigurationsByChainId: {
      ...nonEvmNetworks,
    },
    selectedMultichainNetworkChainId: SolScope.Mainnet,
    isEvmSelected: false,
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
      ...evmNetworksWithOldConfig,
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
  },
};

describe('Multichain network selectors', () => {
  describe('getNonEvmMultichainNetworkConfigurationsByChainId', () => {
    it('returns the non-EVM multichain network configurations by chain ID', () => {
      expect(
        getNonEvmMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkState,
        ),
      ).toStrictEqual({
        ...nonEvmNetworks,
      });
    });
  });

  describe('getMultichainNetworkConfigurationsByChainId', () => {
    it('returns all multichain network configurations by chain ID when Solana and Bitcoin are enabled', () => {
      expect(
        getMultichainNetworkConfigurationsByChainId(mockMultichainNetworkState),
      ).toStrictEqual({
        ...nonEvmNetworks,
        ...evmNetworksWithNewConfig,
      });
    });

    it('returns all multichain network configurations by chain ID excluding Solana when support is disabled', () => {
      const mockMultichainNetworkStateWithSolanaSupportDisabled = {
        ...mockMultichainNetworkState,
        metamask: {
          ...mockMultichainNetworkState.metamask,
          solanaSupportEnabled: false,
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithSolanaSupportDisabled,
        ),
      ).toStrictEqual({
        [BtcScope.Mainnet]: nonEvmNetworks[BtcScope.Mainnet],
        ...evmNetworksWithNewConfig,
      });
    });

    it('returns all multichain network configurations by chain ID excluding Bitcoin when support is disabled', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockMultichainNetworkState,
        metamask: {
          ...mockMultichainNetworkState.metamask,
          bitcoinSupportEnabled: false,
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual({
        [SolScope.Mainnet]: nonEvmNetworks[SolScope.Mainnet],
        ...evmNetworksWithNewConfig,
      });
    });

    it('returns all multichain network configurations by chain ID excluding Bitcoin and Solana when support is disabled', () => {
      const mockMultichainNetworkStateWithBitcoinSupportDisabled = {
        ...mockMultichainNetworkState,
        metamask: {
          ...mockMultichainNetworkState.metamask,
          solanaSupportEnabled: false,
          bitcoinSupportEnabled: false,
        },
      };

      expect(
        getMultichainNetworkConfigurationsByChainId(
          mockMultichainNetworkStateWithBitcoinSupportDisabled,
        ),
      ).toStrictEqual({ ...evmNetworksWithNewConfig });
    });
  });

  describe('getSelectedMultichainNetworkChainId', () => {
    it('returns the selected multichain network chain ID', () => {
      expect(
        getSelectedMultichainNetworkChainId(mockMultichainNetworkState),
      ).toStrictEqual(SolScope.Mainnet);
    });
  });

  describe('getIsEvmSelected', () => {
    it('returns whether the EVM network is selected', () => {
      expect(getIsEvmSelected(mockMultichainNetworkState)).toStrictEqual(false);
    });
  });

  describe('getSelectedMultichainNetworkConfiguration', () => {
    it('returns the selected non EVM multichain network configuration if isEvmSelected is false', () => {
      expect(
        getSelectedMultichainNetworkConfiguration(mockMultichainNetworkState),
      ).toStrictEqual(nonEvmNetworks[SolScope.Mainnet]);
    });
    it('returns the selected EVM multichain network configuration if isEvmSelected is true', () => {
      const mockMultichainNetworkStateWithEvmSelected = {
        ...mockMultichainNetworkState,
        metamask: {
          ...mockMultichainNetworkState.metamask,
          isEvmSelected: true,
        },
      };

      expect(
        getSelectedMultichainNetworkConfiguration(
          mockMultichainNetworkStateWithEvmSelected,
        ),
      ).toStrictEqual(evmNetworksWithNewConfig['eip155:1']);
    });
  });
});
