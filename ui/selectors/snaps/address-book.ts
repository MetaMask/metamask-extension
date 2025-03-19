import { AddressBookController } from '@metamask/address-book-controller';
import { createDeepEqualSelector } from '../util';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

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
 * Get the memoized full address book.
 *
 * @param state - The Metamask state for the address book controller.
 * @returns The full address book.
 */
export const getMemoizedFullAddressBook = createDeepEqualSelector(
  [getFullAddressBook],
  (addressBook) => addressBook,
);

/**
 * Get the address book for a network.
 *
 * @param _state - The Metamask state for the address book controller.
 * @param chainId - The chain ID to get the address book for.
 * @returns The address book for the network.
 */
export const getAddressBookByNetwork = createDeepEqualSelector(
  [
    getMemoizedFullAddressBook,
    (_state: AddressBookMetaMaskState, chainId: `0x${string}`) => chainId,
  ],
  (addressBook, chainId) => {
    if (!addressBook[chainId]) {
      return [];
    }
    return Object.values(addressBook[chainId]);
  },
);

/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/check-param-names */
/**
 * Get an address book entry for an address on a network.
 *
 * @param state - The Metamask state for the address book controller.
 * @param address - The address to get the entry for.
 * @param chainId - The chain ID to get the entry for.
 * @returns The address book entry for the address on the network.
 */
/* eslint-enable jsdoc/require-param */
/* eslint-enable jsdoc/check-param-names */
export const getAddressBookEntryByNetwork = createDeepEqualSelector(
  [
    (
      state: AddressBookMetaMaskState,
      _address: string,
      chainId: `0x${string}`,
    ) => getAddressBookByNetwork(state, chainId),
    (_state, address) => address,
  ],
  (addressBook, address) => {
    return addressBook.find((contact) =>
      isEqualCaseInsensitive(contact.address, address),
    );
  },
);
