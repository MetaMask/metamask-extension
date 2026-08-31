import { act } from '@testing-library/react';
import { EthAccountType, BtcAccountType } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
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
const ACCOUNT_ID = 'account-id-mock';

const stateWithSelectedAccount = (accountType: string) => ({
  metamask: {
    internalAccounts: {
      selectedAccount: ACCOUNT_ID,
      accounts: {
        [ACCOUNT_ID]: {
          id: ACCOUNT_ID,
          type: accountType,
          address: '0x1234567890123456789012345678901234567890',
        },
      },
    },
  },
});

const EVM_ACCOUNT_STATE = stateWithSelectedAccount(EthAccountType.Eoa);

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
    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateWithdrawal();
    });

    expect(createWithdrawTransactionMock).toHaveBeenCalledTimes(1);
    expect(createWithdrawTransactionMock).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
    );
    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('reports the failure and rethrows when setup fails', async () => {
    const error = new Error('setup failed');
    createWithdrawTransactionMock.mockRejectedValue(error);
    const onWithdrawalSetupFailure = jest.fn();

    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await expect(
        result.current.initiateWithdrawal({ onWithdrawalSetupFailure }),
      ).rejects.toThrow('setup failed');
    });

    expect(onWithdrawalSetupFailure).toHaveBeenCalledWith(error);
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('fails fast without creating the batch when the selected account is not EVM', async () => {
    const onWithdrawalSetupFailure = jest.fn();

    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      stateWithSelectedAccount(BtcAccountType.P2wpkh),
    );

    await act(async () => {
      await expect(
        result.current.initiateWithdrawal({ onWithdrawalSetupFailure }),
      ).rejects.toThrow('[Money Account] Missing recipient EVM address');
    });

    expect(createWithdrawTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(onWithdrawalSetupFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '[Money Account] Missing recipient EVM address',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('fails fast when no account is selected', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      { metamask: { internalAccounts: { selectedAccount: '', accounts: {} } } },
    );

    await act(async () => {
      await expect(result.current.initiateWithdrawal()).rejects.toThrow(
        '[Money Account] Missing recipient EVM address',
      );
    });

    expect(createWithdrawTransactionMock).not.toHaveBeenCalled();
  });
});
