import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getMoneyAccountUpgradeControllerInitMessenger,
  getMoneyAccountUpgradeControllerMessenger,
} from './money-account-upgrade-controller-messenger';

describe('getMoneyAccountUpgradeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMoneyAccountUpgradeControllerMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the actions and events the upgrade sequence and its bootstrap need', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountUpgradeControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'AuthenticatedUserStorageService:createDelegation',
          'AuthenticatedUserStorageService:listDelegations',
          'ChompApiService:associateAddress',
          'ChompApiService:createIntents',
          'ChompApiService:createUpgrade',
          'ChompApiService:getAssociatedAddresses',
          'ChompApiService:getIntentsByAddress',
          'ChompApiService:getServiceDetails',
          'ChompApiService:verifyDelegation',
          'DelegationController:signDelegation',
          'KeyringController:getState',
          'KeyringController:signEip7702Authorization',
          'KeyringController:signPersonalMessage',
          'NetworkController:findNetworkClientIdByChainId',
          'NetworkController:getNetworkClientById',
          'RemoteFeatureFlagController:getState',
        ],
        events: [
          'KeyringController:stateChange',
          'RemoteFeatureFlagController:stateChange',
        ],
      }),
    );
  });
});

describe('getMoneyAccountUpgradeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(
      getMoneyAccountUpgradeControllerInitMessenger(messenger),
    ).toBeInstanceOf(Messenger);
  });

  it('delegates the actions and events the bootstrap hooks need', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountUpgradeControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'GeolocationController:getGeolocation',
          'LegacyBackgroundApiService:addNetwork',
          'NetworkController:getState',
          'OnboardingController:getState',
          'PreferencesController:getState',
          'RemoteFeatureFlagController:getState',
        ],
        events: [
          'OnboardingController:stateChange',
          'PreferencesController:stateChange',
        ],
      }),
    );
  });
});
