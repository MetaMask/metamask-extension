import { MpcKeyring as MpcKeyringV2 } from '@metamask/eth-mpc-keyring/v2';
import { type KeyringV2Builder } from '@metamask/keyring-controller';

import { MpcKeyring } from './mpc-keyring';

/**
 * Build the V1 keyring builder for the MPC keyring.
 *
 * The V1 MPC keyring implementation is not shipped by
 * `@metamask/eth-mpc-keyring` yet, pending the MFA Wallet SDK, so a local
 * stub (`./mpc-keyring.ts`) stands in: it takes no options, and every
 * method that requires the MPC stack throws. When the package ships the
 * real implementation, this builder will construct it instead.
 *
 * Registration is fenced behind the `MPC_KEYRING_ENABLED` compile-time gate
 * rather than unconditional like the Money builder. That is safe only while
 * no released build can hold an MPC keyring in its vault, because the
 * controller needs the builder to recognize the type while deserializing the
 * vault. Once any released build can hold one, the fence must be removed.
 *
 * @returns The MPC keyring builder.
 */
export function buildMpcKeyringBuilder() {
  const builder = () => new MpcKeyring();

  builder.type = MpcKeyring.type;

  return builder;
}

/**
 * Build the V2 keyring builder for the MPC keyring.
 *
 * Like the hardware V2 wrappers, the MPC V2 wrapper receives the legacy
 * keyring in an options object — but only `legacyKeyring`, without an
 * `entropySource`: the MPC keyring has no entropy source of its own.
 *
 * @returns The MPC keyring V2 builder.
 */
export function buildMpcKeyringV2Builder(): KeyringV2Builder {
  const builder = Object.assign(
    (keyring: unknown) =>
      new MpcKeyringV2({ legacyKeyring: keyring as MpcKeyring }),
    { type: MpcKeyring.type },
  );

  // `KeyringV2Builder` declares its parameter and return types in terms of
  // `@metamask/keyring-controller`'s `Keyring` / `KeyringV2`, which the wrapper
  // satisfies structurally; this single boundary cast keeps callers free of
  // repeated assertions, as it does for the other builders.
  return builder as unknown as KeyringV2Builder;
}
