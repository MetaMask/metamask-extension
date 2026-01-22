import React from 'react';
import configureMockStore from 'redux-mock-store';
import type {
  TransactionPayQuote,
  TransactionPayTotals,
} from '@metamask/transaction-pay-controller';
import type { Hex, Json } from '@metamask/utils';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { BridgeTimeRow } from './bridge-time-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../context/confirm');

const mockStore = configureMockStore([]);

function render() {
  const state = getMockPersonalSignConfirmState();
  return renderWithProvider(<BridgeTimeRow />, mockStore(state));
}

describe('BridgeTimeRow', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useI18nContextMock = jest.mocked(useI18nContext);
  const useConfirmContextMock = jest.mocked(useConfirmContext);

  beforeEach(() => {
    jest.resetAllMocks();

    useI18nContextMock.mockReturnValue(((key: string) => {
      const translations: Record<string, string> = {
        estimatedTime: 'Estimated time',
        second: 'sec',
        minute: 'min',
      };
      return translations[key] ?? key;
    }) as ReturnType<typeof useI18nContext>);

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        chainId: '0x1' as Hex,
      },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
    } as ReturnType<typeof useConfirmContext>);

    useIsTransactionPayLoadingMock.mockReturnValue(false);

    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      isNative: undefined,
      setPayToken: jest.fn(),
    });
  });

  it('renders less than 1 min for durations under 30 seconds', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      estimatedDuration: 29,
    } as TransactionPayTotals);

    const { getByTestId } = render();
    expect(getByTestId('bridge-time-value')).toHaveTextContent('< 1 min');
  });

  it('renders 1 min for durations between 30 and 60 seconds', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      estimatedDuration: 45,
    } as TransactionPayTotals);

    const { getByTestId } = render();
    expect(getByTestId('bridge-time-value')).toHaveTextContent('1 min');
  });

  it('renders 2 min for durations over 60 seconds', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      estimatedDuration: 61,
    } as TransactionPayTotals);

    const { getByTestId } = render();
    expect(getByTestId('bridge-time-value')).toHaveTextContent('2 min');
  });

  it('renders total estimated time if payment token on same chain', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      estimatedDuration: 120,
    } as TransactionPayTotals);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        chainId: '0x1' as Hex,
        address: '0x123' as Hex,
        symbol: 'TST',
        decimals: 18,
        balanceFiat: '100',
        balanceHuman: '50',
        balanceRaw: '50000000000000000000',
        balanceUsd: '100',
      },
      isNative: false,
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    const { getByTestId } = render();

    expect(getByTestId('bridge-time-value')).toHaveTextContent('< 10 sec');
  });

  it('renders skeleton if quotes loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('bridge-time-row-skeleton')).toBeInTheDocument();
  });
});
