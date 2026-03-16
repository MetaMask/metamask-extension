import React from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
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
import { MusdConversionInfo } from './musd-conversion-info';

jest.mock('../../../hooks/transactions/useTransactionCustomAmount');
jest.mock('../../../hooks/transactions/useTransactionCustomAmountAlerts');
jest.mock('../../../hooks/pay/useAutomaticTransactionPayToken');
jest.mock('../../../hooks/pay/useTransactionPayMetrics');
jest.mock('../../../hooks/pay/useTransactionPayAvailableTokens');
jest.mock('../../../hooks/pay/useTransactionPayData');
jest.mock('../../../hooks/pay/useTransactionPayToken');

jest.mock('./musd-override-content', () => ({
  MusdOverrideContent: ({ amountHuman }: { amountHuman: string }) => (
    <div data-testid="musd-override-content">{amountHuman}</div>
  ),
}));

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
jest.mock('../../rows/claimable-bonus-row/claimable-bonus-row', () => ({
  ClaimableBonusRow: () => <div data-testid="claimable-bonus-row" />,
}));

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

const MOCK_AVAILABLE_TOKEN = {
  address: '0x123' as const,
  chainId: '0x1' as const,
  symbol: 'USDC',
  decimals: 18,
  balanceFiat: '100',
  balanceHuman: '50',
  balanceRaw: '50000000000000000000',
  balanceUsd: '100',
};

const mockStore = configureMockStore([]);

function setupDefaultMocks({
  isQuotesLoading = false,
  hasQuotes = false,
  hideResults = false,
}: {
  isQuotesLoading?: boolean;
  hasQuotes?: boolean;
  hideResults?: boolean;
} = {}) {
  jest
    .mocked(useTransactionCustomAmountModule.useTransactionCustomAmount)
    .mockReturnValue({
      amountFiat: '100',
      amountHuman: '50',
      amountHumanDebounced: '50',
      hasInput: false,
      isInputChanged: false,
      updatePendingAmount: jest.fn(),
      updatePendingAmountPercentage: jest.fn(),
    });
  jest
    .mocked(
      useTransactionCustomAmountAlertsModule.useTransactionCustomAmountAlerts,
    )
    .mockReturnValue({
      alertMessage: undefined,
      hideResults,
      disableUpdate: false,
    });
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
    .mockReturnValue(hasQuotes ? [{} as never] : undefined);
  jest
    .mocked(useTransactionPayDataModule.useIsTransactionPayLoading)
    .mockReturnValue(isQuotesLoading);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
    .mockReturnValue([]);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPaySourceAmounts)
    .mockReturnValue([]);
  jest
    .mocked(useTransactionPayTokenModule.useTransactionPayToken)
    .mockReturnValue({
      isNative: false,
      payToken: undefined,
      setPayToken: jest.fn(),
    });
}

function render(mockOptions: Parameters<typeof setupDefaultMocks>[0] = {}) {
  setupDefaultMocks(mockOptions);

  const state = getMockConfirmStateForTransaction(MOCK_TRANSACTION_META);

  return renderWithConfirmContextProvider(
    <MusdConversionInfo />,
    mockStore(state),
  );
}

describe('MusdConversionInfo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the custom amount input', () => {
    const { getByTestId } = render();

    expect(getByTestId('custom-amount')).toBeInTheDocument();
  });

  it('renders the override content with amountHuman', () => {
    const { getByTestId } = render();

    expect(getByTestId('musd-override-content')).toBeInTheDocument();
    expect(getByTestId('musd-override-content')).toHaveTextContent('50');
  });

  describe('MusdBottomContent', () => {
    it('renders bottom content rows when quotes are loading', () => {
      const { getByTestId } = render({ isQuotesLoading: true });

      expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
      expect(getByTestId('total-row')).toBeInTheDocument();
    });

    it('renders bottom content rows when quotes exist', () => {
      const { getByTestId } = render({ hasQuotes: true });

      expect(getByTestId('bridge-fee-row')).toBeInTheDocument();
      expect(getByTestId('claimable-bonus-row')).toBeInTheDocument();
      expect(getByTestId('total-row')).toBeInTheDocument();
    });

    it('does not render bottom content rows when no quotes and not loading', () => {
      const { queryByTestId } = render({
        hasQuotes: false,
        isQuotesLoading: false,
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('claimable-bonus-row')).not.toBeInTheDocument();
      expect(queryByTestId('total-row')).not.toBeInTheDocument();
    });

    it('hides bottom content when alerts hide results', () => {
      const { queryByTestId } = render({
        hasQuotes: true,
        hideResults: true,
      });

      expect(queryByTestId('bridge-fee-row')).not.toBeInTheDocument();
      expect(queryByTestId('claimable-bonus-row')).not.toBeInTheDocument();
      expect(queryByTestId('total-row')).not.toBeInTheDocument();
    });
  });
});
