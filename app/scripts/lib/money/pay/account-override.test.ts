import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { TransactionPayController } from '@metamask/transaction-pay-controller';
import { handleUnapprovedTransactionAddedForMoneyAccount } from './account-override';
import { createMoneyPayMessengerMock } from './test-mocks';

const SELECTED_ADDRESS = '0x1234567890123456789012345678901234567890';

function buildTransaction(
  type: TransactionType,
  nested = false,
): TransactionMeta {
  return {
    id: 'transaction-id-mock',
    ...(nested ? { nestedTransactions: [{ to: '0x1', type }] } : { type }),
  } as unknown as TransactionMeta;
}

function createControllerMock(existingOverride?: string) {
  const config: Record<string, unknown> = {};
  const setTransactionConfig = jest.fn(
    (_id: string, callback: (config: Record<string, unknown>) => void) =>
      callback(config),
  );
  const controller = {
    state: {
      transactionData: existingOverride
        ? { 'transaction-id-mock': { accountOverride: existingOverride } }
        : {},
    },
    setTransactionConfig,
  } as unknown as TransactionPayController;

  return { controller, setTransactionConfig, config };
}

function createMessenger(selectedAccount: unknown) {
  return createMoneyPayMessengerMock({
    handlers: {
      'AccountsController:getSelectedAccount': () => selectedAccount,
    },
  }).messenger;
}

const EVM_ACCOUNT = { address: SELECTED_ADDRESS, type: 'eip155:eoa' };

describe('handleUnapprovedTransactionAddedForMoneyAccount', () => {
  it('seeds the override and requires a quote for a deposit', () => {
    const { controller, config } = createControllerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger(EVM_ACCOUNT),
      buildTransaction(TransactionType.moneyAccountDeposit, true),
    );

    expect(config).toStrictEqual({
      accountOverride: SELECTED_ADDRESS,
      isQuoteRequired: true,
    });
  });

  it('seeds the override without requiring a quote for a withdrawal', () => {
    const { controller, config } = createControllerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger(EVM_ACCOUNT),
      buildTransaction(TransactionType.moneyAccountWithdraw, true),
    );

    expect(config).toStrictEqual({ accountOverride: SELECTED_ADDRESS });
  });

  it('detects the money type on the parent transaction', () => {
    const { controller, setTransactionConfig } = createControllerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger(EVM_ACCOUNT),
      buildTransaction(TransactionType.moneyAccountDeposit),
    );

    expect(setTransactionConfig).toHaveBeenCalledTimes(1);
  });

  it('ignores transactions that are not money transactions', () => {
    const { controller, setTransactionConfig } = createControllerMock();
    const { messenger, call } = createMoneyPayMessengerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      messenger,
      buildTransaction(TransactionType.simpleSend),
    );

    expect(setTransactionConfig).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing override', () => {
    const { controller, setTransactionConfig } =
      createControllerMock('0xexisting');

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger(EVM_ACCOUNT),
      buildTransaction(TransactionType.moneyAccountDeposit, true),
    );

    expect(setTransactionConfig).not.toHaveBeenCalled();
  });

  it('skips non-EVM selected accounts', () => {
    const { controller, setTransactionConfig } = createControllerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger({ address: 'sol123', type: 'solana:data-account' }),
      buildTransaction(TransactionType.moneyAccountDeposit, true),
    );

    expect(setTransactionConfig).not.toHaveBeenCalled();
  });

  it('skips when no account is selected', () => {
    const { controller, setTransactionConfig } = createControllerMock();

    handleUnapprovedTransactionAddedForMoneyAccount(
      controller,
      createMessenger(undefined),
      buildTransaction(TransactionType.moneyAccountDeposit, true),
    );

    expect(setTransactionConfig).not.toHaveBeenCalled();
  });
});
