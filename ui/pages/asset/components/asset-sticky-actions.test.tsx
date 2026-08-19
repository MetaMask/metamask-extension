import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { Asset } from '../types/asset';
import { AssetStickyActions } from './asset-sticky-actions';

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

  it('does not track a buy click when the ramps gate blocks the buy', async () => {
    mockGoToBuy.mockResolvedValueOnce(false);
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-buy'));
    await waitFor(() => expect(mockGoToBuy).toHaveBeenCalled());
    expect(mockTrackEvent).not.toHaveBeenCalled();
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
});
