import { cloneDeep, isEmpty } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 100;

/**
 * Copy all entries from AddressBookController to NameController.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, any>) {
  const addressBook = state?.AddressBookController?.addressBook ?? {};
  const names = state?.NameController?.names?.ethereumAddress ?? {};

  if (isEmpty(Object.keys(addressBook))) {
    return;
  }

  for (const chainId of Object.keys(addressBook)) {
    const chainAddressBook = addressBook[chainId];

    for (const address of Object.keys(chainAddressBook)) {
      const addressBookEntry = chainAddressBook[address];
      const normalizedAddress = address.toLowerCase();
      const nameEntry = names[normalizedAddress] ?? {};
      const nameChainEntry = nameEntry[chainId] ?? {};

      // Ignore if petname already set, or if address book entry is missing name or address.
      if (
        nameChainEntry.name?.length ||
        !addressBookEntry.name?.length ||
        !normalizedAddress?.length
      ) {
        continue;
      }

      names[normalizedAddress] = nameEntry;

      nameEntry[chainId] = {
        name: addressBookEntry.name,
        sourceId: addressBookEntry.isEns ? 'ens' : null,
        proposedNames: {},
      };
    }
  }

  state.NameController = {
    ...state.NameController,
    names: {
      ethereumAddress: names,
    },
  };
}
