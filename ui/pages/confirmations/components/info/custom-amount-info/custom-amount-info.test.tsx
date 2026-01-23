import React from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import * as useTransactionCustomAmountModule from '../../../hooks/transactions/useTransactionCustomAmount';
import * as useTransactionCustomAmountAlertsModule from '../../../hooks/transactions/useTransactionCustomAmountAlerts';
import * as useAutomaticTransactionPayTokenModule from '../../../hooks/pay/useAutomaticTransactionPayToken';
import * as useTransactionPayMetricsModule from '../../../hooks/pay/useTransactionPayMetrics';
import * as useTransactionPayAvailableTokensModule from '../../../hooks/pay/useTransactionPayAvailableTokens';
import * as useTransactionPayDataModule from '../../../hooks/pay/useTransactionPayData';
import * as useTransactionPayTokenModule from '../../../hooks/pay/useTransactionPayToken';
import {
  CustomAmountInfo,
  CustomAmountInfoSkeleton,
} from './custom-amount-info';

jest.mock('../../../hooks/transactions/useTransactionCustomAmount');
jest.mock('../../../hooks/transactions/useTransactionCustomAmountAlerts');
jest.mock('../../../hooks/pay/useAutomaticTransactionPayToken');
jest.mock('../../../hooks/pay/useTransactionPayMetrics');
jest.mock('../../../hooks/pay/useTransactionPayAvailableTokens');
jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useTransactionPayToken');
jest.mock('../../transactions/custom-amount/custom-amount', () => ({
  CustomAmount: ({ amountFiat }: { amountFiat: string }) => (
    <div data-testid="custom-amount">{amountFiat}</div>
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

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;
const mockStore = configureMockStore([]);

const DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN = {
  amountFiat: '100',
  amountHuman: '50',
  amountHumanDebounced: '50',
  hasInput: false,
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

const DEFAULT_PAY_TOKEN_HOOK_RETURN = {
  isNative: false,
  payToken: undefined,
  setPayToken: jest.fn(),
};

const DEFAULT_ALERTS_HOOK_RETURN = {
  alertMessage: undefined,
  hideResults: false,
  disableUpdate: false,
};

function render({
  hasMax = false,
  disablePay = false,
  availableTokens = [MOCK_AVAILABLE_TOKEN],
  customAmountHookReturn = DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
  payTokenHookReturn = DEFAULT_PAY_TOKEN_HOOK_RETURN,
  alertsHookReturn = DEFAULT_ALERTS_HOOK_RETURN,
  isQuotesLoading = false,
  hasQuotes = false,
  sourceAmounts = [],
  requiredTokens = [],
}: {
  hasMax?: boolean;
  disablePay?: boolean;
  availableTokens?: (typeof MOCK_AVAILABLE_TOKEN)[];
  customAmountHookReturn?: typeof DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN;
  payTokenHookReturn?: typeof DEFAULT_PAY_TOKEN_HOOK_RETURN;
  alertsHookReturn?: typeof DEFAULT_ALERTS_HOOK_RETURN;
  isQuotesLoading?: boolean;
  hasQuotes?: boolean;
  sourceAmounts?: { targetTokenAddress: string }[];
  requiredTokens?: { address: string; skipIfBalance: boolean }[];
} = {}) {
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
    .mocked(useTransactionPayDataModule.useTransactionPayQuotes)
    .mockReturnValue(hasQuotes ? [{} as never] : undefined);
  jest
    .mocked(useTransactionPayDataModule.useIsTransactionPayLoading)
    .mockReturnValue(isQuotesLoading);
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
    .mocked(useTransactionPayTokenModule.useTransactionPayToken)
    .mockReturnValue(payTokenHookReturn);

  const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);

  return renderWithConfirmContextProvider(
    <CustomAmountInfo hasMax={hasMax} disablePay={disablePay} />,
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

  it('renders pay token amount when disablePay is false', () => {
    const { getByTestId } = render({ disablePay: false });
    expect(getByTestId('pay-token-amount')).toBeInTheDocument();
  });

  it('does not render pay token amount when disablePay is true', () => {
    const { queryByTestId } = render({ disablePay: true });
    expect(queryByTestId('pay-token-amount')).not.toBeInTheDocument();
  });

  it('renders pay with row when tokens available and disablePay is false', () => {
    const { getByTestId } = render({ disablePay: false });
    expect(getByTestId('pay-with-row')).toBeInTheDocument();
  });

  it('does not render pay with row when no tokens available', () => {
    const { queryByTestId } = render({ availableTokens: [] });
    expect(queryByTestId('pay-with-row')).not.toBeInTheDocument();
  });

  describe('percentage buttons', () => {
    it('renders percentage buttons when hasMax is true and tokens available', () => {
      const { getByTestId } = render({ hasMax: true });

      expect(getByTestId('percentage-button-25')).toBeInTheDocument();
      expect(getByTestId('percentage-button-50')).toBeInTheDocument();
      expect(getByTestId('percentage-button-75')).toBeInTheDocument();
      expect(getByTestId('percentage-button-100')).toBeInTheDocument();
    });

    it('does not render percentage buttons when hasMax is false', () => {
      const { queryByTestId } = render({ hasMax: false });

      expect(queryByTestId('percentage-button-25')).not.toBeInTheDocument();
      expect(queryByTestId('percentage-button-50')).not.toBeInTheDocument();
      expect(queryByTestId('percentage-button-75')).not.toBeInTheDocument();
      expect(queryByTestId('percentage-button-100')).not.toBeInTheDocument();
    });

    it('does not render percentage buttons when no tokens available', () => {
      const { queryByTestId } = render({ hasMax: true, availableTokens: [] });

      expect(queryByTestId('percentage-button-25')).not.toBeInTheDocument();
    });

    it('calls updatePendingAmountPercentage when percentage button clicked', () => {
      const updatePendingAmountPercentage = jest.fn();

      const { getByTestId } = render({
        hasMax: true,
        customAmountHookReturn: {
          ...DEFAULT_CUSTOM_AMOUNT_HOOK_RETURN,
          updatePendingAmountPercentage,
        },
      });

      fireEvent.click(getByTestId('percentage-button-50'));

      expect(updatePendingAmountPercentage).toHaveBeenCalledWith(50);
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
  });

  describe('overrideContent', () => {
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
        .mocked(useTransactionPayDataModule.useTransactionPayQuotes)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayDataModule.useIsTransactionPayLoading)
        .mockReturnValue(false);
      jest
        .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayDataModule.useTransactionPaySourceAmounts)
        .mockReturnValue([]);
      jest
        .mocked(useTransactionPayTokenModule.useTransactionPayToken)
        .mockReturnValue(DEFAULT_PAY_TOKEN_HOOK_RETURN);

      const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);

      const { getByTestId, queryByTestId } = renderWithConfirmContextProvider(
        <CustomAmountInfo
          overrideContent={(amountHuman) => (
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
    const { getByTestId } = renderWithConfirmContextProvider(
      <CustomAmountInfoSkeleton />,
      mockStore(state),
    );

    expect(getByTestId('custom-amount-info-skeleton')).toBeInTheDocument();
    expect(getByTestId('custom-amount-skeleton')).toBeInTheDocument();
    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
    expect(getByTestId('pay-with-row-skeleton')).toBeInTheDocument();
  });
});
