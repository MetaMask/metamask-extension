import { cloneDeep } from 'lodash';
import { normalizeEnsName } from '@metamask/controller-utils';

const version = 37;

/**
 * The purpose of this migration is to update the address book state
 * to the new schema with chainId as a key.
 * and to add the isEns flag to all entries
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  if (state.AddressBookController) {
    const ab = state.AddressBookController.addressBook;

    const chainIds = new Set();
    const newAddressBook = {};

    // add all of the chainIds to a set
    Object.values(ab).forEach((v) => {
      chainIds.add(v.chainId);
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
