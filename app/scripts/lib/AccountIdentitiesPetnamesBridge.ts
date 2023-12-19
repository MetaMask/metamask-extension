import { NameController, NameType } from '@metamask/name-controller';
import {
  PreferencesController,
  AccountIdentityEntry,
} from '../controllers/preferences';
import {
  PetnameEntry,
  AbstractPetnamesBridge,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

export const FALLBACK_VARIATION = '*';

/**
 * A petnames bridge that uses the account identities from the preferences controller as the source.
 */
export class AccountIdentitiesPetnamesBridge extends AbstractPetnamesBridge {
  #preferencesController: PreferencesController;

  constructor({
    preferencesController,
    nameController,
    messenger,
  }: {
    preferencesController: PreferencesController;
    nameController: NameController;
    messenger: PetnamesBridgeMessenger;
  }) {
    super({ isTwoWay: false, nameController, messenger });
    this.#preferencesController = preferencesController;
  }

  /**
   * @override
   */
  protected getSourceEntries(): PetnameEntry[] {
    const { identities } = this.#preferencesController.store.getState();
    return Object.values(identities).map((identity: AccountIdentityEntry) => ({
      value: identity.address,
      type: NameType.ETHEREUM_ADDRESS,
      name: identity.name,
      sourceId: null,
      variation: FALLBACK_VARIATION,
    }));
  }

  /**
   * @override
   */
  protected onSourceChange(listener: () => void): void {
    this.#preferencesController.store.subscribe(listener);
  }
}
