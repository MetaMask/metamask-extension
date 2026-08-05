import { act, renderHook } from '@testing-library/react-hooks';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountWithdrawTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useMoneyAccountWithdrawal } from './useMoneyAccountWithdrawal';

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  createMoneyAccountWithdrawTransaction: jest.fn(),
}));

jest.mock('../../pages/confirmations/hooks/useConfirmationNavigation', () => ({
  ...jest.requireActual(
    '../../pages/confirmations/hooks/useConfirmationNavigation',
  ),
  useConfirmationNavigation: jest.fn(),
}));

const createWithdrawTransactionMock = jest.mocked(
  createMoneyAccountWithdrawTransaction,
);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);

const TRANSACTION_ID = 'transaction-id-mock';

describe('useMoneyAccountWithdrawal', () => {
  const navigateToTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
    } as unknown as ReturnType<typeof useConfirmationNavigation>);

    createWithdrawTransactionMock.mockResolvedValue({
      transactionId: TRANSACTION_ID,
      batchId: '0x1234',
    });
  });

  it('creates the batch and navigates to the custom-amount confirmation', async () => {
    const { result } = renderHook(() => useMoneyAccountWithdrawal());

    await act(async () => {
      await result.current.initiateWithdrawal();
    });

    expect(createWithdrawTransactionMock).toHaveBeenCalledTimes(1);
    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('reports the failure and rethrows when setup fails', async () => {
    const error = new Error('setup failed');
    createWithdrawTransactionMock.mockRejectedValue(error);
    const onWithdrawalSetupFailure = jest.fn();

    const { result } = renderHook(() => useMoneyAccountWithdrawal());

    await act(async () => {
      await expect(
        result.current.initiateWithdrawal({ onWithdrawalSetupFailure }),
      ).rejects.toThrow('setup failed');
    });

    expect(onWithdrawalSetupFailure).toHaveBeenCalledWith(error);
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
