import React from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import configureMockStore from 'redux-mock-store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import * as useTransactionCustomAmountModule from '../../../hooks/transactions/useTransactionCustomAmount';
import * as useTransactionCustomAmountAlertsModule from '../../../hooks/transactions/useTransactionCustomAmountAlerts';
import * as useAutomaticTransactionPayTokenModule from '../../../hooks/pay/useAutomaticTransactionPayToken';
import * as useTransactionPayMetricsModule from '../../../hooks/pay/useTransactionPayMetrics';
import * as useTransactionPayAvailableTokensModule from '../../../hooks/pay/useTransactionPayAvailableTokens';
import * as useTransactionPayDataModule from '../../../hooks/pay/useTransactionPayData';
import * as useTransactionPayTokenModule from '../../../hooks/pay/useTransactionPayToken';
import * as useTransactionPayWithdrawModule from '../../../hooks/pay/useTransactionPayWithdraw';
import * as usePayWithNoFeeTokenModule from '../../../hooks/pay/usePayWithNoFeeToken';
import * as useAccountNoFundsAlertModule from '../../../hooks/alerts/transactions/useAccountNoFundsAlert';
import {
  CustomAmountInfo,
  CustomAmountInfoSkeleton,
} from './custom-amount-info';

jest.mock('../../../hooks/transactions/useTransactionCustomAmount');
jest.mock('../../../hooks/transactions/useTransactionCustomAmountAlerts');
jest.mock('../../../hooks/pay/useAutomaticTransactionPayToken');
jest.mock('../../../hooks/pay/useTransactionPayPostQuote');
jest.mock('../../../hooks/pay/useTransactionPayWithdraw');
jest.mock('../../../hooks/pay/useTransactionPayMetrics');
jest.mock('../../../hooks/pay/useTransactionPayAvailableTokens');
jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../../hooks/pay/usePayWithNoFeeToken');
jest.mock('../../../hooks/alerts/transactions/useAccountNoFundsAlert');
jest.mock('../../transactions/custom-amount/custom-amount', () => ({
  CustomAmount: ({
    amountFiat,
    disabled,
    isLoading,
  }: {
    amountFiat: string;
    disabled?: boolean;
    isLoading?: boolean;
  }) =>
    isLoading ? (
      <div data-testid="custom-amount-skeleton" />
    ) : (
      <div
        data-testid="custom-amount"
        data-disabled={String(Boolean(disabled))}
      >
        {amountFiat}
      </div>
    ),
  CustomAmountSkeleton: () => <div data-testid="custom-amount-skeleton" />,
}));
jest.mock('../../pay-token-amount/pay-token-amount', () => ({
  PayTokenAmount: ({ amountHuman }: { amountHuman: string }) => (
    <div data-testid="pay-token-amount">{amountHuman}</div>
  ),
  PayTokenAmountSkeleton: () => <div data-testid="pay-token-amount-skeleton" />,
}));
jest.mock('../../rows/pay-with-row/pay-with-row', () => ({
  PayWithRow: () => <div data-testid="pay-with-row" />,
  PayWithRowSkeleton: () => <div data-testid="pay-with-row-skeleton" />,
}));
jest.mock('../../rows/bridge-fee-row/bridge-fee-row', () => ({
  BridgeFeeRow: () => <div data-testid="bridge-fee-row" />,
}));
jest.mock('../../rows/bridge-time-row/bridge-time-row', () => ({
  BridgeTimeRow: () => <div data-testid="bridge-time-row" />,
}));
jest.mock('../../rows/total-row/total-row', () => ({
  TotalRow: () => <div data-testid="total-row" />,
}));
// `ReceiveRow` is intentionally left unmocked: it renders either
// `receive-row-skeleton` or `receive-row` depending on quote-pending state, and
// the Perps Withdraw cases below assert on that distinction.

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

const mockStore = configureMockStore([]);

const DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN = {
  amountFiat: '100',
  amountHuman: '50',
  amountHumanDebounced: '50',
  hasAmount: true,
  hasInput: false,
  isDepositPrefillEnabled: false,
  isDepositPrefillLoading: false,
  isDepositPrefilled: false,
  isInputChanged: false,
  updatePendingAmount: jest.fn(),
  updatePendingAmountPercentage: jest.fn(),
};

const MOCK_AVAILABLE_TOKEN = {
  address: '0x123' as const,
  chainId: '0x1' as const,
  symbol: 'TST',
  decimals: 18,
  balanceFiat: '100',
  balanceHuman: '50',
  balanceRaw: '50000000000000000000',
  balanceUsd: '100',
};

const DEFAULT_ALERTS_HOOK_RETURN: {
  alertMessage?: string;
  hideResults: boolean;
  disableUpdate: boolean;
} = {
  alertMessage: undefined,
  hideResults: false,
  disableUpdate: false,
};

const MOCK_PRIMARY_REQUIRED_TOKEN = {
  address: '0xrequired',
  skipIfBalance: false,
  decimals: 18,
};

function render(
  options: {
    disableAutomaticToken?: boolean;
    disablePay?: boolean;
    displayPercentageButtons?: boolean;
    hidePayTokenAmount?: boolean;
    availableTokens?: (typeof MOCK_AVAILABLE_TOKEN)[];
    accountNoFundsAlert?: { key: string }[];
    customAmountHookReturn?: typeof DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN;
    alertsHookReturn?: typeof DEFAULT_ALERTS_HOOK_RETURN;
    transactionMeta?: TransactionMeta;
    isQuotesLoading?: boolean;
    isPostQuote?: boolean;
    hasQuotes?: boolean;
    hasPositiveRequiredAmount?: boolean;
    isNativePayToken?: boolean;
    isNoFeePayToken?: boolean;
    sourceAmounts?: { targetTokenAddress: string }[];
    requiredTokens?: { address: string; skipIfBalance: boolean }[];
    primaryRequiredToken?: typeof MOCK_PRIMARY_REQUIRED_TOKEN | undefined;
    withdraw?: { isWithdraw: boolean; canSelectWithdrawToken: boolean };
  } = {},
) {
  const {
    disableAutomaticToken,
    disablePay = false,
    displayPercentageButtons = false,
    hidePayTokenAmount = false,
    availableTokens = [MOCK_AVAILABLE_TOKEN],
    accountNoFundsAlert = [],
    customAmountHookReturn = DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
    alertsHookReturn = DEFAULT_ALERTS_HOOK_RETURN,
    transactionMeta = MOCK_TRANSACTION_META,
    isQuotesLoading = false,
    isPostQuote = false,
    hasQuotes = false,
    hasPositiveRequiredAmount = true,
    isNativePayToken = false,
    isNoFeePayToken = false,
    sourceAmounts = [],
    requiredTokens = [],
    withdraw = { isWithdraw: false, canSelectWithdrawToken: false },
  } = options;
  const primaryRequiredToken = Object.prototype.hasOwnProperty.call(
    options,
    'primaryRequiredToken',
  )
    ? options.primaryRequiredToken
    : MOCK_PRIMARY_REQUIRED_TOKEN;
  jest
    .mocked(useTransactionCustomAmountModule.useTransactionCustomAmount)
    .mockReturnValue(customAmountHookReturn);
  jest
    .mocked(
      useTransactionCustomAmountAlertsModule.useTransactionCustomAmountAlerts,
    )
    .mockReturnValue(alertsHookReturn);
  jest
    .mocked(
      useAutomaticTransactionPayTokenModule.useAutomaticTransactionPayToken,
    )
    .mockReturnValue(undefined);
  jest
    .mocked(useTransactionPayMetricsModule.useTransactionPayMetrics)
    .mockReturnValue(undefined);
  jest
    .mocked(
      useTransactionPayAvailableTokensModule.useTransactionPayAvailableTokens,
    )
    .mockReturnValue(
      availableTokens as ReturnType<
        typeof useTransactionPayAvailableTokensModule.useTransactionPayAvailableTokens
      >,
    );
  jest
    .mocked(useAccountNoFundsAlertModule.useAccountNoFundsAlert)
    .mockReturnValue(accountNoFundsAlert as never);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayQuotes)
    .mockReturnValue(
      hasQuotes
        ? [{ strategy: TransactionPayStrategy.Relay } as never]
        : undefined,
    );
  jest
    .mocked(useTransactionPayDataModule.useIsTransactionPayQuotePending)
    .mockReturnValue(
      transactionMeta.type === TransactionType.perpsWithdraw
        ? hasPositiveRequiredAmount && (isQuotesLoading || !isPostQuote)
        : isQuotesLoading,
    );
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayHasExecutableQuote)
    .mockReturnValue(hasQuotes);
  jest
    .mocked(
      useTransactionPayDataModule.useTransactionPayHasPositiveRequiredAmount,
    )
    .mockReturnValue(hasPositiveRequiredAmount);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
    .mockReturnValue(
      requiredTokens as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayRequiredTokens
      >,
    );
  jest
    .mocked(useTransactionPayDataModule.useTransactionPaySourceAmounts)
    .mockReturnValue(
      sourceAmounts as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPaySourceAmounts
      >,
    );
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken)
    .mockReturnValue(
      primaryRequiredToken as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken
      >,
    );
  jest
    .mocked(useTransactionPayTokenModule.useTransactionPayToken)
    .mockReturnValue({
      isNative: isNativePayToken,
      payToken: MOCK_AVAILABLE_TOKEN as never,
      setPayToken: jest.fn(),
    });
  jest.mocked(usePayWithNoFeeTokenModule.usePayWithNoFeeToken).mockReturnValue({
    isNoFeeToken: () => isNoFeePayToken,
    renderNoFeeTag: () => null,
  });
  jest
    .mocked(useTransactionPayWithdrawModule.useTransactionPayWithdraw)
    .mockReturnValue(withdraw);

  const state = getMockConfirmStateForTransaction(transactionMeta);

  return renderWithConfirmContextProvider(
    <CustomAmountInfo
      disableAutomaticToken={disableAutomaticToken}
      disablePay={disablePay}
      displayPercentageButtons={displayPercentageButtons}
      hidePayTokenAmount={hidePayTokenAmount}
    />,
    mockStore(state),
  );
}

