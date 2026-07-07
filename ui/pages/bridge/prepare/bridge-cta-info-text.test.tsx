import React from 'react';
import { QuoteResponse, RequestStatus } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { BridgeCTAInfoText } from './bridge-cta-info-text';

const createDiscountedQuoteWithoutApproval = (): QuoteResponse[] =>
  (mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[]).map((quote) => ({
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
        },
      },
    },
  }));

describe('BridgeCTAInfoText', () => {
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
