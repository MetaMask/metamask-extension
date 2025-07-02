import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { SolScope } from '@metamask/keyring-api';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { MINUTE } from '../../../shared/constants/time';
import type { BridgeToken } from '../../ducks/bridge/types';
import { useTokensWithFiltering } from './useTokensWithFiltering';

const NATIVE_TOKEN = getNativeAssetForChainId(CHAIN_IDS.MAINNET);

const mockFetchBridgeTokens = jest.fn().mockResolvedValue({
  [NATIVE_TOKEN.address]: NATIVE_TOKEN,
  ...STATIC_MAINNET_TOKEN_LIST,
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
    ...(STATIC_MAINNET_TOKEN_LIST as unknown as Record<string, BridgeToken>)[
      '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
    ],
    assetId: 'eip155:1/erc20:0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
  },
});
jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  fetchBridgeTokens: (c: string) => mockFetchBridgeTokens(c),
}));

const mockFetchTopAssetsList = jest.fn().mockResolvedValue([
  { address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' }, // UNI
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }, // USDC
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
]);
jest.mock('../../pages/swaps/swaps.util', () => ({
  fetchTopAssetsList: (c: string) => mockFetchTopAssetsList(c),
}));

describe('useTokensWithFiltering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all tokens when chainId !== activeChainId and chainId has been imported, sorted by balance', async () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0x1': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
        tokensChainsCache: {
          [CHAIN_IDS.MAINNET]: {
            timestamp: Date.now(),
            data: {
              [NATIVE_TOKEN.address]: NATIVE_TOKEN,
              ...STATIC_MAINNET_TOKEN_LIST,
            },
          },
        },
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: 'eip155:1',
        isEvmSelected: true,
      },
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(() => {
      const { filteredTokenListGenerator } = useTokensWithFiltering(
        CHAIN_IDS.MAINNET,
      );
      return filteredTokenListGenerator;
    }, mockStore);

    await waitForNextUpdate();

    expect(mockFetchTopAssetsList).toHaveBeenCalledTimes(1);
    expect(mockFetchTopAssetsList).toHaveBeenCalledWith('0x1');
    expect(mockFetchBridgeTokens).not.toHaveBeenCalled();
    // The first 10 tokens returned
    const first10Tokens = [...result.current(() => true)].slice(0, 10);
    expect(first10Tokens).toMatchSnapshot();
  });

  it('should fetch bridge tokens if cached tokens are not defined', async () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0xa': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
        tokensChainsCache: {
          [CHAIN_IDS.OPTIMISM]: {
            timestamp: Date.now() - 11 * MINUTE,
            data: {
              [NATIVE_TOKEN.address]: NATIVE_TOKEN,
              ...STATIC_MAINNET_TOKEN_LIST,
            },
          },
        },
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: 'eip155:1',
        isEvmSelected: true,
      },
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(() => {
      const { filteredTokenListGenerator } = useTokensWithFiltering(
        CHAIN_IDS.MAINNET,
      );
      return filteredTokenListGenerator;
    }, mockStore);

    await waitForNextUpdate();

    expect(mockFetchTopAssetsList).toHaveBeenCalledTimes(1);
    expect(mockFetchTopAssetsList).toHaveBeenCalledWith('0x1');
    expect(mockFetchBridgeTokens).toHaveBeenCalledTimes(1);
    expect(mockFetchBridgeTokens).toHaveBeenCalledWith('0x1');
    // The first 10 tokens returned
    const first10Tokens = [...result.current(() => true)].slice(0, 10);
    expect(first10Tokens).toMatchSnapshot();
  });

  it('should fetch bridge tokens if chain is solana', async () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0x1': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
        tokensChainsCache: {
          [CHAIN_IDS.MAINNET]: {
            timestamp: Date.now() - 11 * MINUTE,
            data: {
              [NATIVE_TOKEN.address]: NATIVE_TOKEN,
              ...STATIC_MAINNET_TOKEN_LIST,
            },
          },
        },
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: SolScope.Mainnet,
        isEvmSelected: false,
      },
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(() => {
      const { filteredTokenListGenerator } = useTokensWithFiltering(
        MultichainNetwork.Solana,
      );
      return filteredTokenListGenerator;
    }, mockStore);

    await waitForNextUpdate();

    expect(mockFetchTopAssetsList).toHaveBeenCalledTimes(1);
    expect(mockFetchTopAssetsList).toHaveBeenCalledWith(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    );
    expect(mockFetchBridgeTokens).toHaveBeenCalledTimes(1);
    expect(mockFetchBridgeTokens).toHaveBeenCalledWith(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    );
    // The first 10 tokens returned
    const first10Tokens = [...result.current(() => true)].slice(0, 10);
    expect(first10Tokens).toMatchSnapshot();
  });

  it('should return all tokens when chainId !== activeChainId and chainId has not been imported, sorted by balance', async () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0x1': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
        tokensChainsCache: {},
        multichainNetworkConfigurationsByChainId:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
        selectedMultichainNetworkChainId: 'eip155:1',
        isEvmSelected: true,
      },
    });

    const { result, waitForNextUpdate } = renderHookWithProvider(() => {
      const { filteredTokenListGenerator } = useTokensWithFiltering(
        CHAIN_IDS.POLYGON,
      );
      return filteredTokenListGenerator;
    }, mockStore);
    await waitForNextUpdate();

    expect(mockFetchTopAssetsList).toHaveBeenCalledTimes(1);
    expect(mockFetchTopAssetsList).toHaveBeenCalledWith('0x89');
    expect(mockFetchBridgeTokens).toHaveBeenCalledTimes(1);
    expect(mockFetchBridgeTokens).toHaveBeenCalledWith('0x89');
    // The first 10 tokens returned
    const first10Tokens = [
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...result.current((_s: any, _a: any, c: string) => c === '0x89'),
    ].slice(0, 10);
    expect(first10Tokens).toMatchSnapshot();
  });
});
