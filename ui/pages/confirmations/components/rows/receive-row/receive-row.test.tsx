import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import type {
  TransactionPayQuote,
  TransactionPayTotals,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useIsPaidByMetaMask } from '../../../hooks/pay/useIsPaidByMetaMask';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ReceiveRow, ReceiveRowProps } from './receive-row';

jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useIsPaidByMetaMask');
jest.mock('../../../../../hooks/money/useMoneyVaultApy', () => ({
  useMoneyVaultApy: jest.fn(),
}));

const mockStore = configureMockStore([]);

function getMoneyDepositState(
  stateOverride?: Parameters<typeof getMockConfirmStateForTransaction>[1],
) {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  const deposit = {
    ...base,
    type: TransactionType.batch,
    nestedTransactions: [
      { type: TransactionType.tokenMethodApprove },
      { type: TransactionType.moneyAccountDeposit },
    ],
  } as Parameters<typeof getMockConfirmStateForTransaction>[0];
  return getMockConfirmStateForTransaction(deposit, stateOverride);
}

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
  const useIsTransactionPayQuotePendingMock = jest.mocked(
    useIsTransactionPayQuotePending,
  );
  const useIsPaidByMetaMaskMock = jest.mocked(useIsPaidByMetaMask);
  const useMoneyVaultApyMock = jest.mocked(useMoneyVaultApy);

  beforeEach(() => {
    jest.resetAllMocks();

    useIsPaidByMetaMaskMock.mockReturnValue(false);
    useMoneyVaultApyMock.mockReturnValue({
      apyPercentFormatted: '6.2%',
    } as ReturnType<typeof useMoneyVaultApy>);

    useTransactionPayTotalsMock.mockReturnValue({
      isInputBased: false,
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.05' },
        metaMask: { usd: '0.25' },
      },
    } as TransactionPayTotals);

    useIsTransactionPayQuotePendingMock.mockReturnValue(false);

    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);
  });

  it('renders the youllReceive label', () => {
    const { getByText } = render();

    expect(getByText(messages.youllReceive.message)).toBeInTheDocument();
  });

  it('renders skeleton with label when loading', () => {
    useIsTransactionPayQuotePendingMock.mockReturnValue(true);

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

  it('uses the target amount for input-based totals', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      isInputBased: true,
      fees: {
        provider: { usd: '1.00' },
        sourceNetwork: { estimate: { usd: '0.20' } },
        targetNetwork: { usd: '0.05' },
        metaMask: { usd: '0.25' },
      },
      targetAmount: { fiat: '9', usd: '9' },
    } as TransactionPayTotals);

    const { getByTestId } = render({ inputAmountUsd: '10' });

    expect(getByTestId('receive-value')).toHaveTextContent('$9.00');
  });

  it('uses withdrawal fee calculation when isInputBased is missing', () => {
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

  it('does not subtract sponsored network gas from the receive amount', () => {
    useIsPaidByMetaMaskMock.mockReturnValue(true);

    const { getByTestId } = render({ inputAmountUsd: '0.05' });

    expect(getByTestId('receive-value')).toHaveTextContent('$0.05');
  });

  it('renders an empty value when there are no quotes', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { getByTestId } = render();

    expect(getByTestId('receive-value')).toHaveTextContent('');
  });

  it('renders an empty value when totals are not available', () => {
    useTransactionPayTotalsMock.mockReturnValue(undefined);

    const { getByTestId } = render();

    expect(getByTestId('receive-value')).toHaveTextContent('');
  });

  it('uses Text component (Small variant) instead of ConfirmInfoRowText', () => {
    const { getByTestId } = render({ variant: ConfirmInfoRowSize.Small });

    const value = getByTestId('receive-value');
    expect(value).toBeInTheDocument();
    expect(value).toHaveTextContent('$8.50');
  });

  it('opens the MetaMask USD dialog for moneyAccountDeposit transactions when the dotted receive value is clicked', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      isInputBased: true,
      targetAmount: { fiat: '100', usd: '100' },
    } as TransactionPayTotals);

    render(
      {
        inputAmountUsd: '100',
        variant: ConfirmInfoRowSize.Small,
      },
      getMoneyDepositState(),
    );

    const trigger = screen.getByTestId('receive-value');
    expect(trigger).toHaveTextContent('$100.00');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');

    fireEvent.click(trigger);

    expect(screen.getByTestId('money-usd-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('money-usd-dialog-title')).toHaveTextContent(
      "You'll receive $100.00 of MetaMask USD",
    );
    expect(
      screen.getByTestId('money-usd-dialog-earns-title'),
    ).toHaveTextContent('Earns up to 6.2% APY');

    fireEvent.click(screen.getByTestId('money-usd-dialog-close-button'));
    expect(screen.queryByTestId('money-usd-dialog')).not.toBeInTheDocument();
  });

  it('formats receive amounts with "$" and en-US separators for moneyAccountDeposit even when currentLocale is non-US', () => {
    useTransactionPayTotalsMock.mockReturnValue({
      isInputBased: true,
      targetAmount: { fiat: '1234.5', usd: '1234.5' },
    } as TransactionPayTotals);

    const state = getMoneyDepositState({
      metamask: {},
      localeMessages: { currentLocale: 'en_GB' },
    });

    render(
      {
        inputAmountUsd: '1234.5',
        variant: ConfirmInfoRowSize.Small,
      },
      state,
    );

    const trigger = screen.getByTestId('receive-value');
    expect(trigger).toHaveTextContent('$1,234.50');
    expect(trigger).not.toHaveTextContent('US$');
  });
});
