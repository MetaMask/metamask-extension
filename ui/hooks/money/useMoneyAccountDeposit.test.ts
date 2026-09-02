import { act } from '@testing-library/react';
import { EthAccountType, BtcAccountType } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { getMoneyAccountDepositIntent } from '../../helpers/money/deposit-intent';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountDepositTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  createMoneyAccountDepositTransaction: jest.fn(),
}));

jest.mock('../../pages/confirmations/hooks/useConfirmationNavigation', () => ({
  ...jest.requireActual(
    '../../pages/confirmations/hooks/useConfirmationNavigation',
  ),
  useConfirmationNavigation: jest.fn(),
}));

const createDepositTransactionMock = jest.mocked(
  createMoneyAccountDepositTransaction,
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

describe('useMoneyAccountDeposit', () => {
  const navigateToTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
    } as unknown as ReturnType<typeof useConfirmationNavigation>);

    createDepositTransactionMock.mockImplementation(async (batchId) => ({
      transactionId: TRANSACTION_ID,
      batchId,
    }));
  });

  it('creates the batch and navigates to the custom-amount confirmation', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit();
    });

    expect(createDepositTransactionMock).toHaveBeenCalledWith(
      expect.stringMatching(/^0x[0-9a-f]{32}$/u),
      '0x1234567890123456789012345678901234567890',
    );
    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('records an explicit intent against the batch id before creating', async () => {
    let intentAtCreationTime;
    createDepositTransactionMock.mockImplementation(async (batchId) => {
      intentAtCreationTime = getMoneyAccountDepositIntent(batchId);
      return { transactionId: TRANSACTION_ID, batchId };
    });

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit({ intent: 'addMusd' });
    });

    expect(intentAtCreationTime).toBe('addMusd');
  });

  it('leaves the intent unset for a generic deposit', async () => {
    let intentAtCreationTime: string | undefined = 'sentinel';
    createDepositTransactionMock.mockImplementation(async (batchId) => {
      intentAtCreationTime = getMoneyAccountDepositIntent(batchId);
      return { transactionId: TRANSACTION_ID, batchId };
    });

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit();
    });

    expect(intentAtCreationTime).toBeUndefined();
  });

  it('clears the intent, reports the failure and rethrows when setup fails', async () => {
    const error = new Error('setup failed');
    let failedBatchId: string | undefined;
    createDepositTransactionMock.mockImplementation(async (batchId) => {
      failedBatchId = batchId;
      throw error;
    });
    const onDepositSetupFailure = jest.fn();

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await expect(
        result.current.initiateDeposit({
          intent: 'card',
          onDepositSetupFailure,
        }),
      ).rejects.toThrow('setup failed');
    });

    expect(getMoneyAccountDepositIntent(failedBatchId)).toBeUndefined();
    expect(onDepositSetupFailure).toHaveBeenCalledWith(error);
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('fails fast without creating the batch when the selected account is not EVM', async () => {
    const onDepositSetupFailure = jest.fn();

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      stateWithSelectedAccount(BtcAccountType.P2wpkh),
    );

    await act(async () => {
      await expect(
        result.current.initiateDeposit({ onDepositSetupFailure }),
      ).rejects.toThrow('[Money Account] Missing funding EVM account');
    });

    expect(createDepositTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(onDepositSetupFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '[Money Account] Missing funding EVM account',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('fails fast when no account is selected', async () => {
    const { result } = renderHookWithProvider(() => useMoneyAccountDeposit(), {
      metamask: { internalAccounts: { selectedAccount: '', accounts: {} } },
    });

    await act(async () => {
      await expect(result.current.initiateDeposit()).rejects.toThrow(
        '[Money Account] Missing funding EVM account',
      );
    });

    expect(createDepositTransactionMock).not.toHaveBeenCalled();
  });
});
