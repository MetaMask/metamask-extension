import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getMoneyAccountLifecycleControllerInitMessenger,
  getMoneyAccountLifecycleControllerMessenger,
} from './money-account-lifecycle-controller-messenger';

describe('getMoneyAccountLifecycleControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(
      getMoneyAccountLifecycleControllerMessenger(messenger),
    ).toBeInstanceOf(Messenger);
  });

  it('delegates the actions and events the lifecycle controller needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountLifecycleControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'ChompApiService:getDerivedIdentities',
          'ChompApiService:getDerivedIdentityByAddress',
          'ChompApiService:startFundsTransfer',
          'KeyringController:getState',
          'MoneyAccountController:createMoneyAccount',
          'MoneyAccountController:getMoneyAccount',
          'MoneyAccountController:setDefaultMoneyAccount',
          'MoneyAccountUpgradeController:getRegistrationStatus',
          'MoneyAccountUpgradeController:registerMigrationIntents',
          'MoneyAccountUpgradeController:upgradeAccount',
          'MoneyAccountUpgradeController:upgradeSuccessorAccount',
          'RemoteFeatureFlagController:getState',
          'SubscriptionController:getPricing',
          'SubscriptionController:getSubscriptions',
          'SubscriptionController:updatePaymentMethod',
          'SubscriptionDelegationService:prepareDelegation',
        ],
        events: [
          'KeyringController:stateChange',
          'MoneyAccountController:stateChange',
          'RemoteFeatureFlagController:stateChange',
        ],
      }),
    );
  });
});

describe('getMoneyAccountLifecycleControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(
      getMoneyAccountLifecycleControllerInitMessenger(messenger),
    ).toBeInstanceOf(Messenger);
  });

  it('delegates the actions and events the client gates need', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountLifecycleControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'OnboardingController:getState',
          'PreferencesController:getState',
        ],
        events: [
          'OnboardingController:stateChange',
          'PreferencesController:stateChange',
        ],
      }),
    );
  });
});
