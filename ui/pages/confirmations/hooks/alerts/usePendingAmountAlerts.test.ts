import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmState } from '../../../../../test/data/confirmations/helper';
import { useInsufficientMoneyAccountBalanceAlert } from './transactions/useInsufficientMoneyAccountBalanceAlert';
import { useInsufficientPayTokenBalanceAlert } from './transactions/useInsufficientPayTokenBalanceAlert';
import { useTransactionDepositLimitAlert } from './transactions/useTransactionDepositLimitAlert';
import { usePendingAmountAlerts } from './usePendingAmountAlerts';

jest.mock('./transactions/useInsufficientPayTokenBalanceAlert');
jest.mock('./transactions/useInsufficientMoneyAccountBalanceAlert');
jest.mock('./transactions/useTransactionDepositLimitAlert');

const useInsufficientPayTokenBalanceAlertMock = jest.mocked(
  useInsufficientPayTokenBalanceAlert,
);
const useInsufficientMoneyAccountBalanceAlertMock = jest.mocked(
  useInsufficientMoneyAccountBalanceAlert,
);
const useTransactionDepositLimitAlertMock = jest.mocked(
  useTransactionDepositLimitAlert,
);

describe('usePendingAmountAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useInsufficientPayTokenBalanceAlertMock.mockReturnValue([]);
    useInsufficientMoneyAccountBalanceAlertMock.mockReturnValue([]);
    useTransactionDepositLimitAlertMock.mockReturnValue([]);
  });

  it('passes pendingFiatAmount as pendingAmountUsd when available', () => {
    renderHookWithConfirmContextProvider(
      () =>
        usePendingAmountAlerts({
          pendingFiatAmount: '0.34',
        }),
      getMockConfirmState(),
    );

    expect(useInsufficientPayTokenBalanceAlertMock).toHaveBeenCalledWith({
      pendingAmountUsd: '0.34',
    });
    expect(useInsufficientMoneyAccountBalanceAlertMock).toHaveBeenCalledWith({
      pendingAmount: '0.34',
    });
    expect(useTransactionDepositLimitAlertMock).toHaveBeenCalledWith({
      pendingAmount: '0.34',
    });
  });

  it('defaults pendingAmountUsd to 0 when pendingFiatAmount is omitted', () => {
    renderHookWithConfirmContextProvider(
      () => usePendingAmountAlerts({}),
      getMockConfirmState(),
    );

    expect(useInsufficientPayTokenBalanceAlertMock).toHaveBeenCalledWith({
      pendingAmountUsd: '0',
    });
  });
});
