import React from 'react';
import configureMockStore from 'redux-mock-store';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import {
  useIsTransactionPayLoading,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { TotalRow, TotalRowProps } from './total-row';

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockStore = configureMockStore([]);

function render(props: TotalRowProps = {}) {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <TotalRow {...props} />,
    mockStore(state),
  );
}

describe('TotalRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  beforeEach(() => {
    jest.clearAllMocks();

    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '123.456' },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);
  });

  it('renders skeleton with label when loading (Default variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, getByText } = render();

    expect(getByTestId('total-row-skeleton')).toBeInTheDocument();
    expect(getByText(messages.total.message)).toBeInTheDocument();
  });

  it('renders full skeleton without label when loading (Small variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByText } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('total-row-skeleton')).toBeInTheDocument();
    expect(queryByText(messages.total.message)).not.toBeInTheDocument();
  });

  it('renders total value with ConfirmInfoRowText for Default variant', () => {
    const { getByTestId } = render();

    const totalValue = getByTestId('total-value');
    expect(totalValue).toBeInTheDocument();
    expect(totalValue).toHaveTextContent('$123.46');
  });

  it('renders total value with Text component for Small variant', () => {
    const { getByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    const totalValue = getByTestId('total-value');
    expect(totalValue).toBeInTheDocument();
    expect(totalValue).toHaveTextContent('$123.46');
  });
});
