import { cloneDeep } from 'lodash';
import { normalizeEnsName } from '@metamask/controller-utils';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 37;

type LegacyAddressBookEntry = {
  chainId: string;
  name: string;
  isEns?: boolean;
};

type LegacyFlatAddressBook = Record<string, LegacyAddressBookEntry>;
type LegacyNestedAddressBook = Record<
  string,
  Record<string, LegacyAddressBookEntry>
>;

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'AddressBookController',
      {
        addressBook: LegacyFlatAddressBook | LegacyNestedAddressBook;
      }
    >
  >;

/**
 * The purpose of this migration is to update the address book state
 * to the new schema with chainId as a key.
 * and to add the isEns flag to all entries
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  if (state.AddressBookController) {
    const ab = state.AddressBookController.addressBook as LegacyFlatAddressBook;

    const chainIds = new Set<string>();
    const newAddressBook: LegacyNestedAddressBook = {};

    // add all of the chainIds to a set
    Object.values(ab).forEach((entry) => {
      chainIds.add(entry.chainId);
    });

    // fill the chainId object with the entries with the matching chainId
    for (const id of chainIds.values()) {
      // make an empty object entry for each chainId
      newAddressBook[id] = {};
      for (const address in ab) {
        if (ab[address].chainId === id) {
          ab[address].isEns = false;
          if (normalizeEnsName(ab[address].name)) {
            ab[address].isEns = true;
          }
          newAddressBook[id][address] = ab[address];
        }
      }
    }

    state.AddressBookController.addressBook = newAddressBook;
  }

  return state;
}
