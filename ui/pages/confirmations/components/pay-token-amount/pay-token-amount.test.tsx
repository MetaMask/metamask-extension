import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../test/data/confirmations/helper';
import { useTokenFiatRates } from '../../hooks/tokens/useTokenFiatRates';
import { useTransactionPayToken } from '../../hooks/pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
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
