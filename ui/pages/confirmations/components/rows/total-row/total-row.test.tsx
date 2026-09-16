import React from 'react';
import configureMockStore from 'redux-mock-store';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import {
  useIsTransactionPayLoading,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import {
  useIsPaidByMetaMask,
  useSponsoredNetworkFeeFlags,
} from '../../../hooks/pay/useIsPaidByMetaMask';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { TotalRow, TotalRowProps } from './total-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useIsPaidByMetaMask');

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
  const useIsPaidByMetaMaskMock = jest.mocked(useIsPaidByMetaMask);
  const useSponsoredNetworkFeeFlagsMock = jest.mocked(
    useSponsoredNetworkFeeFlags,
  );
  beforeEach(() => {
    jest.clearAllMocks();

    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '123.456' },
    } as TransactionPayTotals);

    useIsTransactionPayLoadingMock.mockReturnValue(false);
    useIsPaidByMetaMaskMock.mockReturnValue(false);
    useSponsoredNetworkFeeFlagsMock.mockReturnValue({
      isSourceNetworkSponsored: false,
      isTargetNetworkSponsored: false,
    });
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

  it('always renders total in USD even when user currency is EUR', () => {
    const state = getMockPersonalSignConfirmState({
      metamask: { currentCurrency: 'eur' },
    });
    const { getByTestId } = renderWithConfirmContextProvider(
      <TotalRow />,
      mockStore(state),
    );

    expect(getByTestId('total-value')).toHaveTextContent('$123.46');
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

  it('excludes sponsored network gas from the total when paid by MetaMask', () => {
    useIsPaidByMetaMaskMock.mockReturnValue(true);
    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '0.29' },
      fees: {
        provider: { usd: '0' },
        metaMask: { usd: '0' },
        sourceNetwork: { estimate: { usd: '0' } },
        targetNetwork: { usd: '0.15' },
      },
    } as TransactionPayTotals);

    const { getByTestId } = render();

    expect(getByTestId('total-value')).toHaveTextContent('$0.14');
  });

  it('excludes only sponsored target gas on cross-chain deposits, keeping source gas', () => {
    useSponsoredNetworkFeeFlagsMock.mockReturnValue({
      isSourceNetworkSponsored: false,
      isTargetNetworkSponsored: true,
    });
    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '100.37' },
      fees: {
        provider: { usd: '0.14' },
        metaMask: { usd: '0' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.03' },
      },
    } as TransactionPayTotals);

    const { getByTestId } = render();

    // 100.37 - 0.03 target = 100.34 (source 0.20 and provider stay)
    expect(getByTestId('total-value')).toHaveTextContent('$100.34');
  });

  it('excludes source and target gas when both network legs are sponsored', () => {
    useSponsoredNetworkFeeFlagsMock.mockReturnValue({
      isSourceNetworkSponsored: true,
      isTargetNetworkSponsored: true,
    });
    useTransactionPayTotalsMock.mockReturnValue({
      total: { usd: '100.37' },
      fees: {
        provider: { usd: '0.14' },
        metaMask: { usd: '0' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.03' },
      },
    } as TransactionPayTotals);

    const { getByTestId } = render();

    // 100.37 - 0.20 - 0.03 = 100.14
    expect(getByTestId('total-value')).toHaveTextContent('$100.14');
  });
});
