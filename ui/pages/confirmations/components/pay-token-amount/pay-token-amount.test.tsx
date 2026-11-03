import React from 'react';
import configureMockStore from 'redux-mock-store';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../test/data/confirmations/helper';
import { useTokenFiatRates } from '../../hooks/tokens/useTokenFiatRates';
import { useTransactionPayToken } from '../../hooks/pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayTotals,
} from '../../hooks/pay/useTransactionPayData';
import { PayTokenAmount } from './pay-token-amount';

jest.mock('../../hooks/tokens/useTokenFiatRates');
jest.mock('../../hooks/pay/useTransactionPayToken');
jest.mock('../../hooks/pay/useTransactionPayData');

const ASSET_AMOUNT_MOCK = '100';
const ASSET_FIAT_RATE_MOCK = 10;
const PAY_TOKEN_FIAT_RATE_MOCK = 2;
const PAY_TOKEN_SYMBOL_MOCK = 'TST';
const CHAIN_ID_MOCK = '0x456';
const ADDRESS_MOCK = '0xdef';

const mockStore = configureMockStore([]);

function render({ disabled = false } = {}) {
  const state = getMockPersonalSignConfirmState();

  return renderWithConfirmContextProvider(
    <PayTokenAmount amountHuman={ASSET_AMOUNT_MOCK} disabled={disabled} />,
    mockStore(state),
  );
}

describe('PayTokenAmount', () => {
  const useTokenFiatRatesMock = jest.mocked(useTokenFiatRates);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const useTransactionPayIsMaxAmountMock = jest.mocked(
    useTransactionPayIsMaxAmount,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTokenFiatRatesMock.mockReturnValue([
      PAY_TOKEN_FIAT_RATE_MOCK,
      ASSET_FIAT_RATE_MOCK,
    ]);

    useTransactionPayTokenMock.mockReturnValue({
      isNative: false,
      payToken: {
        chainId: CHAIN_ID_MOCK,
        address: ADDRESS_MOCK,
        symbol: PAY_TOKEN_SYMBOL_MOCK,
        decimals: 18,
        balanceFiat: '100',
        balanceHuman: '50',
        balanceRaw: '50000000000000000000',
        balanceUsd: '100',
      },
      setPayToken: jest.fn(),
    } as ReturnType<typeof useTransactionPayToken>);

    useIsTransactionPayLoadingMock.mockReturnValue(false);
    useTransactionPayIsMaxAmountMock.mockReturnValue(false);
  });

  it('renders equivalent pay token value', () => {
    const { getByText } = render();
    expect(getByText('500', { exact: false })).toBeInTheDocument();
  });

  it('renders the Core source amount for a Solana payment token', () => {
    useTransactionPayTokenMock.mockReturnValue({
      isNative: true,
      payToken: {
        accountId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:SoLAddress111111111111111111111111111111111',
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        balanceFiat: '150',
        balanceHuman: '1.5',
        balanceRaw: '1500000000',
        balanceUsd: '150',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        decimals: 9,
        symbol: 'SOL',
        walletAccountId: 'solana-account-id',
      },
      setPayToken: jest.fn(),
    });
    jest.mocked(useTransactionPayTotals).mockReturnValue({
      sourceAmount: { human: '0.25', raw: '250000000', fiat: '25', usd: '25' },
    } as TransactionPayTotals);

    const { getByTestId } = render();

    expect(useTokenFiatRatesMock).toHaveBeenCalledWith([]);
    expect(getByTestId('pay-token-amount')).toHaveTextContent('0.25 SOL');
  });

  it('renders a skeleton for a Solana payment token without totals', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        accountId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:SoLAddress111111111111111111111111111111111',
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        balanceFiat: '150',
        balanceHuman: '1.5',
        balanceRaw: '1500000000',
        balanceUsd: '150',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        decimals: 9,
        symbol: 'SOL',
        walletAccountId: 'solana-account-id',
      },
      setPayToken: jest.fn(),
    });

    const { getByTestId } = render();

    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
  });

  it('renders pay token symbol', () => {
    const { getByText } = render();
    expect(
      getByText(PAY_TOKEN_SYMBOL_MOCK, { exact: false }),
    ).toBeInTheDocument();
  });

  it('renders skeleton if missing fiat rate', () => {
    useTokenFiatRatesMock.mockReturnValue([undefined, undefined]);

    const { getByTestId } = render();

    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
  });

  it('returns fixed value if disabled', () => {
    const { getByText } = render({ disabled: true });
    expect(getByText('0 ETH')).toBeInTheDocument();
  });

  it('renders skeleton if quotes loading and max amount selected', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);
    useTransactionPayIsMaxAmountMock.mockReturnValue(true);

    const { getByTestId } = render();

    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
  });

  it('renders value if quotes loading but max amount not selected', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);
    useTransactionPayIsMaxAmountMock.mockReturnValue(false);

    const { getByText } = render();

    expect(getByText('500', { exact: false })).toBeInTheDocument();
  });
});
