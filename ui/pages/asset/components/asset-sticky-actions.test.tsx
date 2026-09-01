import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ARC_USDC_TOKEN_ADDRESS,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import {
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { Asset } from '../types/asset';
import {
  AssetStickyActions,
  shouldPreferStickySwapCta,
} from './asset-sticky-actions';

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    goToBuy: mockGoToBuy,
    opensBuyInPortfolioTab: false,
  }),
}));

const mockOpenBridgeExperience = jest.fn();
jest.mock('../../../hooks/bridge/useBridging', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ openBridgeExperience: mockOpenBridgeExperience }),
}));

const mockGetAssetsBySelectedAccountGroup = jest.fn(
  () => ({}) as Record<string, unknown[]>,
);
jest.mock('../../../selectors/assets', () => ({
  ...jest.requireActual('../../../selectors/assets'),
  getAssetsBySelectedAccountGroup: () => mockGetAssetsBySelectedAccountGroup(),
}));

const mockTrackEvent = jest.fn();
jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: mockTrackEvent, createEventBuilder }),
  };
});

const token = {
  type: AssetType.token,
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  chainId: CHAIN_IDS.MAINNET,
  decimals: 18,
  symbol: 'DAI',
  image: '',
} as Asset & { type: AssetType.token };

const store = configureMockStore()({
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    useExternalServices: true,
  },
});

describe('AssetStickyActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAssetsBySelectedAccountGroup.mockReturnValue({});
  });

  it('routes the Buy button through goToBuy with the token as intent assetId', () => {
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-buy'));
    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: toAssetId(token.address, token.chainId),
      chainId: token.chainId,
    });
  });

  it('tracks the sticky Buy click when ramps blocks downstream navigation', async () => {
    mockGoToBuy.mockResolvedValueOnce(false);
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-buy'));
    await waitFor(() => expect(mockGoToBuy).toHaveBeenCalled());
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.TokenDetailsCtaClicked,
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          cta_type: 'buy',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_amount_range: '< 0.01',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address: token.address,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        }),
      }),
    );
  });

  it('opens the swap experience with the token as the source asset', () => {
    const fundedToken = {
      ...token,
      balance: { value: '1', display: '1', fiat: '1' },
    } as Asset & { type: AssetType.token };

    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={fundedToken} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-swap'));
    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      MetaMetricsSwapsEventSource.TokenView,
      fundedToken,
      undefined,
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.TokenDetailsCtaClicked,
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          cta_type: 'swap',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_amount_range: '1.00 - 9.99',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address: fundedToken.address,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: fundedToken.chainId,
        }),
      }),
    );
  });

  it('opens an Arc native swap with ERC20 USDC as the source asset', () => {
    const arcNativeAsset = {
      type: AssetType.native,
      isOriginalNativeSymbol: true,
      chainId: CHAIN_IDS.ARC,
      decimals: 6,
      symbol: 'USDC',
      name: 'USDC',
      image: '',
      balance: { value: '1', display: '1', fiat: '1' },
    } as Asset & { type: AssetType.native };

    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={arcNativeAsset} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-swap'));

    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      MetaMetricsSwapsEventSource.MainView,
      {
        symbol: 'USDC',
        address: ARC_USDC_TOKEN_ADDRESS,
        chainId: 'eip155:5042',
        decimals: 6,
        name: 'USDC',
      },
      undefined,
    );
  });

  it('swaps from a funded token and into the current one when it has no balance', () => {
    const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    mockGetAssetsBySelectedAccountGroup.mockReturnValue({
      [CHAIN_IDS.MAINNET]: [
        {
          assetId: usdcAddress,
          address: usdcAddress,
          chainId: CHAIN_IDS.MAINNET,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          isNative: false,
          fiat: { balance: 500 },
        },
      ],
    });

    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-swap'));

    const [source, sourceToken, destTokenAssetId] =
      mockOpenBridgeExperience.mock.calls[0];
    expect(source).toBe(MetaMetricsSwapsEventSource.TokenView);
    expect(sourceToken.address).toBe(usdcAddress);
    expect(destTokenAssetId).toBe(toAssetId(token.address, token.chainId));
  });

  it('disables swap while the stock market is closed', () => {
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} isMarketClosed />,
      store,
    );

    expect(getByTestId('asset-sticky-swap')).toBeDisabled();
  });

  it('keeps Buy as the filled primary CTA when fiat balance is 100 or less', () => {
    const lowBalanceToken = {
      ...token,
      balance: { value: '10', display: '10', fiat: '100' },
    } as Asset & { type: AssetType.token };

    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={lowBalanceToken} />,
      store,
    );

    expect(getByTestId('asset-sticky-buy')).toHaveClass('bg-success-default');
    expect(getByTestId('asset-sticky-swap')).toHaveClass('bg-transparent');
  });

  it('makes Swap the filled primary CTA when fiat balance is greater than 100', () => {
    const highBalanceToken = {
      ...token,
      balance: { value: '200', display: '200', fiat: '100.01' },
    } as Asset & { type: AssetType.token };

    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={highBalanceToken} />,
      store,
    );

    expect(getByTestId('asset-sticky-swap')).toHaveClass('bg-success-default');
    expect(getByTestId('asset-sticky-buy')).toHaveClass('bg-transparent');
  });
});

describe('shouldPreferStickySwapCta', () => {
  it('returns false for missing, zero, or 100 fiat', () => {
    expect(shouldPreferStickySwapCta()).toBe(false);
    expect(shouldPreferStickySwapCta('0')).toBe(false);
    expect(shouldPreferStickySwapCta('100')).toBe(false);
  });

  it('returns true for fiat above 100, including formatted strings', () => {
    expect(shouldPreferStickySwapCta('100.01')).toBe(true);
    expect(shouldPreferStickySwapCta('1,234.5')).toBe(true);
    expect(shouldPreferStickySwapCta('$250')).toBe(true);
  });
});
