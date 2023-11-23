import { NameController, NameType } from '@metamask/name-controller';
import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from 'shared/constants/network';

type IdentityEntry = {
  address: string;
  name: string;
};

type PertinentState = {
  identities: { [address: string]: IdentityEntry };
};

type PertinentPreferencesController = {
  store: {
    getState: () => PertinentState;
    subscribe: (callback: (state: PertinentState) => void) => void;
  };
};

const ACCOUNT_LABEL_NAME_TYPE = NameType.ETHEREUM_ADDRESS;
const ACCOUNT_LABEL_CHAIN_ID = CHAIN_IDS.MAINNET;

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
        variation: ACCOUNT_LABEL_CHAIN_ID,
        value: entry.address,
        name: entry.name,
      });

      console.log('Updated petname following account label update', entry);
    }

    for (const entry of deleted) {
      nameController.setName({
        type: ACCOUNT_LABEL_NAME_TYPE,
        variation: ACCOUNT_LABEL_CHAIN_ID,
        value: entry.address,
        name: entry.name,
      });

      console.log('Removed petname following account label removal', entry);
    }

    oldEntries = cloneDeep(newEntries);
  });
}
