import { SolScope } from '@metamask/keyring-api';
import { RpcEndpointType, NetworkStatus } from '@metamask/network-controller';

import { type NetworkState } from '../../shared/modules/selectors/networks';
import {
  type MultichainNetworkControllerState,
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getSelectedMultichainNetworkConfiguration,
  getIsEvmSelected,
} from './multichain-networks';

type TestState = MultichainNetworkControllerState & NetworkState;

const mockMultichainNetworkState: TestState = {
  metamask: {
    multichainNetworkConfigurationsByChainId: {
      [SolScope.Mainnet]: {
        chainId: SolScope.Mainnet,
        name: 'Solana Mainnet',
        nativeCurrency: `${SolScope.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
        isEvm: false,
      },
    },
    selectedMultichainNetworkChainId: SolScope.Mainnet,
    isEvmSelected: false,
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {
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
        [SolScope.Mainnet]: {
          chainId: SolScope.Mainnet,
          name: 'Solana Mainnet',
          nativeCurrency: `${SolScope.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
          isEvm: false,
        },
      });
    });
  });

  describe('getMultichainNetworkConfigurationsByChainId', () => {
    it('returns the multichain network configurations by chain ID', () => {
      expect(
        getMultichainNetworkConfigurationsByChainId(mockMultichainNetworkState),
      ).toStrictEqual({
        [SolScope.Mainnet]: {
          chainId: SolScope.Mainnet,
          name: 'Solana Mainnet',
          nativeCurrency: `${SolScope.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
          isEvm: false,
        },
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
      });
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
    it('returns the selected non EVM multichain network configuration if isEvmSelected is true', () => {
      expect(
        getSelectedMultichainNetworkConfiguration(mockMultichainNetworkState),
      ).toStrictEqual({
        chainId: SolScope.Mainnet,
        name: 'Solana Mainnet',
        nativeCurrency: `${SolScope.Mainnet}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
        isEvm: false,
      });
    });
    it('returns the selected EVM multichain network configuration if isEvmSelected is false', () => {
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
      ).toStrictEqual({
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        isEvm: true,
      });
    });
  });
});
