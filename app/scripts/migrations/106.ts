import { cloneDeep, isEmpty } from 'lodash';
import {
  ACCOUNT_LABEL_CHAIN_ID,
  PreferencesControllerState,
} from '../lib/setupAccountLabelsPetnamesBridge';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 106;

/**
 * Copy all account identity entries from PreferencesController to NameController.
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
  const identities: PreferencesControllerState['identities'] =
    state?.PreferencesController?.identities ?? {};
  const names = state?.NameController?.names?.ethereumAddress ?? {};

  if (isEmpty(Object.keys(identities))) {
    return;
  }

  for (const address of Object.keys(identities)) {
    const accountEntry = identities[address];

    const normalizedAddress = address.toLowerCase();
    const nameEntry = names[normalizedAddress] ?? {};
    const petnameExists = Boolean(nameEntry[ACCOUNT_LABEL_CHAIN_ID]?.name);

    // Ignore if petname already set, or if account entry is missing name or address.
    if (
      petnameExists ||
      !accountEntry.name?.length ||
      !accountEntry.address?.length ||
      !normalizedAddress?.length
    ) {
      continue;
    }

    names[normalizedAddress] = nameEntry;

    nameEntry[ACCOUNT_LABEL_CHAIN_ID] = {
      name: accountEntry.name,
      sourceId: null,
      proposedNames: {},
    };
  }

  state.NameController = {
    ...state.NameController,
    names: {
      ethereumAddress: names,
    },
  };
}
