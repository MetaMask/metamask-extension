import {
  SnapKeyringV1Adapter,
  SnapKeyring as SnapKeyringV2,
} from '@metamask/eth-snap-keyring/v2';
import { KeyringV1Adapter } from '@metamask/keyring-sdk/v2';
import { KeyringType } from '@metamask/keyring-api/v2';
import { KeyringAccount } from '@metamask/keyring-api';
import { Keyring } from '@metamask/keyring-utils';
import { assert } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import { isFlask } from '../../../../shared/lib/build-types';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../messenger';
import { getSnapKeyringBuilderMessenger } from '../../messenger-client-init/messengers/accounts/snap-keyring-builder-messenger';
import { SnapKeyringV2BuilderMessenger } from './types';
import { SnapKeyringImpl } from './snap-keyring';

/**
 * Builder type for the Snap keyring v2 (adapted as v1).
 */
export type SnapKeyringV2AdaptedAsV1Builder = {
  (): Keyring;
  // We use the same keyring type (v2 type here) even for the v1 adapter. Otherwise, that would conflict with
  // the existing legacy Snap keyring.
  type: KeyringType.Snap;
};

/**
 * Builder type for the Snap keyring v2.
 */
export type SnapKeyringV2Builder = {
  (keyring: Keyring): SnapKeyringV2;
  type: KeyringType.Snap;
};

export class SnapKeyringV2Impl extends SnapKeyringImpl {
  async assertAccountCanBeUsed(_account: KeyringAccount) {
    // No-op because the v2 keyring is relying on proper user of `withKeyringV2` which will make sure the
    // account can be used (e.g unique addresses, unique account IDs).
  }
}

/**
 * Adapts a v2 Snap keyring for legacy private-key export calls.
 *
 * The upstream adapter assumes every private key is hexadecimal. Multichain
 * Snaps declare their supported encoding in their keyring capabilities, so
 * export must use that encoding instead.
 */
export class MultichainSnapKeyringV1Adapter extends SnapKeyringV1Adapter {
  readonly #messenger: SnapKeyringV2BuilderMessenger;

  constructor(
    keyring: SnapKeyringV2,
    messenger: SnapKeyringV2BuilderMessenger,
  ) {
    super(keyring);
    this.#messenger = messenger;
  }

  /**
   * Exports an account using the first private-key format declared by its Snap.
   *
   * @param address - Address of the account to export.
   * @returns The private key encoded in the format declared by the Snap.
   */
  async exportAccount(address: string): Promise<string> {
    const account = this.inner.lookupByAddress(address);
    assert(account, `No Snap account found for address: ${address}`);

    const exportFormat = this.inner.capabilities.privateKey?.exportFormats?.[0];
    assert(
      exportFormat,
      `Snap "${this.inner.snapId}" does not support private key export`,
    );

    const result = await this.#messenger.call('SnapController:handleRequest', {
      origin: 'metamask',
      snapId: this.inner.snapId,
      handler: HandlerType.OnKeyringRequest,
      request: {
        jsonrpc: '2.0',
        id: account.id,
        method: 'keyring_exportAccount',
        params: {
          id: account.id,
          options: {
            type: 'private-key',
            encoding: exportFormat.encoding,
          },
        },
      },
    });
    assert(
      typeof result === 'object' &&
        result !== null &&
        'privateKey' in result &&
        typeof result.privateKey === 'string',
      'Snap account export did not return a private key',
    );

    return result.privateKey;
  }
}

/**
 * Gets the messenger for a Snap keyring (v2), which is used to handle communication between the keyring
 * and the rest of the extension.
 *
 * @param messenger - The root messenger instance, used to create a child messenger for the Snap keyring and to delegate necessary actions to it.
 * @returns The Snap keyring (v2) messenger instance.
 */
export function getSnapKeyringV2BuilderMessenger(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
): SnapKeyringV2BuilderMessenger {
  return getSnapKeyringBuilderMessenger(messenger);
}

/**
 * Constructs a v2 SnapKeyring builder with specified handlers for managing Snap accounts.
 *
 * @param messenger - The messenger instance.
 * @returns A v2 Snap keyring builder.
 */
export function snapKeyringV2AdaptedAsV1Builder(
  messenger: SnapKeyringV2BuilderMessenger,
): SnapKeyringV2AdaptedAsV1Builder {
  const SnapKeyringV2AdaptedAsV1Builder = () => {
    const v2 = new SnapKeyringV2({
      messenger,
      callbacks: new SnapKeyringV2Impl(messenger),
      // Enables generic account creation for new chain integration. It's
      // Flask-only since production should use defined account types.
      isAnyAccountTypeAllowed: isFlask(),
    });

    // NOTE: This adapter cannot really be used as a true v1 keyring, but here
    // we only need it to satisfy the type requirements of the existing keyring controller
    // so it can be used for the usual keyrings lifecycles, it MUST NOT be used it with
    // the other v1 methods!
    return new MultichainSnapKeyringV1Adapter(
      v2,
      messenger,
    ) as unknown as Keyring;
  };
  SnapKeyringV2AdaptedAsV1Builder.type = KeyringType.Snap as const;

  return SnapKeyringV2AdaptedAsV1Builder;
}

/**
 * Constructs a v2 SnapKeyring builder with specified handlers for managing Snap accounts.
 *
 * @returns A v2 Snap keyring builder.
 */
export function snapKeyringV2Builder(): SnapKeyringV2Builder {
  const SnapKeyringV2Builder = (keyring: Keyring) => {
    assert(
      keyring instanceof KeyringV1Adapter,
      'Expected KeyringV1Adapter instance (that wraps a SnapKeyringV2)',
    );

    // We retrieve the original v2 reference from the adapter to ensure both v1 and v2
    // builders share the same underlying SnapKeyringV2 instance.
    return keyring.unwrap() as SnapKeyringV2;
  };
  SnapKeyringV2Builder.type = KeyringType.Snap as const;

  return SnapKeyringV2Builder;
}
