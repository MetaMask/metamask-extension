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
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ReceiveRow, ReceiveRowProps } from './receive-row';

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockStore = configureMockStore([]);

function render(
  props: Partial<ReceiveRowProps> = {},
  state: Record<string, unknown> = getMockPersonalSignConfirmState(),
) {
  return renderWithConfirmContextProvider(
    <ReceiveRow inputAmountUsd="10" {...props} />,
    mockStore(state),
  );
}

describe('ReceiveRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.05' },
        metaMask: { usd: '0.25' },
      },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);

    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);
  });

  it('renders the youllReceive label', () => {
    const { getByText } = render();

    expect(getByText(messages.youllReceive.message)).toBeInTheDocument();
  });

  it('renders skeleton with label when loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId, getByText } = render();

    expect(getByTestId('receive-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('receive-row')).not.toBeInTheDocument();
    expect(getByText(messages.youllReceive.message)).toBeInTheDocument();
  });

  it('computes input minus all fees (provider + sourceNetwork + targetNetwork + metaMask)', () => {
    const { getByTestId } = render({ inputAmountUsd: '10' });

    // 10 - (1.00 + 0.20 + 0.05 + 0.25) = 8.50
    expect(getByTestId('receive-value')).toHaveTextContent('$8.50');
  });

  it('treats a missing metaMask fee as zero', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.05' },
      },
    } as TransactionPayTotals);

    const { getByTestId } = render({ inputAmountUsd: '10' });

    // 10 - (1.00 + 0.20 + 0.05) = 8.75
    expect(getByTestId('receive-value')).toHaveTextContent('$8.75');
  });

  it('clamps the receive amount to 0 when fees exceed the input', () => {
    const { getByTestId } = render({ inputAmountUsd: '0.10' });

    expect(getByTestId('receive-value')).toHaveTextContent('$0.00');
  });

  it('renders an empty value when there are no quotes', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId } = render();

    expect(getByTestId('receive-value')).toHaveTextContent('');
  });

  it('renders an empty value when totals are not available', () => {
    useTransactionPayTotalsMock.mockReturnValue(
      undefined as unknown as TransactionPayTotals,
    );

    const { getByTestId } = render();

    expect(getByTestId('receive-value')).toHaveTextContent('');
  });

  it('uses Text component (Small variant) instead of ConfirmInfoRowText', () => {
    const { getByTestId } = render({ variant: ConfirmInfoRowSize.Small });

    const value = getByTestId('receive-value');
    expect(value).toBeInTheDocument();
    expect(value).toHaveTextContent('$8.50');
  });
});
