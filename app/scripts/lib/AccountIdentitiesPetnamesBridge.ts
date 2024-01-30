import {
  FALLBACK_VARIATION,
  NameController,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import {
  PreferencesController,
  AccountIdentityEntry,
} from '../controllers/preferences';
import {
  PetnameEntry,
  AbstractPetnamesBridge,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

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
      sourceId: undefined,
      variation: FALLBACK_VARIATION,
      origin: NameOrigin.ACCOUNT_IDENTITY,
    }));
  }

  /**
   * @override
   */
  protected onSourceChange(listener: () => void): void {
    this.#preferencesController.store.subscribe(listener);
  }

  /**
   * @override
   */
  protected shouldSyncPetname(targetEntry: PetnameEntry): boolean {
    return targetEntry.origin === NameOrigin.ACCOUNT_IDENTITY;
  }
}
