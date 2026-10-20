import { createSelector } from 'reselect';
import { isValidHexAddress } from '@metamask/controller-utils';
import { getSendRecipients } from '@metamask/transaction-controller';
import { type AccountsState } from '#shared/lib/selectors/accounts';
import { normalizeAddress, isEthAddress } from '#shared/lib/multichain/address';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  isSolanaAddress,
  isStellarAddress,
  isTronAddress,
} from '#shared/lib/multichain/accounts';
import { getInternalAccounts } from './accounts';
import { getCompleteAddressBook } from './selectors';
import {
  selectTransactions,
  type TransactionState,
} from './transactionController';

type SelectorState = TransactionState & AccountsState;

export function normalizeKnownAddress(
  address: string | undefined,
): string | undefined {
  if (!address?.trim()) {
    return undefined;
  }

  const trimmed = address.trim();

  if (isEthAddress(trimmed)) {
    if (!isValidHexAddress(trimmed, { allowNonPrefixed: false })) {
      return undefined;
    }
    return normalizeAddress(trimmed);
  }

  if (
    isSolanaAddress(trimmed) ||
    isBtcMainnetAddress(trimmed) ||
    isBtcTestnetAddress(trimmed) ||
    isTronAddress(trimmed) ||
    isStellarAddress(trimmed)
  ) {
    return normalizeAddress(trimmed);
  }

  return undefined;
}

export const selectKnownAddresses = createSelector(
  (state: SelectorState) => getCompleteAddressBook(state),
  selectTransactions,
  getInternalAccounts,
  (addressBook, transactions, internalAccounts) => {
    const known = new Set<string>();

    const add = (address: string | undefined) => {
      const normalized = normalizeKnownAddress(address);
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
