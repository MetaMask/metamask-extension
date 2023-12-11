import {
  AddressBookController,
  AddressBookState,
} from '@metamask/address-book-controller';
import { NameController, NameType } from '@metamask/name-controller';
import { NameEntry, TwoWayNameBridge, BridgeMessenger } from './NameBridge';

type AddressBookPetnamesBridgeMessager =
  BridgeMessenger<'AddressBookPetnamesBridge'>;

/**
 * Selects the name entries from the address book state.
 *
 * @param state
 */
function selectNameBridgeEntriesFromAddressBook(
  state: AddressBookState,
): NameEntry[] {
  const entries: NameEntry[] = [];

  for (const chainId of Object.keys(state.addressBook)) {
    const chainEntries = state.addressBook[chainId as any];

    for (const address of Object.keys(chainEntries)) {
      const entry = state.addressBook[chainId as any][address];
      const normalizedAddress = address.toLowerCase();
      const normalizedChainId = chainId.toLowerCase();
      const { name, isEns } = entry;

      if (!name?.length || !normalizedAddress?.length) {
        continue;
      }

      entries.push({
        value: normalizedAddress,
        name,
        variation: normalizedChainId,
        type: NameType.ETHEREUM_ADDRESS,
        sourceId: isEns ? 'ens' : undefined,
      });
    }
  }

  return entries;
}

/**
 * Sets up a bridge between the address book entries and the petnames in the name controller.
 *
 * @param addressBookController
 * @param nameController
 * @param messenger
 */
export function setupAddressBookPetnamesBridge(
  addressBookController: AddressBookController,
  nameController: NameController,
  messenger: AddressBookPetnamesBridgeMessager,
) {
  const bridge = new TwoWayNameBridge({
    nameController,
    getSourceEntries: () =>
      selectNameBridgeEntriesFromAddressBook(addressBookController.state),
    applyChangeToSource: (type, entry) => {
      if (type === 'deleted') {
        addressBookController.delete(entry.variation as any, entry.value);
      } else {
        addressBookController.set(
          entry.value,
          entry.name as any,
          entry.variation as any,
        );
      }
    },
    messenger,
  });

  addressBookController.subscribe(() => bridge.onSourceChange());
}
