import { getUUIDFromAddressOfNormalAccount } from '@metamask/accounts-controller';
import {
  MoneyAccountController,
  type MoneyAccount,
  type MoneyAccountControllerMessenger,
} from '@metamask/money-account-controller';
import { isMpcBackedMoneyAccount } from '../../../../shared/lib/money/mpc-money-account';

export { isMpcBackedMoneyAccount };

const MIGRATE_ACTION = 'MoneyAccountController:migrateMoneyAccountAddress';

/**
 * A money account whose address has been moved onto an MPC keyring.
 *
 * The published `MoneyAccount` options only describe an HD derivation. The
 * marker is stored beside that derivation so the account can still be found
 * by entropy source after the address changes.
 */
export type MpcBackedMoneyAccount = MoneyAccount & {
  options: MoneyAccount['options'] & { mpcKeyring: true };
};

/**
 * `MoneyAccountController` plus a migration onto an MPC address.
 *
 * The published controller only creates the HD-derived money account. MFA
 * replaces that address with the MPC keyring account while keeping the same
 * entropy source, so the rest of Money Account still finds it.
 */
export class MpcMoneyAccountController extends MoneyAccountController {
  constructor(options: {
    messenger: MoneyAccountControllerMessenger;
    state?: ConstructorParameters<typeof MoneyAccountController>[0]['state'];
  }) {
    super(options);

    // Tests replace `MoneyAccountController` with a constructor that returns a
    // plain object, so `messenger` is missing there. Production always has it.
    const messenger = this.messenger as
      | {
          registerActionHandler?: (
            actionType: string,
            handler: (address: string) => void,
          ) => void;
        }
      | undefined;

    messenger?.registerActionHandler?.(MIGRATE_ACTION, (address: string) => {
      this.migrateMoneyAccountAddress(address);
    });
  }

  /**
   * Point the primary money account at `newAddress`.
   *
   * The account id is the UUID of the address, so it is replaced together
   * with the address. The HD entropy source is kept: that is how the account
   * stays tied to this wallet.
   *
   * @param newAddress - The MPC keyring account address.
   */
  migrateMoneyAccountAddress(newAddress: string): void {
    const current = this.getMoneyAccount();
    if (!current) {
      throw new Error('No money account to migrate');
    }

    if (
      current.address.toLowerCase() === newAddress.toLowerCase() &&
      isMpcBackedMoneyAccount(current)
    ) {
      return;
    }

    const id = getUUIDFromAddressOfNormalAccount(newAddress);
    const migrated: MpcBackedMoneyAccount = {
      ...current,
      id,
      address: newAddress,
      options: {
        ...current.options,
        mpcKeyring: true,
      },
    };

    this.update((state) => {
      delete state.moneyAccounts[current.id];
      state.moneyAccounts[id] = migrated;
    });
  }
}
