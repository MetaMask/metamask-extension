import { isEvmAccountType } from '@metamask/keyring-api';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayController } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
import { getSelectedAccount, type MoneyPayMessenger } from './pay-context';

/**
 * Seeds `accountOverride` on the Pay controller with the globally selected
 * account when a new money-account (deposit/withdraw) transaction is added
 * and no override is already set.
 *
 * Money transactions execute **from the money account**, but the user's own
 * selected account is what funds a deposit (Pay moves the funds first) and
 * pays where sponsorship does not apply — without the override, Pay has no
 * funding account to quote against. `isQuoteRequired` is set for deposits so
 * Pay always fetches a quote even when the source and target tokens match.
 *
 * Skips non-EVM selected accounts, matching mobile. Two mobile branches are
 * deliberately not ported: the Card-link approve discriminator (the extension
 * has no Card product), and the nested-transaction address replacement for
 * withdrawals (the extension's placeholder batches carry no calldata, and the
 * withdraw commit path re-resolves the recipient from this override — falling
 * back to the selected account — on every amount commit, with the UI
 * re-committing when the override changes). Mobile's eager balance refresh is
 * also skipped: the
 * override is the selected account, whose balances the extension already
 * polls while the UI is open.
 *
 * @param controller - The Pay controller to seed.
 * @param messenger - The messenger to resolve the selected account through.
 * @param transaction - The unapproved transaction that was added.
 */
export function handleUnapprovedTransactionAddedForMoneyAccount(
  controller: TransactionPayController,
  messenger: MoneyPayMessenger,
  transaction: TransactionMeta,
): void {
  const moneyAccountFlow = getMoneyAccountFlow(transaction);
  if (!moneyAccountFlow) {
    return;
  }

  const existingOverride =
    controller.state.transactionData[transaction.id]?.accountOverride;
  if (existingOverride) {
    return;
  }

  const selectedAccount = getSelectedAccount(messenger);

  if (!selectedAccount || !isEvmAccountType(selectedAccount.type)) {
    return;
  }

  controller.setTransactionConfig(transaction.id, (config) => {
    config.accountOverride = selectedAccount.address as Hex;

    if (moneyAccountFlow === MoneyAccountFlow.Deposit) {
      config.isQuoteRequired = true;
    }
  });
}
