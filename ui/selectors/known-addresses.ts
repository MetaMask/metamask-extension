import { createSelector } from 'reselect';
import { isValidHexAddress } from '@metamask/controller-utils';
import { getSendRecipients } from '@metamask/transaction-controller';
import { type AccountsState } from '#shared/lib/selectors/accounts';
import { getInternalAccounts } from './accounts';
import { getCompleteAddressBook } from './selectors';
import {
  selectTransactions,
  type TransactionState,
} from './transactionController';

type SelectorState = TransactionState & AccountsState;

function normalizeHexAddress(address: string | undefined) {
  if (!address || !isValidHexAddress(address, { allowNonPrefixed: false })) {
    return undefined;
  }

  return address.toLowerCase();
}

export const selectKnownAddresses = createSelector(
  (state: SelectorState) => getCompleteAddressBook(state),
  selectTransactions,
  getInternalAccounts,
  (addressBook, transactions, internalAccounts) => {
    const known = new Set<string>();

    const add = (address: string | undefined) => {
      const normalized = normalizeHexAddress(address);
      if (normalized) {
        known.add(normalized);
      }
    };

    for (const { address } of addressBook) {
      add(address);
    }

    for (const { address } of internalAccounts) {
      add(address);
    }

    for (const transaction of transactions) {
      add(transaction.txParams?.from);
      add(transaction.txParams?.to);

      for (const recipient of getSendRecipients(transaction)) {
        add(recipient);
      }
    }

    return known;
  },
);
