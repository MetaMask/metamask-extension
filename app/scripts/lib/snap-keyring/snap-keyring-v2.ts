import { SnapKeyring as SnapKeyringV2 } from '@metamask/eth-snap-keyring/v2';
import { KeyringV1Adapter } from '@metamask/keyring-sdk/v2';
import { KeyringType } from '@metamask/keyring-api/v2';
import { KeyringAccount } from '@metamask/keyring-api';
import { KeyringBuilder, KeyringV2Builder } from '@metamask/keyring-controller';
import { Keyring } from '@metamask/keyring-utils';
import { assert } from '@metamask/utils';
import { isFlask } from '../../../../shared/lib/build-types';
import { SnapKeyringBuilderV2Messenger } from './types';
import { SnapKeyringImpl, SnapKeyringHelpers } from './snap-keyring';

/**
 * Builder type for the v2 Snap keyring.
 */
export type SnapKeyringBuilderV2 = {
  name: 'SnapKeyringBuilderV2';
  state: null;

  v1Builder: KeyringBuilder;
  v2Builder: KeyringV2Builder;
};

/**
 * Helpers for the v2 Snap keyring implementation.
 */
export type SnapKeyringV2Helpers = SnapKeyringHelpers;

export class SnapKeyringV2Impl extends SnapKeyringImpl {
  async assertAccountCanBeUsed(_account: KeyringAccount) {
    // No-op because the v2 keyring is relying on proper user of `withKeyringV2` which will make sure the
    // account can be used (e.g unique addresses, unique account IDs).
  }
}

/**
 * Constructs a v2 SnapKeyring builder with specified handlers for managing Snap accounts.
 *
 * @param messenger - The messenger instance.
 * @param helpers - Helpers required by the v2 Snap keyring implementation.
 * @returns A v2 Snap keyring builder.
 */
export function snapKeyringBuilderV2(
  messenger: SnapKeyringBuilderV2Messenger,
  helpers: SnapKeyringV2Helpers,
): SnapKeyringBuilderV2 {
  const SnapKeyringBuilderV2AdapterV1 = () => {
    const v2 = new SnapKeyringV2({
      messenger,
      callbacks: new SnapKeyringV2Impl(messenger, helpers),
      // Enables generic account creation for new chain integration. It's
      // Flask-only since production should use defined account types.
      isAnyAccountTypeAllowed: isFlask(),
    });

    // NOTE: This adapter cannot really be used as a true v1 keyring, but here
    // we only need it to satisfy the type requirements of the existing keyring controller
    // so it can be used for the usual keyrings lifecycles, it MUST NOT be used it with
    // the other v1 methods!
    return new KeyringV1Adapter(v2) as unknown as Keyring;
  };
  SnapKeyringBuilderV2AdapterV1.type = KeyringType.Snap;

  const SnapKeyringBuilderV2 = (keyring: Keyring) => {
    assert(
      keyring instanceof KeyringV1Adapter,
      'Expected SnapKeyringV2 instance',
    );

    // We retrieve the original v2 reference from the adapter to ensure both v1 and v2
    // builders share the same underlying SnapKeyringV2 instance.
    return keyring.unwrap() as SnapKeyringV2;
  };
  SnapKeyringBuilderV2.type = KeyringType.Snap;

  return {
    name: 'SnapKeyringBuilderV2',
    state: null,
    v1Builder: SnapKeyringBuilderV2AdapterV1,
    v2Builder: SnapKeyringBuilderV2,
  };
}
