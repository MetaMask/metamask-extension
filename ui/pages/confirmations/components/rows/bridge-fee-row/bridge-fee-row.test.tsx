import React from 'react';
import configureMockStore from 'redux-mock-store';
import type {
  TransactionPayQuote,
  TransactionPayTotals,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { BridgeFeeRow } from './bridge-fee-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../../../hooks/useI18nContext');

const mockStore = configureMockStore([]);

function render() {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(<BridgeFeeRow />, mockStore(state));
}

describe('BridgeFeeRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useI18nContextMock = jest.mocked(useI18nContext);

  beforeEach(() => {
    jest.resetAllMocks();

    useI18nContextMock.mockReturnValue(((key: string) => {
      const translations: Record<string, string> = {
        transactionFee: 'Transaction fee',
        metamaskFee: 'MetaMask fee',
        networkFee: 'Network fee',
        bridgeFee: 'Bridge fee',
      };
      return translations[key] ?? key;
    }) as ReturnType<typeof useI18nContext>);

    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.03' },
      },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);

    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);
  });

  it('renders transaction fee', () => {
    const { getByText } = render();
    expect(getByText('$1.23')).toBeInTheDocument();
  });

  it('renders skeletons if quotes loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(getByTestId('metamask-fee-row-skeleton')).toBeInTheDocument();
  });

  it('does not render metamask fee if no quotes', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });
});
