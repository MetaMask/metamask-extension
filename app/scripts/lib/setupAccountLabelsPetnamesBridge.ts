import { NameController, NameType } from '@metamask/name-controller';
import {
  PreferencesController,
  AccountIdentityEntry,
  PreferencesControllerState,
} from '../controllers/preferences';
import { NameEntry, OneWayNameBridge } from './NameBridge';

export const ACCOUNT_LABEL_NAME_TYPE = NameType.ETHEREUM_ADDRESS;
export const ACCOUNT_LABEL_VARIATION = '*';

/**
 * Sets up a bridge between the account labels in the preferences controller and
 * the petnames in the name controller.
 *
 * @param preferencesController - The preferences controller to listen to.
 * @param nameController - The name controller to update.
 */
export default function setupAccountLabelsPetnamesBridge(
  preferencesController: PreferencesController,
  nameController: NameController,
) {
  const bridge = new OneWayNameBridge(nameController, () =>
    selectAccountLabelEntries(preferencesController.store.getState()),
  );
  preferencesController.store.subscribe(bridge.synchronize);
}

/**
 * Selects the account label entries from the preferences controller state.
 *
 * @param state - The preferences controller state.
 * @returns The account label entries.
 */
function selectAccountLabelEntries(
  state: PreferencesControllerState,
): NameEntry[] {
  const { identities } = state;
  return Object.values(identities).map((identity: AccountIdentityEntry) => ({
    value: identity.address,
    type: ACCOUNT_LABEL_NAME_TYPE,
    name: identity.name,
    sourceId: null,
    variation: ACCOUNT_LABEL_VARIATION,
  }));
}
