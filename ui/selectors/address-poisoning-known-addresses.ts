import { isValidHexAddress } from '@metamask/controller-utils';
import {
  getSendRecipients,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { createSelector } from 'reselect';
import { getCompleteAddressBook } from './selectors';
import {
  selectTransactions,
  type TransactionState,
} from './transactionController';

function normalizeKnownAddress(address: string | undefined) {
  if (!address || !isValidHexAddress(address, { allowNonPrefixed: false })) {
    return null;
  }

  return address.toLowerCase();
}

export const selectAddressPoisoningKnownAddresses = createSelector(
  (state: TransactionState) => getCompleteAddressBook(state),
  selectTransactions,
  (addressBook, transactions) => {
    const knownAddresses = new Set<string>();

    for (const entry of addressBook) {
      const normalized = normalizeKnownAddress(entry.address);
      if (normalized) {
        knownAddresses.add(normalized);
      }
    }

    for (const transaction of transactions) {
      if (transaction.status !== TransactionStatus.confirmed) {
        continue;
      }

      for (const recipient of getSendRecipients(transaction)) {
        const normalized = normalizeKnownAddress(recipient);
        if (normalized) {
          knownAddresses.add(normalized);
        }
      }
    }

    return Array.from(knownAddresses);
  },
);
