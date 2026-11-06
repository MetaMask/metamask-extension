import type { KeyringV2Builder } from '@metamask/keyring-controller';
import type { Keyring } from '@metamask/keyring-utils';
import {
  isWatchOnlyKeyringV1Adapter,
  WatchOnlyKeyring,
  WatchOnlyKeyringV1Adapter,
} from '@metamask/watch-only-keyring';

/**
 * Build the V1 keyring builder for the watch-only keyring.
 *
 * The builder is registered unconditionally, and not behind the dev-mode
 * gate. A builder is what lets `KeyringController` recognise the
 * `"watch-only"` type while deserializing the vault, so a user who has a
 * watch-only keyring must always have the builder available — including when
 * the gate has since been turned off. Registering it creates nothing on its
 * own: the keyring only enters the vault when the
 * `WatchOnlyAccountService` asks for it.
 *
 * @returns The watch-only keyring builder.
 */
export function buildWatchOnlyKeyringBuilder() {
  // The adapter does not implement the full v1 `Keyring` contract (notably
  // `addAccounts`), like the Snap keyring v1 adapter; the cast matches how
  // the Snap keyring registers its own adapter.
  const builder = () =>
    new WatchOnlyKeyringV1Adapter(new WatchOnlyKeyring()) as unknown as Keyring;

  builder.type = WatchOnlyKeyring.type;

  return builder;
}

/**
 * Build the V2 keyring builder for the watch-only keyring.
 *
 * The V1 entry is a {@link WatchOnlyKeyringV1Adapter} wrapping the actual v2
 * keyring, so the V2 builder just unwraps the same inner instance — both
 * entries share one object, like the Snap keyring.
 *
 * @returns The watch-only keyring V2 builder.
 */
export function buildWatchOnlyKeyringV2Builder(): KeyringV2Builder {
  const builder = Object.assign(
    (keyring: unknown) => {
      if (!isWatchOnlyKeyringV1Adapter(keyring)) {
        throw new Error(
          'Expected WatchOnlyKeyringV1Adapter instance (that wraps a WatchOnlyKeyring)',
        );
      }

      return keyring.unwrap();
    },
    { type: WatchOnlyKeyring.type },
  );

  // `KeyringV2Builder` declares its parameter and return types in terms of
  // `@metamask/keyring-controller`'s `Keyring` / `KeyringV2`, which the
  // unwrapped keyring satisfies structurally; this single boundary cast keeps
  // callers free of repeated assertions, as it does for the other builders.
  return builder as unknown as KeyringV2Builder;
}
