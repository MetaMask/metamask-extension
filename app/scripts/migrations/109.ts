import { cloneDeep, isEmpty } from 'lodash';
import { FALLBACK_VARIATION, NameOrigin } from '@metamask/name-controller';
import { PreferencesControllerState } from '../controllers/preferences';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 109;

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

  let hasChanges = false;

  for (const address of Object.keys(identities)) {
    const accountEntry = identities[address];

    const normalizedAddress = address.toLowerCase();
    const nameEntry = names[normalizedAddress] ?? {};
    const petnameExists = Boolean(nameEntry[FALLBACK_VARIATION]?.name);

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

    nameEntry[FALLBACK_VARIATION] = {
      name: accountEntry.name,
      sourceId: null,
      proposedNames: {},
      origin: NameOrigin.ACCOUNT_IDENTITY,
    };

    hasChanges = true;
  }

  if (hasChanges) {
    state.NameController = {
      ...state.NameController,
      names: {
        ethereumAddress: names,
      },
    };
  }
}
