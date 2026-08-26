import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMoneyAccountUpgradeControllerMessenger } from './money-account-upgrade-controller-messenger';

describe('getMoneyAccountUpgradeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMoneyAccountUpgradeControllerMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the actions the upgrade sequence needs', () => {
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
          'KeyringController:signEip7702Authorization',
          'KeyringController:signPersonalMessage',
          'NetworkController:findNetworkClientIdByChainId',
          'NetworkController:getNetworkClientById',
        ],
        events: [],
      }),
    );
  });
});
