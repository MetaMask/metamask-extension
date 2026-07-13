import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { Asset } from '../types/asset';
import TokenButtons from './token-buttons';

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock(
  '../../../hooks/ramps/useRampsNavigation/useRampsNavigation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({ goToBuy: mockGoToBuy }),
  }),
);

jest.mock('../../../hooks/bridge/useBridging', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ openBridgeExperience: jest.fn() }),
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: jest.fn(), createEventBuilder }),
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

describe('TokenButtons buy wiring', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes the Buy button through goToBuy with the token as intent assetId', () => {
    const { getByTestId } = renderWithProvider(
      <TokenButtons token={token} />,
      store,
    );

    fireEvent.click(getByTestId('token-overview-buy'));
    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: toAssetId(token.address, token.chainId),
      chainId: token.chainId,
    });
  });
});
