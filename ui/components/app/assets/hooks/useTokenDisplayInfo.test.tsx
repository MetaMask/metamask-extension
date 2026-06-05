import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  getEnabledNetworksByNamespace,
  getShowFiatInTestnets,
  getTokenList,
  selectERC20TokensByChain,
} from '../../../../selectors';
import {
  getImageForChainId,
  isChainIdMainnet,
  makeGetMultichainShouldShowFiatByChainId,
} from '../../../../selectors/multichain';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useTokenDisplayInfo } from './useTokenDisplayInfo';
import type { TokenWithFiatAmount } from '../types';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../selectors', () => ({
  getEnabledNetworksByNamespace: jest.fn(),
  getShowFiatInTestnets: jest.fn(),
  getTokenList: jest.fn(),
  selectERC20TokensByChain: jest.fn(),
}));

jest.mock('../../../../selectors/multichain', () => ({
  getImageForChainId: jest.fn(),
  isChainIdMainnet: jest.fn(),
  makeGetMultichainShouldShowFiatByChainId: jest.fn(),
}));

jest.mock('../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: jest.fn(),
}));

jest.mock('../../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: jest.fn(),
}));

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseMultichainSelector = jest.mocked(useMultichainSelector);
const mockUseFormatters = jest.mocked(useFormatters);
const mockMakeGetMultichainShouldShowFiatByChainId = jest.mocked(
  makeGetMultichainShouldShowFiatByChainId,
);
const mockGetImageForChainId = jest.mocked(getImageForChainId);
const mockIsChainIdMainnet = jest.mocked(isChainIdMainnet);

// Sepolia chain id (a testnet in TEST_CHAINS)
const SEPOLIA_CHAIN_ID = '0xaa36a7' as const;
// Ethereum mainnet chain id (not in TEST_CHAINS)
const MAINNET_CHAIN_ID = '0x1' as const;

const baseEvmToken: TokenWithFiatAmount = {
  address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  symbol: 'ETH',
  image: 'eth.png',
  decimals: 18,
  chainId: MAINNET_CHAIN_ID,
  isNative: true,
  tokenFiatAmount: 1700,
  secondary: null,
  title: 'Ethereum',
};

const mockFormatCurrency = jest.fn((amount: number) => `$${amount}`);

function setupMocks({
  showFiat = true,
  showFiatInTestnets = false,
  enabledNetworks = { [MAINNET_CHAIN_ID]: {} },
  currentCurrency = 'USD',
  tokenList = {},
  erc20TokensByChain = {},
}: {
  showFiat?: boolean;
  showFiatInTestnets?: boolean;
  enabledNetworks?: Record<string, unknown>;
  currentCurrency?: string;
  tokenList?: Record<string, unknown>;
  erc20TokensByChain?: Record<string, unknown>;
} = {}) {
  const showFiatSelector = jest.fn();
  mockMakeGetMultichainShouldShowFiatByChainId.mockReturnValue(showFiatSelector);
  mockUseMultichainSelector.mockReturnValue(showFiat);

  mockUseFormatters.mockReturnValue({
    formatCurrencyWithMinThreshold: mockFormatCurrency,
  } as unknown as ReturnType<typeof useFormatters>);

  mockGetImageForChainId.mockReturnValue('chain.png');
  mockIsChainIdMainnet.mockReturnValue(true);

  mockUseSelector.mockImplementation((selector) => {
    if (selector === getShowFiatInTestnets) {
      return showFiatInTestnets;
    }
    if (selector === getEnabledNetworksByNamespace) {
      return enabledNetworks;
    }
    if (selector === getCurrentCurrency) {
      return currentCurrency;
    }
    if (selector === getTokenList) {
      return tokenList;
    }
    if (selector === selectERC20TokensByChain) {
      return erc20TokensByChain;
    }
    // selector created inline in the hook for getInternalAccountBySelectedAccountGroupAndCaip
    return undefined;
  });
}

describe('useTokenDisplayInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatCurrency.mockImplementation((amount: number) => `$${amount}`);
  });

  describe('fiat visibility on testnet (bug #42723)', () => {
    it('hides fiat secondary value when only testnet is enabled and showFiatInTestnets is false', () => {
      setupMocks({
        showFiat: true,
        showFiatInTestnets: false,
        enabledNetworks: { [SEPOLIA_CHAIN_ID]: {} },
      });

      const token = { ...baseEvmToken, chainId: SEPOLIA_CHAIN_ID };
      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token }),
      );

      expect(result.current.secondary).toBeUndefined();
    });

    it('shows fiat secondary value when only testnet is enabled and showFiatInTestnets is true', () => {
      setupMocks({
        showFiat: true,
        showFiatInTestnets: true,
        enabledNetworks: { [SEPOLIA_CHAIN_ID]: {} },
      });

      const token = { ...baseEvmToken, chainId: SEPOLIA_CHAIN_ID };
      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token }),
      );

      expect(result.current.secondary).toBe('$1700');
    });

    it('shows fiat secondary value on mainnet regardless of showFiatInTestnets setting', () => {
      setupMocks({
        showFiat: true,
        showFiatInTestnets: false,
        enabledNetworks: { [MAINNET_CHAIN_ID]: {} },
      });

      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token: baseEvmToken }),
      );

      expect(result.current.secondary).toBe('$1700');
    });

    it('hides fiat secondary value on mainnet when showFiat selector returns false', () => {
      setupMocks({
        showFiat: false,
        showFiatInTestnets: false,
        enabledNetworks: { [MAINNET_CHAIN_ID]: {} },
      });

      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token: baseEvmToken }),
      );

      expect(result.current.secondary).toBeUndefined();
    });

    it('treats multi-network selection as mainnet (isTestnetSelected=false) and shows fiat', () => {
      setupMocks({
        showFiat: true,
        showFiatInTestnets: false,
        // length > 1, so isTestnetSelected = false → isMainnet = true
        enabledNetworks: {
          [MAINNET_CHAIN_ID]: {},
          [SEPOLIA_CHAIN_ID]: {},
        },
      });

      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token: baseEvmToken }),
      );

      expect(result.current.secondary).toBe('$1700');
    });
  });

  describe('EVM token display', () => {
    it('returns title and tokenImage from token when no tokenList match', () => {
      setupMocks({ showFiat: true, enabledNetworks: { [MAINNET_CHAIN_ID]: {} } });

      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token: baseEvmToken }),
      );

      expect(result.current.title).toBe('Ethereum');
      expect(result.current.tokenImage).toBe('eth.png');
    });

    it('returns isStakeable true for native EVM mainnet token', () => {
      mockIsChainIdMainnet.mockReturnValue(true);
      setupMocks({ showFiat: true, enabledNetworks: { [MAINNET_CHAIN_ID]: {} } });

      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token: { ...baseEvmToken, isNative: true } }),
      );

      expect(result.current.isStakeable).toBe(true);
    });
  });

  describe('token with null fiatAmount', () => {
    it('returns undefined secondary when tokenFiatAmount is null', () => {
      setupMocks({
        showFiat: true,
        showFiatInTestnets: false,
        enabledNetworks: { [MAINNET_CHAIN_ID]: {} },
      });

      const token = { ...baseEvmToken, tokenFiatAmount: null };
      const { result } = renderHook(() =>
        useTokenDisplayInfo({ token }),
      );

      expect(result.current.secondary).toBeUndefined();
    });
  });
});
