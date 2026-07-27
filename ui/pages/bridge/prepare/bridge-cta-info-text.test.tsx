import React from 'react';
import { RequestStatus } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20';
import { BridgeCTAInfoText } from './bridge-cta-info-text';

const createDiscountedQuoteWithoutApproval = () =>
  mockBridgeQuotesErc20Erc20.map((quote) => ({
    ...quote,
    approval: undefined,
    quote: {
      ...quote.quote,
      feeData: {
        ...quote.quote.feeData,
        metabridge: {
          ...quote.quote.feeData.metabridge,
          amount: '1000000000000000000',
          quoteBpsFee: 50,
          baseBpsFee: 87.5,
          discountType: 'vip',
        },
      },
    },
  }));

describe('BridgeCTAInfoText', () => {
  it('renders null when the quote requires approval and has no MetaMask fee', () => {
    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });

    const { queryByTestId } = renderWithProvider(
      <BridgeCTAInfoText />,
      configureStore(mockStore),
    );

    expect(queryByTestId('bridge-cta-info-text')).not.toBeInTheDocument();
  });

  it('renders null when VIP discount applies and there is no approval step', () => {
    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: createDiscountedQuoteWithoutApproval(),
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });

    const { queryByTestId } = renderWithProvider(
      <BridgeCTAInfoText />,
      configureStore(mockStore),
    );

    expect(queryByTestId('bridge-cta-info-text')).not.toBeInTheDocument();
  });
});
