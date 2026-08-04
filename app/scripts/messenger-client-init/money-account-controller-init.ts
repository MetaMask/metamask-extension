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
 * being driven from two places is safe.
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

    // The same parser the availability gate and the UI selector use, so the
    // three cannot disagree about what the flag means.
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

      if (hasMoneyAccountForPrimarySeed()) {
        return;
      }

      const { isUnlocked } = initMessenger.call('KeyringController:getState');
      if (!isUnlocked) {
        return;
      }

      await controller.init();
    } catch (error) {
      // A failure here must not take the background down with it. The next
      // unlock or remote-flag refresh retries, and until one succeeds the
      // Money surface stays hidden rather than half-rendered.
      log('Failed to sync the money account', error);
    }
  };

  // Fire and forget: `syncMoneyAccount` handles its own failures, so the
  // `catch` is only here to keep the subscription callbacks synchronous.
  const onTrigger = () => {
    syncMoneyAccount().catch(() => undefined);
  };

  initMessenger.subscribe('RemoteFeatureFlagController:stateChange', onTrigger);
  initMessenger.subscribe('KeyringController:unlock', onTrigger);

  return { messengerClient: controller };
};
