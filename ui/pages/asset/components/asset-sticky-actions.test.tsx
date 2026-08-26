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
  beforeEach(() => jest.clearAllMocks());

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
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} />,
      store,
    );

    fireEvent.click(getByTestId('asset-sticky-swap'));
    expect(mockOpenBridgeExperience).toHaveBeenCalledWith(
      MetaMetricsSwapsEventSource.TokenView,
      token,
    );
  });

  it('disables swap while the stock market is closed', () => {
    const { getByTestId } = renderWithProvider(
      <AssetStickyActions asset={token} isMarketClosed />,
      store,
    );

    expect(getByTestId('asset-sticky-swap')).toBeDisabled();
  });
});
