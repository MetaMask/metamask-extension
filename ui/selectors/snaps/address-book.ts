import {
  AddressBookController,
  AddressBookEntry,
} from '@metamask/address-book-controller';
import type { Hex } from '@metamask/utils';
import { createParameterizedSelector } from '../../../shared/lib/selectors/selector-creators';

/**
 * The Metamask state for the address book controller.
 */
export type AddressBookMetaMaskState = {
  metamask: {
    addressBook: AddressBookController['state']['addressBook'];
  };
};

/**
 * Get the full address book.
 *
 * @param state - The Metamask state for the address book controller.
 * @returns The full address book.
 */
export const getFullAddressBook = (state: AddressBookMetaMaskState) =>
  state.metamask.addressBook;

/**
 * Get the address book for a network.
 *
 * @param _state - The Metamask state for the address book controller.
 * @param chainId - The chain ID to get the address book for.
 * @returns The address book for the network.
 */
export const getAddressBookByNetwork = createParameterizedSelector(20)(
  getFullAddressBook,
  (_state: AddressBookMetaMaskState, chainId: Hex) => chainId,
  (addressBook, chainId) => {
    if (!addressBook[chainId]) {
      return [];
    }
    return Object.values(addressBook[chainId]);
  },
);

/**
 * Get a case-insensitive lookup map of address book entries for a network,
 * keyed by lowercased address. Memoized per chain ID so the Map is only
 * rebuilt when the address book for that chain actually changes.
 *
 * @param state - The Metamask state for the address book controller.
 * @param chainId - The chain ID to build the map for.
 * @returns A Map from lowercased address to AddressBookEntry.
 */
export const getAddressBookMapByNetwork = createParameterizedSelector(20)(
  getAddressBookByNetwork,
  (_state: AddressBookMetaMaskState, chainId: Hex) => chainId,
  (entries) =>
    new Map<string, AddressBookEntry>(
      entries.map((entry) => [entry.address.toLowerCase(), entry]),
    ),
);

/**
 * Get an address book entry for an address on a network.
 *
 * Uses a per-chain Map for O(1) lookup instead of a per-address LRU cache,
 * avoiding cache thrashing when many distinct addresses are queried.
 *
 * @param state - The Metamask state for the address book controller.
 * @param address - The address to look up (case-insensitive).
 * @param chainId - The chain ID to look up in.
 * @returns The address book entry, or undefined if not found.
 */
export const getAddressBookEntryByNetwork = (
  state: AddressBookMetaMaskState,
  address: string,
  chainId: Hex,
): AddressBookEntry | undefined =>
  getAddressBookMapByNetwork(state, chainId).get(address.toLowerCase());
