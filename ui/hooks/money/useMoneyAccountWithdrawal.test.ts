import { act } from '@testing-library/react';
import {
  EthAccountType,
  EthScope,
  BtcAccountType,
  SolAccountType,
  SolScope,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MONEY_HOME_ROUTE } from '../../helpers/constants/routes';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountWithdrawTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useMoneyAccountWithdrawal } from './useMoneyAccountWithdrawal';
import { useMoneyErrorReporter } from './useMoneyErrorReporter';

jest.mock('../../store/controller-actions/transaction-pay-controller', () => ({
  createMoneyAccountWithdrawTransaction: jest.fn(),
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

const createWithdrawTransactionMock = jest.mocked(
  createMoneyAccountWithdrawTransaction,
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

const HARDWARE_ACCOUNT_ID = 'hardware-account-id-mock';
const SOFTWARE_ADDRESS = '0x9999999999999999999999999999999999999999';

/**
 * State where a hardware account is globally selected, alongside the given
 * other accounts. The hardware account is listed first so the fallback has to
 * skip it rather than merely picking the only entry.
 *
 * @param others - Additional accounts, in list order after the hardware one.
 * @returns Mock state.
 */
const stateWithSelectedHardwareAccount = (
  others: Record<string, unknown>[] = [],
) => ({
  metamask: {
    internalAccounts: {
      selectedAccount: HARDWARE_ACCOUNT_ID,
      accounts: {
        [HARDWARE_ACCOUNT_ID]: {
          id: HARDWARE_ACCOUNT_ID,
          type: EthAccountType.Eoa,
          address: '0x1234567890123456789012345678901234567890',
          metadata: { keyring: { type: KeyringTypes.ledger } },
        },
        ...others.reduce(
          (acc, entry) => ({ ...acc, [entry.id as string]: entry }),
          {},
        ),
      },
    },
  },
});

const SOFTWARE_ACCOUNT = {
  id: 'software-account-id-mock',
  type: EthAccountType.Eoa,
  address: SOFTWARE_ADDRESS,
  metadata: { keyring: { type: KeyringTypes.hd } },
};

const SOLANA_ACCOUNT = {
  id: 'solana-account-id-mock',
  type: SolAccountType.DataAccount,
  address: 'So1anaExampleExampleExampleExampleExampleEx',
  scopes: [SolScope.Mainnet],
  metadata: { keyring: { type: KeyringTypes.snap } },
};

const GROUP_ID = 'entropy:wallet/1';

/**
 * State mirroring a non-EVM network being picked in the network filter: the
 * globally selected account is the Solana account of the second account
 * group, and a different EVM account exists in the first group so the test
 * can tell a group-aware lookup from a first-EVM-account fallback.
 *
 * @returns Mock state.
 */
const stateWithSelectedSolanaAccount = () => ({
  metamask: {
    selectedAccountGroup: GROUP_ID,
    accountTree: {
      wallets: {
        'entropy:wallet': {
          id: 'entropy:wallet',
          type: AccountWalletType.Entropy,
          status: 'ready',
          groups: {
            'entropy:wallet/0': {
              id: 'entropy:wallet/0',
              type: AccountGroupType.MultichainAccount,
              accounts: [ACCOUNT_ID],
              metadata: { name: 'Account 1' },
            },
            [GROUP_ID]: {
              id: GROUP_ID,
              type: AccountGroupType.MultichainAccount,
              accounts: [SOLANA_ACCOUNT.id, SOFTWARE_ACCOUNT.id],
              metadata: { name: 'Account 2' },
            },
          },
          metadata: { name: 'Wallet' },
        },
      },
    },
    internalAccounts: {
      selectedAccount: SOLANA_ACCOUNT.id,
      accounts: {
        [ACCOUNT_ID]: {
          id: ACCOUNT_ID,
          type: EthAccountType.Eoa,
          address: '0x1234567890123456789012345678901234567890',
          scopes: [EthScope.Eoa],
          metadata: { keyring: { type: KeyringTypes.hd } },
        },
        [SOLANA_ACCOUNT.id]: SOLANA_ACCOUNT,
        [SOFTWARE_ACCOUNT.id]: { ...SOFTWARE_ACCOUNT, scopes: [EthScope.Eoa] },
      },
    },
  },
});

describe('useMoneyAccountWithdrawal', () => {
  const navigateToTransactionMock = jest.fn();
  const reportErrorMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useMoneyErrorReporterMock.mockReturnValue(reportErrorMock);
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
      goBackTo: '/',
    });
  });

  it('passes the originating route as goBackTo so the confirmation returns there', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      EVM_ACCOUNT_STATE,
      MONEY_HOME_ROUTE,
    );

    await act(async () => {
      await result.current.initiateWithdrawal();
    });

    expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
      loader: ConfirmationLoader.CustomAmount,
      goBackTo: MONEY_HOME_ROUTE,
    });
  });

  it('reports the failure and resolves when setup fails', async () => {
    const error = new Error('setup failed');
    createWithdrawTransactionMock.mockRejectedValue(error);

    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      EVM_ACCOUNT_STATE,
    );

    await act(async () => {
      await expect(
        result.current.initiateWithdrawal(),
      ).resolves.toBeUndefined();
    });

    expect(reportErrorMock).toHaveBeenCalledWith({
      error,
      message: '[Money Account] Withdrawal setup failed',
      title: 'moneyToastWithdrawFailedTitle',
      description: 'moneyToastWithdrawFailedBody',
      extra: { flow: 'withdraw' },
    });
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("withdraws to the selected group's EVM account when a non-EVM network is selected", async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      stateWithSelectedSolanaAccount(),
    );

    await act(async () => {
      await result.current.initiateWithdrawal();
    });

    expect(createWithdrawTransactionMock).toHaveBeenCalledWith(
      SOFTWARE_ADDRESS,
    );
    expect(navigateToTransactionMock).toHaveBeenCalledWith(
      TRANSACTION_ID,
      expect.objectContaining({ loader: ConfirmationLoader.CustomAmount }),
    );
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it('fails fast without creating the batch when the only account is not EVM', async () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountWithdrawal(),
      stateWithSelectedAccount(BtcAccountType.P2wpkh),
    );

    await act(async () => {
      await expect(
        result.current.initiateWithdrawal(),
      ).resolves.toBeUndefined();
    });

    expect(createWithdrawTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: '[Money Account] Missing recipient EVM address',
        }),
        message: '[Money Account] Withdrawal setup failed',
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
      await expect(
        result.current.initiateWithdrawal(),
      ).resolves.toBeUndefined();
    });

    expect(createWithdrawTransactionMock).not.toHaveBeenCalled();
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
  });

  describe('when a hardware account is selected', () => {
    it('withdraws to the next eligible account instead of the hardware one', async () => {
      const { result } = renderHookWithProvider(
        () => useMoneyAccountWithdrawal(),
        stateWithSelectedHardwareAccount([SOFTWARE_ACCOUNT]),
      );

      await act(async () => {
        await result.current.initiateWithdrawal();
      });

      expect(createWithdrawTransactionMock).toHaveBeenCalledWith(
        SOFTWARE_ADDRESS,
      );
      expect(navigateToTransactionMock).toHaveBeenCalledWith(TRANSACTION_ID, {
        loader: ConfirmationLoader.CustomAmount,
        goBackTo: '/',
      });
      expect(reportErrorMock).not.toHaveBeenCalled();
    });

    it('skips non-EVM accounts when choosing the fallback', async () => {
      const { result } = renderHookWithProvider(
        () => useMoneyAccountWithdrawal(),
        stateWithSelectedHardwareAccount([
          {
            id: 'btc-account-id-mock',
            type: BtcAccountType.P2wpkh,
            address: 'bc1qexampleexampleexampleexampleexampleex',
            metadata: { keyring: { type: 'Snap Keyring' } },
          },
          SOFTWARE_ACCOUNT,
        ]),
      );

      await act(async () => {
        await result.current.initiateWithdrawal();
      });

      expect(createWithdrawTransactionMock).toHaveBeenCalledWith(
        SOFTWARE_ADDRESS,
      );
    });

    it('fails fast when every account is a hardware account', async () => {
      const { result } = renderHookWithProvider(
        () => useMoneyAccountWithdrawal(),
        stateWithSelectedHardwareAccount([
          {
            id: 'trezor-account-id-mock',
            type: EthAccountType.Eoa,
            address: SOFTWARE_ADDRESS,
            metadata: { keyring: { type: KeyringTypes.trezor } },
          },
        ]),
      );

      await act(async () => {
        await expect(
          result.current.initiateWithdrawal(),
        ).resolves.toBeUndefined();
      });

      expect(createWithdrawTransactionMock).not.toHaveBeenCalled();
      expect(navigateToTransactionMock).not.toHaveBeenCalled();
      expect(reportErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: '[Money Account] Missing recipient EVM address',
          }),
        }),
      );
    });
  });
});
