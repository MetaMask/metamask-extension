import {
  FALLBACK_VARIATION,
  NameController,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import { InternalAccount } from '@metamask/keyring-api';
import {
  PetnameEntry,
  AbstractPetnamesBridge,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

/**
 * A petnames bridge that uses the account identities from the preferences controller as the source.
 */
export class AccountIdentitiesPetnamesBridge extends AbstractPetnamesBridge {
  constructor({
    nameController,
    messenger,
  }: {
    nameController: NameController;
    messenger: PetnamesBridgeMessenger;
  }) {
    super({ isTwoWay: false, nameController, messenger });
  }

  /**
   * @override
   */
  protected getSourceEntries(): PetnameEntry[] {
    const internalAccounts = this.messenger.call(
      'AccountsController:listAccounts',
    );
    return internalAccounts.map((internalAccount: InternalAccount) => ({
      value: internalAccount.address,
      type: NameType.ETHEREUM_ADDRESS,
      name: internalAccount.metadata.name,
      sourceId: undefined,
      variation: FALLBACK_VARIATION,
      origin: NameOrigin.ACCOUNT_IDENTITY,
    }));
  }

  /**
   * @override
   */
  protected onSourceChange(listener: () => void): void {
    this.messenger.subscribe('AccountsController:stateChange', listener);
  }

  /**
   * @override
   */
  protected shouldSyncPetname(targetEntry: PetnameEntry): boolean {
    return targetEntry.origin === NameOrigin.ACCOUNT_IDENTITY;
  }
}
