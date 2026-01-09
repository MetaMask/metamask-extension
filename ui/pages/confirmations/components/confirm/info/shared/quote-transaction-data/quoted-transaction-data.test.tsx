import React from 'react';

import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import * as DappSwapContextModule from '../../../../../context/dapp-swap';
import {
  mockBridgeQuotes,
  mockSwapConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import { Confirmation } from '../../../../../types/confirm';
import { QuotedSwapTransactionData } from './quoted-transaction-data';

jest.mock('../../../../../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
  decodeTransactionData: jest.fn(),
}));

jest.mock('../../hooks/useFourByte', () => ({
  useFourByte: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: () => ({
      trackAlertMetrics: jest.fn(),
    }),
  }),
);

function render() {
  const store = configureStore(
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation),
  );

  return renderWithConfirmContextProvider(<QuotedSwapTransactionData />, store);
}

describe('QuotedSwapTransactionData', () => {
  it('render if quoted swap is present', () => {
    jest.spyOn(DappSwapContextModule, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: mockBridgeQuotes[0],
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    const { getByText } = render();

    expect(getByText('Transaction 1')).toBeInTheDocument();
    expect(getByText('Transaction 2')).toBeInTheDocument();
  });

  it('does not render if quoted swap is not selected', () => {
    jest.spyOn(DappSwapContextModule, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: false,
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    const { queryByText } = render();

    expect(queryByText('Approve')).not.toBeInTheDocument();
    expect(queryByText('Swap')).not.toBeInTheDocument();
  });

  it('does not render if selectedQuote is undefined', () => {
    jest.spyOn(DappSwapContextModule, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: undefined,
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    const { queryByText } = render();

    expect(queryByText('Transaction 1')).not.toBeInTheDocument();
    expect(queryByText('Transaction 2')).not.toBeInTheDocument();
  });

  it('handles transition from defined to undefined selectedQuote without error', () => {
    const mockUseDappSwapContext = jest.spyOn(
      DappSwapContextModule,
      'useDappSwapContext',
    );

    // First render with valid quote
    mockUseDappSwapContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: mockBridgeQuotes[0],
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    const { queryByText, rerender } = render();
    expect(queryByText('Transaction 1')).toBeInTheDocument();

    // Simulate switching confirmations - selectedQuote becomes undefined
    mockUseDappSwapContext.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: undefined,
    } as unknown as ReturnType<
      typeof DappSwapContextModule.useDappSwapContext
    >);

    // Re-render should not throw React hooks error
    expect(() => {
      rerender(<QuotedSwapTransactionData />);
    }).not.toThrow();

    expect(queryByText('Transaction 1')).not.toBeInTheDocument();
  });
});
