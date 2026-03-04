import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
// eslint-disable-next-line import/no-restricted-paths
import { getConversionRatesForNativeAsset } from '../../../../app/scripts/lib/util';
import { AssetType } from '../../../../shared/constants/transaction';
import { Asset } from '../types/asset';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { AssetMarketDetails } from './asset-market-details';

// Wrapper to provide i18n context
const renderWithI18n = (component: React.ReactElement) => {
  return render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <I18nContext.Provider value={tEn as any}>{component}</I18nContext.Provider>,
  );
};

// Mock all the hooks and utilities
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

jest.mock('../util', () => ({
  getPricePrecision: jest.fn(() => 2),
}));

jest.mock('../../../helpers/utils/confirm-tx.util', () => ({
  formatCurrency: jest.fn((value, _currency, _precision) => `$${value}`),
}));

jest.mock('../../../../shared/lib/asset-utils', () => ({
  isEvmChainId: jest.fn(),
}));

jest.mock('../../../../app/scripts/lib/util', () => ({
  getConversionRatesForNativeAsset: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseMultichainSelector = useMultichainSelector as jest.MockedFunction<
  typeof useMultichainSelector
>;
const mockIsEvmChainId = isEvmChainId as jest.MockedFunction<
  typeof isEvmChainId
>;
const mockGetConversionRatesForNativeAsset =
  getConversionRatesForNativeAsset as jest.MockedFunction<
    typeof getConversionRatesForNativeAsset
  >;

describe('AssetMarketDetails', () => {
  const mockTokenExchangeRate = 1000; // 1 token = $1000 USD
  const mockCirculatingSupply = 15000000000; // 15B tokens
  const mockMarketCap = 50000; // $50k
  const mockTotalVolume = 1000; // $1k

  const evmAsset: Asset = {
    type: AssetType.token,
    chainId: '0x1',
    address: '0xTokenAddress',
    symbol: 'TEST',
    decimals: 18,
    image: '',
    balance: {
      value: '1000',
      display: '1000',
      fiat: '$1000',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockIsEvmChainId.mockReturnValue(true);
    mockGetConversionRatesForNativeAsset.mockReturnValue({
      rate: '1',
      conversionTime: Date.now(),
      marketData: undefined,
    });

    // Mock useSelector calls (in order they appear in the component)
    mockUseSelector
      .mockReturnValueOnce('usd') // getCurrentCurrency
      .mockReturnValueOnce({
        // getMarketData
        '0x1': {
          '0xTokenAddress': {
            marketCap: mockMarketCap,
            totalVolume: mockTotalVolume,
            circulatingSupply: mockCirculatingSupply,
            allTimeHigh: 100,
            allTimeLow: 10,
          },
        },
      })
      .mockReturnValueOnce({
        // getCurrencyRates
        ETH: {
          conversionRate: mockTokenExchangeRate,
        },
      })
      .mockReturnValueOnce({}); // getAssetsRates

    // Mock useMultichainSelector calls (in order they appear in the component)
    mockUseMultichainSelector
      .mockReturnValueOnce(1) // getMultichainConversionRate
      .mockReturnValueOnce('ETH'); // getMultichainNativeCurrency
  });

  it('should render market details when valid market data is available', () => {
    const { getByText } = renderWithI18n(
      <AssetMarketDetails asset={evmAsset} address="0xTokenAddress" />,
    );

    expect(getByText(messages.marketDetails.message)).toBeInTheDocument();
    expect(getByText(messages.marketCap.message)).toBeInTheDocument();
    expect(getByText(messages.totalVolume.message)).toBeInTheDocument();
    expect(getByText(messages.circulatingSupply.message)).toBeInTheDocument();
    expect(getByText(messages.allTimeHigh.message)).toBeInTheDocument();
    expect(getByText(messages.allTimeLow.message)).toBeInTheDocument();
  });

  it('should correctly multiply market cap by exchange rate for EVM tokens', () => {
    const { container } = renderWithI18n(
      <AssetMarketDetails asset={evmAsset} address="0xTokenAddress" />,
    );

    // Market cap should be multiplied by exchange rate: 50,000 * 1,000 = 50,000,000
    // And formatted as compact: $50.00M
    const marketCapElement = container.querySelector(
      '[data-testid="asset-market-cap"]',
    );
    expect(marketCapElement).toHaveTextContent('$50.00M');
  });

  it('should NOT multiply circulating supply by exchange rate for EVM tokens', () => {
    const { getByText } = renderWithI18n(
      <AssetMarketDetails asset={evmAsset} address="0xTokenAddress" />,
    );

    // Circulating supply should NOT be multiplied by exchange rate
    // It should remain as the original token count: 15,000,000,000
    // And formatted as compact: 15.00B
    const circulatingSupplyRow = getByText(
      messages.circulatingSupply.message,
    ).parentElement;
    expect(circulatingSupplyRow).toHaveTextContent('15.00B');

    // Verify it's NOT the multiplied value (15B * 1000 = 15T)
    expect(circulatingSupplyRow).not.toHaveTextContent('15000.00B');
  });

  it('should multiply allTimeHigh and allTimeLow by exchange rate for EVM tokens', () => {
    const { getByText } = renderWithI18n(
      <AssetMarketDetails asset={evmAsset} address="0xTokenAddress" />,
    );

    // allTimeHigh: 100 * 1000 = 100,000 -> $100000
    const allTimeHighRow = getByText(
      messages.allTimeHigh.message,
    ).parentElement;
    expect(allTimeHighRow).toHaveTextContent('$100000');

    // allTimeLow: 10 * 1000 = 10,000 -> $10000
    const allTimeLowRow = getByText(messages.allTimeLow.message).parentElement;
    expect(allTimeLowRow).toHaveTextContent('$10000');
  });

  it('should not render when conversionRate is 0', () => {
    // Create a new component instance with fresh mocks
    jest.resetAllMocks();

    // Set up mocks specifically for this test
    mockIsEvmChainId.mockReturnValue(true);
    mockGetConversionRatesForNativeAsset.mockReturnValue({
      rate: '1',
      conversionTime: Date.now(),
      marketData: undefined,
    });

    // Return 0 for conversionRate - this should prevent rendering
    mockUseMultichainSelector.mockReturnValue(0); // getMultichainConversionRate = 0

    // Mock useSelector for the remaining calls
    mockUseSelector
      .mockReturnValue('usd') // getCurrentCurrency
      .mockReturnValue({}) // getMarketData
      .mockReturnValue({}) // getCurrencyRates
      .mockReturnValue({}); // getAssetsRates

    const { container } = renderWithI18n(
      <AssetMarketDetails asset={evmAsset} address="0xTokenAddress" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
