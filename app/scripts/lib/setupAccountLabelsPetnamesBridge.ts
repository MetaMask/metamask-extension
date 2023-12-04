import { NameController, NameType } from '@metamask/name-controller';
import { cloneDeep } from 'lodash';
import log from 'loglevel';

type IdentityEntry = {
  address: string;
  name: string;
};

export type PertinentState = {
  identities: { [address: string]: IdentityEntry };
};

export type PertinentPreferencesController = {
  store: {
    getState: () => PertinentState;
    subscribe: (callback: (state: PertinentState) => void) => void;
  };
};

const MAINNET_CHAIN_ID = '0x1';
export const ACCOUNT_LABEL_NAME_TYPE = NameType.ETHEREUM_ADDRESS;
export const ACCOUNT_LABEL_VARIATION = MAINNET_CHAIN_ID;

/**
 * Groups the entries in the old and new entries arrays into added, updated and
 * deleted entries, like a patch.
 *
 * @param oldEntries - The last seen IdentityEntries in the preferences controller.
 * @param newEntries - The new IdentityEntries.
 */
function groupEntries(
  oldEntries: IdentityEntry[],
  newEntries: IdentityEntry[],
): {
  added: IdentityEntry[];
  updated: IdentityEntry[];
  deleted: IdentityEntry[];
} {
  const added = newEntries.filter(
    (newEntry) =>
      !oldEntries.some((oldEntry) => oldEntry.address === newEntry.address),
  );

  const updated = newEntries.filter((newEntry) =>
    oldEntries.some(
      (oldEntry) =>
        oldEntry.address === newEntry.address &&
        oldEntry.name !== newEntry.name,
    ),
  );

  const deleted = oldEntries.filter(
    (oldEntry) =>
      !newEntries.some((newEntry) => newEntry.address === oldEntry.address),
  );

  return { added, updated, deleted };
}

/**
 * Sets up a bridge between the account labels in the preferences controller and
 * the petnames in the name controller.
 *
 * @param preferencesController - The preferences controller to listen to.
 * @param nameController - The name controller to update.
 */
export default function setupAccountLabelsPetnamesBridge(
  preferencesController: PertinentPreferencesController,
  nameController: NameController,
) {
  const { identities } = preferencesController.store.getState();

  let oldEntries = Object.values(identities);

  preferencesController.store.subscribe(async (state) => {
    const newEntries = Object.values(state.identities);

    const { added, updated, deleted } = groupEntries(oldEntries, newEntries);

    for (const entry of [...added, ...updated]) {
      nameController.setName({
        type: ACCOUNT_LABEL_NAME_TYPE,
        variation: ACCOUNT_LABEL_VARIATION,
        value: entry.address,
        name: entry.name,
      });

      log.debug('Updated petname following account label update', entry);
    }

    for (const entry of deleted) {
      nameController.setName({
        type: ACCOUNT_LABEL_NAME_TYPE,
        variation: ACCOUNT_LABEL_VARIATION,
        value: entry.address,
        name: null,
      });

      log.debug('Removed petname following account label removal', entry);
    }

    oldEntries = cloneDeep(newEntries);
  });
}
