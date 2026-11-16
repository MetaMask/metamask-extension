import React from 'react';
import { RequestStatus } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20';
import { useSwapsRebate } from '../../../hooks/bridge/useSwapsRebate';
import { SwapsRebateBanner } from './swaps-rebate-banner';

jest.mock('../../../hooks/bridge/useSwapsRebate', () => ({
  getIsSwapsRebateBannerEnabled: () => true,
  useSwapsRebate: jest.fn(),
}));

const mockUseSwapsRebate = useSwapsRebate as jest.MockedFunction<
  typeof useSwapsRebate
>;

const renderBanner = () =>
  renderWithProvider(
    <SwapsRebateBanner />,
    configureStore(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesErc20Erc20,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
        },
      }),
    ),
  );

describe('SwapsRebateBanner', () => {
  it('renders the rebate percentage when the user has a rebate', () => {
    mockUseSwapsRebate.mockReturnValue(10);

    const { getByTestId } = renderBanner();

    expect(getByTestId('swaps-rebate-banner')).toHaveTextContent(
      'You’re getting 10% back on fees',
    );
  });

  it('renders nothing when there is no rebate', () => {
    mockUseSwapsRebate.mockReturnValue(null);

    const { queryByTestId } = renderBanner();

    expect(queryByTestId('swaps-rebate-banner')).not.toBeInTheDocument();
  });
});
