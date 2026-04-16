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
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { BridgeFeeRow, BridgeFeeRowProps } from './bridge-fee-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../../../hooks/useI18nContext');

const mockStore = configureMockStore([]);

function render(props: BridgeFeeRowProps = {}) {
  const state = getMockPersonalSignConfirmState();
  return renderWithConfirmContextProvider(
    <BridgeFeeRow {...props} />,
    mockStore(state),
  );
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

  it('renders skeleton with label when loading (Default variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByTestId, getByText } = render();

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row-skeleton')).not.toBeInTheDocument();
    expect(getByText('Transaction fee')).toBeInTheDocument();
  });

  it('renders full skeletons without labels when loading (Small variant)', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    const { getByTestId, queryByText } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row-skeleton')).toBeInTheDocument();
    expect(getByTestId('metamask-fee-row-skeleton')).toBeInTheDocument();
    expect(queryByText('Transaction fee')).not.toBeInTheDocument();
    expect(queryByText('MetaMask fee')).not.toBeInTheDocument();
  });

  it('does not render metamask fee with Default variant', () => {
    const { getByTestId, queryByTestId } = render();

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });

  it('renders metamask fee with Small variant when quotes exist', () => {
    const { getByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(getByTestId('metamask-fee-row')).toBeInTheDocument();
  });

  it('does not render metamask fee if no quotes (Small variant)', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId, queryByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
    expect(queryByTestId('metamask-fee-row')).not.toBeInTheDocument();
  });

  it('renders fee value with ConfirmInfoRowText for Default variant', () => {
    const { getByTestId } = render();

    const feeValue = getByTestId('transaction-fee-value');
    expect(feeValue).toBeInTheDocument();
    expect(feeValue).toHaveTextContent('$1.23');
  });

  it('renders fee value with Text component for Small variant', () => {
    const { getByTestId } = render({
      variant: ConfirmInfoRowSize.Small,
    });

    const feeValue = getByTestId('transaction-fee-value');
    expect(feeValue).toBeInTheDocument();
    expect(feeValue).toHaveTextContent('$1.23');
  });
});
