import { SnapKeyring, SnapKeyringCallbacks } from '@metamask/eth-snap-keyring';
import { SnapId } from '@metamask/snaps-sdk';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import MetamaskController from '../../metamask-controller';
import {
  BITCOIN_WALLET_SNAP_ID,
  SOLANA_WALLET_SNAP_ID,
} from '../../../../shared/lib/accounts';
import { SnapKeyringBuilderMessenger } from './types';
import { SnapKeyringGenericFlow } from './flows/generic-flow';
import { SnapKeyringActions } from './actions';
import { SnapKeyringFlow } from './flows/flow';
import { SnapKeyringNonEvmFlow } from './flows/non-evm-flow';

/**
 * Builder type for the Snap keyring.
 */
export type SnapKeyringBuilder = {
  (): SnapKeyring;
  type: typeof SnapKeyring.type;
};

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * @param controller - Instance of the MetaMask Controller.
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (
  controller: MetamaskController,
  snapId: SnapId,
) => {
  const snapKeyring: SnapKeyring = await controller.getSnapKeyring();
  return await snapKeyring.getAccountsBySnapId(snapId);
};

class SnapKeyringImpl implements SnapKeyringCallbacks {
  readonly #messenger: SnapKeyringBuilderMessenger;

  readonly #actions: SnapKeyringActions;

  constructor(
    messenger: SnapKeyringBuilderMessenger,
    actions: SnapKeyringActions,
  ) {
    this.#messenger = messenger;
    this.#actions = actions;
  }

  getFlow(snapId: SnapId): SnapKeyringFlow {
    if ([BITCOIN_WALLET_SNAP_ID, SOLANA_WALLET_SNAP_ID].includes(snapId)) {
      return new SnapKeyringNonEvmFlow(this.#messenger, this.#actions);
    }

    return new SnapKeyringGenericFlow(this.#messenger, this.#actions);
  }

  async addressExists(address: string) {
    const addresses = await this.#messenger.call(
      'KeyringController:getAccounts',
    );
    return addresses.includes(address.toLowerCase());
  }

  async redirectUser(snapId: string, url: string, message: string) {
    assertIsValidSnapId(snapId);

    const flow = this.getFlow(snapId);
    if (flow.onRedirectUser) {
      await flow.onRedirectUser(snapId, url, message);
    }
  }

  async saveState() {
    await this.#actions.persistAccountsState();
  }

  async addAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
    onceSaved: Promise<string>,
    accountNameSuggestion: string = '',
    displayConfirmation: boolean = false,
    displayAccountNameSuggestion: boolean = true,
  ) {
    assertIsValidSnapId(snapId);

    return await this.getFlow(snapId).onAddAccount(
      address,
      snapId,
      handleUserInput,
      onceSaved,
      accountNameSuggestion,
      displayConfirmation,
      displayAccountNameSuggestion,
    );
  }

  async removeAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
  ) {
    assertIsValidSnapId(snapId);

    return await this.getFlow(snapId).onRemoveAccount(
      address,
      snapId,
      handleUserInput,
    );
  }
}

/**
 * Constructs a SnapKeyring builder with specified handlers for managing Snap accounts.
 *
 * @param messenger - The messenger instace.
 * @param actions - Actions required by the Snap keyring implementation.
 * @returns A Snap keyring builder.
 */
export function snapKeyringBuilder(
  messenger: SnapKeyringBuilderMessenger,
  actions: SnapKeyringActions,
) {
  const builder = (() => {
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    return new SnapKeyring(messenger, new SnapKeyringImpl(messenger, actions));
  }) as SnapKeyringBuilder;
  builder.type = SnapKeyring.type;

  return builder;
}
