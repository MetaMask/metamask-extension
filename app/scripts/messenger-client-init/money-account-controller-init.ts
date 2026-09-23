import { KeyringTypes } from '@metamask/keyring-controller';
import {
  MoneyAccountController,
  type MoneyAccountControllerMessenger,
} from '@metamask/money-account-controller';
import { createProjectLogger } from '@metamask/utils';
import { isMoneyAccountEnabled } from '../../../shared/lib/money/feature-flags';
import type { MoneyAccountControllerInitMessenger } from './messengers/money-account-controller-messenger';
import type { MessengerClientInitFunction } from './types';

const log = createProjectLogger('money-account-controller');

/**
 * Initialize the MoneyAccountController.
 *
 * ## When the account is created
 *
 * `init()` creates the Money keyring in the vault if it is missing, so it is
 * only called when the feature flag is on and the wallet is unlocked — the
 * controller throws while locked, because it cannot reach the seed. Both
 * conditions can change after this function returns, so both triggers are
 * subscribed to and each re-checks the other. `init()` is idempotent (it
 * returns the existing account, guarded by the controller's own mutex), so
 * being driven from several places is safe.
 *
 * The keyring-side trigger is `KeyringController:stateChange`, not `:unlock`,
 * because the unlock event can fire before the keyring list is usable: during
 * a vault restore, `:unlock` is published mid-rebuild while `state.keyrings`
 * is still empty, and the restored HD keyring only lands in state when the
 * operation completes — which fires `stateChange`, since both `isUnlocked`
 * and `keyrings` live in that state. A sync that ran only on `:unlock` would
 * find no primary keyring after a restore and never run again.
 *
 * A sync also runs once at construction. Today this is a no-op — the wallet is
 * always locked while controllers are constructed, because `isUnlocked` is
 * volatile state and every unlock path fires the state change after the
 * subscription above exists — but the eager sync makes creation correct by
 * construction rather than dependent on that event ordering.
 *
 * Creating the account is deliberately **not** gated on the money account being
 * usable. A user with no EIP-7702 delegation on the money chain still gets the
 * keyring — they simply see nothing, which `MoneyAccountAvailabilityService`
 * decides independently. Gating creation on the delegation instead would mean
 * the same seed produced a money account on mobile and none here.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState - The persisted state to restore.
 * @returns The initialized controller.
 */
export const MoneyAccountControllerInit: MessengerClientInitFunction<
  MoneyAccountController,
  MoneyAccountControllerMessenger,
  MoneyAccountControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const controller = new MoneyAccountController({
    messenger: controllerMessenger,
    state: persistedState.MoneyAccountController,
  });

  const isFeatureEnabled = () => {
    const { remoteFeatureFlags } = initMessenger.call(
      'RemoteFeatureFlagController:getState',
    );

    return isMoneyAccountEnabled(remoteFeatureFlags);
  };

  /**
   * Whether the **current** primary seed already has a money account.
   *
   * Asked of the controller rather than by counting entries, because the two
   * differ after a vault restore: the restored SRP gets a new keyring metadata
   * id, so the account recorded against the old one is not this wallet's money
   * account and must not be mistaken for it. Counting entries would leave such
   * a user permanently without one.
   */
  const hasMoneyAccountForPrimarySeed = () =>
    controller.getMoneyAccount() !== undefined;

  const hasAnyMoneyAccount = () =>
    Object.keys(controller.state.moneyAccounts).length > 0;

  /**
   * Whether any recorded money account points at an entropy source that no
   * longer exists in the vault.
   *
   * This happens after a vault restore over an existing wallet: the restore
   * replaces every keyring, so accounts recorded against the old keyring ids
   * become orphans that nothing will ever match again — but they stay in
   * persisted, UI-visible state unless removed here.
   *
   * @param keyrings - The current keyring list, from an unlocked wallet with
   * at least one HD keyring — while locked or mid-rebuild the list is empty
   * and every account would wrongly look stale.
   */
  const hasStaleMoneyAccounts = (keyrings: { metadata: { id: string } }[]) => {
    const entropySourceIds = new Set(
      keyrings.map(({ metadata }) => metadata.id),
    );

    return Object.values(controller.state.moneyAccounts).some(
      (account) => !entropySourceIds.has(account.options.entropy.id),
    );
  };

  const syncMoneyAccount = async () => {
    try {
      const isEnabled = isFeatureEnabled();

      if (!isEnabled) {
        if (hasAnyMoneyAccount()) {
          // Only the controller's own state is cleared. The keyring stays in
          // the vault: removing it would be a destructive response to a flag
          // that can flip back, and re-creating it derives the same address.
          controller.clearState();
        }
        return;
      }

      const { isUnlocked, keyrings } = initMessenger.call(
        'KeyringController:getState',
      );
      if (!isUnlocked) {
        return;
      }

      // An unlocked wallet with no HD keyring is a vault mid-rebuild (the
      // unlock during a restore fires before the keyring list is
      // repopulated). Nothing can be created or judged stale yet; the
      // `stateChange` that lands the keyrings re-runs this sync.
      if (!keyrings.some((keyring) => keyring.type === KeyringTypes.hd)) {
        return;
      }

      if (hasStaleMoneyAccounts(keyrings)) {
        // A restore invalidates every previous entropy source at once, so a
        // stale entry means they are all stale: clearing the whole state loses
        // nothing that `init()` below cannot re-derive for the current seed.
        controller.clearState();
      }

      if (hasMoneyAccountForPrimarySeed()) {
        return;
      }

      await controller.init();
    } catch (error) {
      // A failure here must not take the background down with it. The next
      // keyring state change or remote-flag refresh retries, and until one
      // succeeds the Money surface stays hidden rather than half-rendered.
      log('Failed to sync the money account', error);
    }
  };

  // Fire and forget: `syncMoneyAccount` handles its own failures, so the
  // `catch` is only here to keep the subscription callbacks synchronous.
  const onTrigger = () => {
    syncMoneyAccount().catch(() => undefined);
  };

  initMessenger.subscribe('RemoteFeatureFlagController:stateChange', onTrigger);
  initMessenger.subscribe('KeyringController:stateChange', onTrigger);
  onTrigger();

  return { messengerClient: controller };
};
