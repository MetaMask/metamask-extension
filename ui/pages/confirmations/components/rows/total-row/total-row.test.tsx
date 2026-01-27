import React from 'react';
import configureMockStore from 'redux-mock-store';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import {
  useIsTransactionPayLoading,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TotalRow } from './total-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../../../hooks/useI18nContext');

const mockStore = configureMockStore([]);

function render() {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(<TotalRow />, mockStore(state));
}

describe('TotalRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useI18nContextMock = jest.mocked(useI18nContext);

  beforeEach(() => {
    jest.clearAllMocks();

    useI18nContextMock.mockReturnValue(((key: string) => {
      const translations: Record<string, string> = {
        total: 'Total',
      };
      return translations[key] ?? key;
    }) as ReturnType<typeof useI18nContext>);

    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '123.456' },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);
  });

  it('renders the total amount', () => {
    const { getByText } = render();
    expect(getByText('$123.46')).toBeInTheDocument();
  });

  it('renders skeleton when quotes are loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('total-row-skeleton')).toBeInTheDocument();
  });
});
