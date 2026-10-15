import { createSelector } from 'reselect';
import { isValidHexAddress } from '@metamask/controller-utils';
import {
  getSendRecipients,
  TransactionStatus,
} from '@metamask/transaction-controller';
import {
  selectTransactions,
  type TransactionState,
} from './transactionController';
import { getCompleteAddressBook } from './selectors';

type SelectorState = TransactionState;

function normalizePoisoningRecipientAddress(address: string | undefined) {
  if (!address || !isValidHexAddress(address, { allowNonPrefixed: false })) {
    return undefined;
  }

  return address.toLowerCase();
}

export type AddressPoisoningKnownRecipients = {
  recipients: readonly string[];
  fingerprint: string;
};

export const selectAddressPoisoningKnownRecipients = createSelector(
  (state: SelectorState) => getCompleteAddressBook(state),
  selectTransactions,
  (addressBook, transactions): AddressPoisoningKnownRecipients => {
    const recipientSet = new Set<string>();

    for (const { address } of addressBook) {
      const normalized = normalizePoisoningRecipientAddress(address);
      if (normalized) {
        recipientSet.add(normalized);
      }
    }

    for (const transaction of transactions) {
      if (transaction.status !== TransactionStatus.confirmed) {
        continue;
      }

      for (const recipient of getSendRecipients(transaction)) {
        const normalized = normalizePoisoningRecipientAddress(recipient);
        if (normalized) {
          recipientSet.add(normalized);
        }
      }
    }

    const recipients = [...recipientSet].sort();
    return {
      recipients,
      fingerprint: recipients.join('\0'),
    };
  },
);
