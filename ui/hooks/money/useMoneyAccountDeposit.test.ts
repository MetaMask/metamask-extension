import { act } from '@testing-library/react';
import { EthAccountType, BtcAccountType } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MONEY_HOME_ROUTE } from '../../helpers/constants/routes';
import { getMoneyAccountDepositIntent } from '../../helpers/money/deposit-intent';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountDepositTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyErrorReporter } from './useMoneyErrorReporter';

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  createMoneyAccountDepositTransaction: jest.fn(),
}));

jest.mock('./useMoneyErrorReporter', () => ({
  useMoneyErrorReporter: jest.fn(),
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
const useMoneyErrorReporterMock = jest.mocked(useMoneyErrorReporter);

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
  const reportErrorMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useMoneyErrorReporterMock.mockReturnValue(reportErrorMock);
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
      goBackTo: '/',
    });
  });

  it('passes the originating route as goBackTo so the confirmation returns there', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
      MONEY_HOME_ROUTE,
    );

    await act(async () => {
      await result.current.initiateDeposit();
    });

    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
      goBackTo: MONEY_HOME_ROUTE,
    });
  });

  it('forwards the preferred payment token to the confirmation', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit({
        preferredPaymentToken: { address: '0xabc', chainId: '0x1' },
      });
    });

    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
      goBackTo: '/',
      preferredPaymentToken: { address: '0xabc', chainId: '0x1' },
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

  it('clears the intent, reports the failure and resolves when setup fails', async () => {
    const error = new Error('setup failed');
    let failedBatchId: string | undefined;
    createDepositTransactionMock.mockImplementation(async (batchId) => {
      failedBatchId = batchId;
      throw error;
    });

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await expect(
        result.current.initiateDeposit({ intent: 'card' }),
      ).resolves.toBeUndefined();
    });

    expect(getMoneyAccountDepositIntent(failedBatchId)).toBeUndefined();
    expect(reportErrorMock).toHaveBeenCalledWith({
      error,
      message: '[Money Account] Deposit setup failed',
      title: 'moneyToastDepositFailedTitle',
      description: 'moneyToastDepositFailedBody',
      extra: { flow: 'deposit', intent: 'card' },
    });
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('uses add-funds toast copy when a generic deposit fails', async () => {
    const error = new Error('setup failed');
    createDepositTransactionMock.mockRejectedValue(error);

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit();
    });

    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'moneyToastDepositFailedTitleAddMusd',
        description: 'moneyToastDepositFailedBody',
        extra: { flow: 'deposit' },
      }),
    );
  });

  it('uses conversion toast copy when a convert deposit fails', async () => {
    const error = new Error('setup failed');
    createDepositTransactionMock.mockRejectedValue(error);

    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await result.current.initiateDeposit({ intent: 'convert' });
    });

    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'moneyToastDepositFailedTitleConvert',
        description: 'moneyToastDepositFailedBodyConvert',
        extra: { flow: 'deposit', intent: 'convert' },
      }),
    );
  });

  it('fails fast without creating the batch when the selected account is not EVM', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountDeposit(),
      stateWithSelectedAccount(BtcAccountType.P2wpkh),
    );

    await act(async () => {
      await expect(result.current.initiateDeposit()).resolves.toBeUndefined();
    });

    expect(createDepositTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: '[Money Account] Missing funding EVM account',
        }),
        message: '[Money Account] Deposit setup failed',
      }),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('fails fast when no account is selected', async () => {
    const { result } = renderHookWithProvider(() => useMoneyAccountDeposit(), {
      metamask: { internalAccounts: { selectedAccount: '', accounts: {} } },
    });

    await act(async () => {
      await expect(result.current.initiateDeposit()).resolves.toBeUndefined();
    });

    expect(createDepositTransactionMock).not.toHaveBeenCalled();
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
  });
});
