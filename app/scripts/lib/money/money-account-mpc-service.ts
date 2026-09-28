import type {
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetStateAction,
  KeyringControllerWithKeyringAction,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { MoneyAccountControllerInitAction } from '@metamask/money-account-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import { MPC_KEYRING_TYPE } from '../../../../shared/constants/mpc-keyring';

const serviceName = 'MoneyAccountMpcService';

type MigrateMoneyAccountAddressAction = {
  type: 'MoneyAccountController:migrateMoneyAccountAddress';
  handler: (address: string) => void;
};

type MoneyAccountMpcAllowedActions =
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringAction
  | MoneyAccountControllerInitAction
  | MigrateMoneyAccountAddressAction;

export type MoneyAccountMpcServiceEnableMfaAction = {
  type: `${typeof serviceName}:enableMfa`;
  handler: MoneyAccountMpcService['enableMfa'];
};

export type MoneyAccountMpcMessenger = Messenger<
  typeof serviceName,
  MoneyAccountMpcServiceEnableMfaAction | MoneyAccountMpcAllowedActions,
  never
>;

/**
 * Creates an MPC keyring account and migrates the Money Account onto it.
 */
export class MoneyAccountMpcService {
  readonly name: typeof serviceName = serviceName;

  readonly #messenger: MoneyAccountMpcMessenger;

  constructor({ messenger }: { messenger: MoneyAccountMpcMessenger }) {
    this.#messenger = messenger;
    this.#messenger.registerMethodActionHandlers(this, ['enableMfa']);
  }

  /**
   * Create the MPC account, if this wallet does not already have one, and
   * point the Money Account at its address.
   *
   * `KeyringController.addNewKeyring` deserializes `{ mode: 'create' }` and
   * then calls `init()`, which runs MPC key generation against the cloud.
   *
   * @returns The MPC account address the Money Account now uses.
   */
  async enableMfa(): Promise<{ address: Hex }> {
    await this.#messenger.call('MoneyAccountController:init');

    const address = await this.#resolveMpcAddress();
    await this.#messenger.call(
      'MoneyAccountController:migrateMoneyAccountAddress',
      address,
    );

    return { address };
  }

  async #resolveMpcAddress(): Promise<Hex> {
    const { keyrings } = await this.#messenger.call(
      'KeyringController:getState',
    );
    const existing = keyrings.find(
      (keyring) => keyring.type === MPC_KEYRING_TYPE,
    );
    const existingAddress = existing?.accounts[0];
    if (isStrictHexString(existingAddress)) {
      return existingAddress;
    }

    // The published type says this returns a `KeyringEntry`. The controller
    // returns the keyring metadata (`{ id, name }`).
    const created = (await this.#messenger.call(
      'KeyringController:addNewKeyring',
      MPC_KEYRING_TYPE,
      { mode: 'create' },
    )) as { id: string };
    const keyringId = created.id;

    const accounts = (await this.#messenger.call(
      'KeyringController:withKeyring',
      { id: keyringId },
      async ({ keyring }) =>
        (keyring as { getAccounts: () => Promise<string[]> }).getAccounts(),
    )) as unknown as string[];

    const address = accounts[0];
    if (!isStrictHexString(address)) {
      throw new Error('MPC keyring did not produce an account address');
    }

    return address;
  }
}