describe('CustomAmountInfo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders custom amount component', () => {
    const { getByTestId } = render();
    expect(getByTestId('custom-amount')).toBeInTheDocument();
  });

  it('shows amount skeleton while deposit prefill is loading', () => {
    const { getByTestId, queryByTestId } = render({
      customAmountHookReturn: {
        ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
        amountFiat: '0',
        isDepositPrefillEnabled: true,
        isDepositPrefillLoading: true,
        isDepositPrefilled: false,
      },
    });

    expect(getByTestId('custom-amount-skeleton')).toBeInTheDocument();
    expect(queryByTestId('custom-amount')).not.toBeInTheDocument();
  });

  it('does not show amount skeleton for deposit prefill loading when account has no funds', () => {
    const { getByTestId, queryByTestId } = render({
      accountNoFundsAlert: [{ key: 'accountNoFunds' }],
      customAmountHookReturn: {
        ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
        amountFiat: '0',
        isDepositPrefillEnabled: true,
        isDepositPrefillLoading: true,
        isDepositPrefilled: false,
      },
    });

    expect(getByTestId('custom-amount')).toBeInTheDocument();
    expect(queryByTestId('custom-amount-skeleton')).not.toBeInTheDocument();
  });

  it('keeps the amount visible when deposit prefill is enabled but not loading', () => {
    const { getByTestId, queryByTestId } = render({
      customAmountHookReturn: {
        ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
        amountFiat: '123',
        isDepositPrefillEnabled: true,
        isDepositPrefillLoading: false,
        isDepositPrefilled: false,
      },
    });

    expect(getByTestId('custom-amount')).toHaveTextContent('123');
    expect(queryByTestId('custom-amount-skeleton')).not.toBeInTheDocument();
  });

  it('calls useAutomaticTransactionPayToken with disable false when both props unset', () => {
    render();
    expect(
      useAutomaticTransactionPayTokenModule.useAutomaticTransactionPayToken,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        disable: false,
      }),
    );
  });

  it('calls useAutomaticTransactionPayToken with disable true when disableAutomaticToken is true', () => {
    render({ disableAutomaticToken: true });
    expect(
      useAutomaticTransactionPayTokenModule.useAutomaticTransactionPayToken,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        disable: true,
      }),
    );
  });

  it('calls useAutomaticTransactionPayToken with disable true when disablePay is true', () => {
    render({ disablePay: true });
    expect(
      useAutomaticTransactionPayTokenModule.useAutomaticTransactionPayToken,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        disable: true,
      }),
    );
  });

  it('renders pay token amount when disablePay is false', () => {
    const { getByTestId } = render({ disablePay: false });
    expect(getByTestId('pay-token-amount')).toBeInTheDocument();
  });

  it('does not render pay token amount when disablePay is true', () => {
    const { queryByTestId } = render({ disablePay: true });
    expect(queryByTestId('pay-token-amount')).not.toBeInTheDocument();
  });

  it('does not render pay token amount when hidePayTokenAmount is true', () => {
    const { queryByTestId, getByTestId } = render({
      hidePayTokenAmount: true,
      disablePay: false,
    });
    expect(queryByTestId('pay-token-amount')).not.toBeInTheDocument();
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  describe('pay with placement', () => {
    it('renders the bottom pay with row in the empty state', () => {
      const { getByTestId } = render({
        disablePay: false,
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          hasInput: false,
        },
      });

      expect(getByTestId('pay-with-row')).toBeInTheDocument();
    });

    it('keeps the bottom pay with row once an amount is entered', () => {
      const { getByTestId } = render({
        disablePay: false,
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          hasInput: true,
        },
      });

      expect(getByTestId('pay-with-row')).toBeInTheDocument();
    });

    it('does not render the pay with row when disablePay is true', () => {
      const { queryByTestId } = render({ disablePay: true });

      expect(queryByTestId('pay-with-row')).not.toBeInTheDocument();
    });
  });

  describe('input disabled state', () => {
    it('disables the input when no tokens are available', () => {
      const { getByTestId } = render({ availableTokens: [] });

      expect(getByTestId('custom-amount')).toHaveAttribute(
        'data-disabled',
        'true',
      );
    });
  });

  describe('awaiting required token', () => {
    it('renders the skeleton when pay is enabled but no primary required token is resolved', () => {
      const { getByTestId, queryByTestId } = render({
        disablePay: false,
        primaryRequiredToken: undefined,
      });

      expect(getByTestId('custom-amount-info-skeleton')).toBeInTheDocument();
      expect(queryByTestId('custom-amount-info')).not.toBeInTheDocument();
    });

    it('does not render the skeleton when pay is disabled and no primary required token is resolved', () => {
      const { getByTestId, queryByTestId } = render({
        disablePay: true,
        primaryRequiredToken: undefined,
      });

      expect(getByTestId('custom-amount-info')).toBeInTheDocument();
      expect(
        queryByTestId('custom-amount-info-skeleton'),
      ).not.toBeInTheDocument();
    });

    it('renders the full UI once a primary required token is resolved', () => {
      const { getByTestId, queryByTestId } = render({
        disablePay: false,
      });

      expect(getByTestId('custom-amount-info')).toBeInTheDocument();
      expect(
        queryByTestId('custom-amount-info-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders the pay with selector when tokens available and disablePay is false', () => {
    const { getByTestId } = render({ disablePay: false });
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  it('keeps the pay with selector mounted when no tokens are available yet', () => {
    const { getByTestId } = render({ availableTokens: [] });
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  describe('percentage buttons', () => {
    // The shortcuts are opted into by the money-account flows via the
    // displayPercentageButtons prop.
    const renderMoneyAccount = (options: Parameters<typeof render>[0] = {}) =>
      render({
        ...options,
        displayPercentageButtons: true,
      });

    it('is not rendered when displayPercentageButtons is not set', () => {
      const { queryByTestId } = render();

      expect(queryByTestId('percentage-buttons')).not.toBeInTheDocument();
    });

    it('renders 10%, 25%, 50%, and 90% by default', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount();

      expect(getByTestId('percentage-buttons')).toBeInTheDocument();
      expect(getByTestId('percentage-button-10')).toBeInTheDocument();
      expect(getByTestId('percentage-button-25')).toBeInTheDocument();
      expect(getByTestId('percentage-button-50')).toBeInTheDocument();
      expect(getByTestId('percentage-button-90')).toBeInTheDocument();
      expect(queryByTestId('percentage-button-100')).not.toBeInTheDocument();
    });

    it('replaces 90% with Max for no-fee (fixed-spread) tokens', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount({
        isNoFeePayToken: true,
      });

      expect(getByTestId('percentage-button-100')).toHaveTextContent('Max');
      expect(queryByTestId('percentage-button-90')).not.toBeInTheDocument();
    });

    it('keeps 90% for tokens that are not no-fee', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount({
        isNoFeePayToken: false,
      });

      expect(getByTestId('percentage-button-90')).toBeInTheDocument();
      expect(queryByTestId('percentage-button-100')).not.toBeInTheDocument();
    });

    it('always shows Max on withdraw, irrespective of the selected token', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount({
        isNoFeePayToken: false,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: false },
      });

      expect(getByTestId('percentage-button-100')).toHaveTextContent('Max');
      expect(queryByTestId('percentage-button-90')).not.toBeInTheDocument();
    });

    it('always shows Max on withdraw when the pay token is native', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount({
        isNoFeePayToken: false,
        isNativePayToken: true,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: false },
      });

      expect(getByTestId('percentage-button-100')).toHaveTextContent('Max');
      expect(queryByTestId('percentage-button-90')).not.toBeInTheDocument();
    });

    it('keeps 90% when the no-fee token is native', () => {
      const { getByTestId, queryByTestId } = renderMoneyAccount({
        isNoFeePayToken: true,
        isNativePayToken: true,
      });

      expect(getByTestId('percentage-button-90')).toBeInTheDocument();
      expect(queryByTestId('percentage-button-100')).not.toBeInTheDocument();
    });

    it('applies the selected percentage to the amount', () => {
      const updatePendingAmountPercentage = jest.fn();
      const { getByTestId } = renderMoneyAccount({
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          updatePendingAmountPercentage,
        },
      });

      getByTestId('percentage-button-50').click();

      expect(updatePendingAmountPercentage).toHaveBeenCalledWith(50);
    });

    it('disables percentage buttons when no tokens are available', () => {
      const updatePendingAmountPercentage = jest.fn();
      const { getByTestId } = renderMoneyAccount({
        availableTokens: [],
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          updatePendingAmountPercentage,
        },
      });

      expect(getByTestId('percentage-button-50')).toBeDisabled();
      getByTestId('percentage-button-50').click();
      expect(updatePendingAmountPercentage).not.toHaveBeenCalled();
    });
  });

  describe('result rows', () => {
    it('renders result rows when quotes are loading', () => {
      const { getByTestId } = render({ isQuotesLoading: true });

      expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(getByTestId('bridge-time-row')).toBeInTheDocument();
      expect(getByTestId('total-row')).toBeInTheDocument();
    });

    it('renders result rows when quotes exist', () => {
      const { getByTestId } = render({ hasQuotes: true });

      expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(getByTestId('bridge-time-row')).toBeInTheDocument();
      expect(getByTestId('total-row')).toBeInTheDocument();
    });

    it('does not render result rows when no quotes and not loading', () => {
      const { queryByTestId } = render({
        hasQuotes: false,
        isQuotesLoading: false,
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
    });

    it('does not render result rows before an amount is entered', () => {
      const { queryByTestId } = render({
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          hasAmount: false,
        },
        hasQuotes: true,
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('bridge-time-row')).not.toBeInTheDocument();
      expect(queryByTestId('total-row')).not.toBeInTheDocument();
    });

    it('does not render result rows before an amount is entered while quotes load', () => {
      const { queryByTestId } = render({
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          hasAmount: false,
        },
        isQuotesLoading: true,
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('bridge-time-row')).not.toBeInTheDocument();
      expect(queryByTestId('total-row')).not.toBeInTheDocument();
    });

    it('does not render Perps Withdraw result rows before an amount is entered even when the required amount is positive', () => {
      const transactionMeta = {
        ...genUnapprovedContractInteractionConfirmation(),
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      const { queryByTestId } = render({
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          hasAmount: false,
        },
        transactionMeta,
        hasPositiveRequiredAmount: true,
        hasQuotes: true,
        isPostQuote: true,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: true },
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('bridge-time-row')).not.toBeInTheDocument();
      expect(queryByTestId('receive-row')).not.toBeInTheDocument();
    });

    it('renders Perps Withdraw result rows while post-quote setup is pending', () => {
      const transactionMeta = {
        ...genUnapprovedContractInteractionConfirmation(),
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      const { queryByTestId } = render({
        transactionMeta,
        hasQuotes: true,
        isPostQuote: false,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: true },
      });

      expect(queryByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(queryByTestId('bridge-time-row')).toBeInTheDocument();
      expect(queryByTestId('receive-row-skeleton')).toBeInTheDocument();
      expect(queryByTestId('receive-row')).not.toBeInTheDocument();
    });

    it('does not render Perps Withdraw result rows before an amount is entered', () => {
      const transactionMeta = {
        ...genUnapprovedContractInteractionConfirmation(),
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      const { queryByTestId } = render({
        transactionMeta,
        hasPositiveRequiredAmount: false,
        hasQuotes: true,
        isPostQuote: false,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: true },
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('bridge-time-row')).not.toBeInTheDocument();
      expect(queryByTestId('receive-row-skeleton')).not.toBeInTheDocument();
    });

    it('renders Perps Withdraw result rows when the post-quote route is ready', () => {
      const transactionMeta = {
        ...genUnapprovedContractInteractionConfirmation(),
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      const { getByTestId } = render({
        transactionMeta,
        hasQuotes: true,
        isPostQuote: true,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: true },
      });

      expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(getByTestId('bridge-time-row')).toBeInTheDocument();
      expect(getByTestId('receive-row')).toBeInTheDocument();
    });

    it('renders the receive row for a withdraw when post-quote is enabled', () => {
      const { getByTestId, queryByTestId } = render({
        hasQuotes: true,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: true },
      });

      expect(getByTestId('receive-row')).toBeInTheDocument();
      expect(queryByTestId('total-row')).not.toBeInTheDocument();
    });

    it('renders the total row for a withdraw when post-quote is disabled', () => {
      const { getByTestId, queryByTestId } = render({
        hasQuotes: true,
        withdraw: { isWithdraw: true, canSelectWithdrawToken: false },
      });

      expect(getByTestId('total-row')).toBeInTheDocument();
      expect(queryByTestId('receive-row')).not.toBeInTheDocument();
    });
  });

  describe('withdraw amount input', () => {
    it('keeps the amount input enabled without wallet tokens when post-quote is disabled', () => {
      const { getByTestId } = render({
        availableTokens: [],
        withdraw: { isWithdraw: true, canSelectWithdrawToken: false },
      });

      expect(getByTestId('custom-amount')).toHaveAttribute(
        'data-disabled',
        'false',
      );
    });

    it('disables the amount input without wallet tokens for non-withdraw flows', () => {
      const { getByTestId } = render({
        availableTokens: [],
        withdraw: { isWithdraw: false, canSelectWithdrawToken: false },
      });

      expect(getByTestId('custom-amount')).toHaveAttribute(
        'data-disabled',
        'true',
      );
    });
  });

  it('does not render alert body text when reason and message are the same', () => {
    const { queryByText } = render({
      alertsHookReturn: {
        alertMessage: undefined,
        hideResults: true,
        disableUpdate: false,
      },
    });

    expect(
      queryByText(messages.alertInsufficientPayTokenBalance.message),
    ).not.toBeInTheDocument();
  });

  it('renders alert message as body text when reason differs from message', () => {
    const { getByText } = render({
      alertsHookReturn: {
        alertMessage: messages.alertNoPayTokenQuotesMessage.message,
        hideResults: true,
        disableUpdate: false,
      },
    });

    expect(
      getByText(messages.alertNoPayTokenQuotesMessage.message),
    ).toBeInTheDocument();
  });

  describe('overrideCenterContent', () => {
    it('renders override content when provided', () => {
      jest
        .mocked(useTransactionCustomAmountModule.useTransactionCustomAmount)
        .mockReturnValue(DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN);
      jest
        .mocked(
          useTransactionCustomAmountAlertsModule.useTransactionCustomAmountAlerts,
        )
        .mockReturnValue(DEFAULT_ALERTS_HOOK_RETURN);
      jest
        .mocked(
          useAutomaticTransactionPayTokenModule.useAutomaticTransactionPayToken,
        )
        .mockReturnValue(undefined);
      jest
        .mocked(useTransactionPayMetricsModule.useTransactionPayMetrics)
        .mockReturnValue(undefined);
      jest
        .mocked(
          useTransactionPayAvailableTokensModule.useTransactionPayAvailableTokens,
        )
        .mockReturnValue([MOCK_AVAILABLE_TOKEN] as ReturnType<
          typeof useTransactionPayAvailableTokensModule.useTransactionPayAvailableTokens
        >);
      jest
        .mocked(useAccountNoFundsAlertModule.useAccountNoFundsAlert)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayDataModule.useTransactionPayQuotes)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayDataModule.useIsTransactionPayQuotePending)
        .mockReturnValue(false);
      jest
        .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayDataModule.useTransactionPaySourceAmounts)
        .mockReturnValue([]);
      jest
        .mocked(
          useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken,
        )
        .mockReturnValue({ skipIfBalance: false } as ReturnType<
          typeof useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken
        >);
      jest
        .mocked(useTransactionPayTokenModule.useTransactionPayToken)
        .mockReturnValue({
          isNative: false,
          payToken: undefined,
          setPayToken: jest.fn(),
        });
      jest
        .mocked(usePayWithNoFeeTokenModule.usePayWithNoFeeToken)
        .mockReturnValue({
          isNoFeeToken: () => false,
          renderNoFeeTag: () => null,
        });
      jest
        .mocked(useTransactionPayWithdrawModule.useTransactionPayWithdraw)
        .mockReturnValue({
          isWithdraw: false,
          canSelectWithdrawToken: false,
        });

      const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);

      const { getByTestId, queryByTestId } = renderWithConfirmContextProvider(
        <CustomAmountInfo
          overrideCenterContent={(amountHuman) => (
            <div data-testid="override-content">{amountHuman}</div>
          )}
        />,
        mockStore(state),
      );

      expect(getByTestId('override-content')).toBeInTheDocument();
      expect(getByTestId('override-content').textContent).toBe('50');
      expect(queryByTestId('pay-token-amount')).not.toBeInTheDocument();
    });
  });
});

describe('CustomAmountInfoSkeleton', () => {
  it('renders skeleton components', () => {
    const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);
    const { getByTestId, queryByTestId } = renderWithConfirmContextProvider(
      <CustomAmountInfoSkeleton />,
      mockStore(state),
    );

    expect(getByTestId('custom-amount-info-skeleton')).toBeInTheDocument();
    expect(getByTestId('custom-amount-skeleton')).toBeInTheDocument();
    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
    expect(
      queryByTestId('percentage-buttons-skeleton'),
    ).not.toBeInTheDocument();
  });

  it('renders the percentage buttons skeleton when the flow displays them', () => {
    const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);
    const { getByTestId } = renderWithConfirmContextProvider(
      <CustomAmountInfoSkeleton displayPercentageButtons />,
      mockStore(state),
    );

    expect(getByTestId('percentage-buttons-skeleton')).toBeInTheDocument();
  });
});
