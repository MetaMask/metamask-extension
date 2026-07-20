import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getAccountActivityServiceMessenger } from './account-activity-service-messenger';

const ACCOUNT_ACTIVITY_SERVICE_DELEGATED_ACTIONS = [
  'AccountTreeController:getAccountsFromSelectedAccountGroup',
  'BackendWebSocketService:connect',
  'BackendWebSocketService:forceReconnection',
  'BackendWebSocketService:subscribe',
  'BackendWebSocketService:getConnectionInfo',
  'BackendWebSocketService:channelHasSubscription',
  'BackendWebSocketService:getSubscriptionsByChannel',
  'BackendWebSocketService:findSubscriptionsByChannelPrefix',
  'BackendWebSocketService:addChannelCallback',
  'BackendWebSocketService:removeChannelCallback',
  'RemoteFeatureFlagController:getState',
] as const;

const ACCOUNT_ACTIVITY_SERVICE_DELEGATED_EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
  'BackendWebSocketService:connectionStateChanged',
  'RemoteFeatureFlagController:stateChange',
] as const;

describe('getAccountActivityServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger = getAccountActivityServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(messenger).toBeDefined();
  });

  it('delegates required actions for AccountActivityService', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(controllerMessenger, 'delegate');

    getAccountActivityServiceMessenger(controllerMessenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          ...ACCOUNT_ACTIVITY_SERVICE_DELEGATED_ACTIONS,
        ]),
      }),
    );
  });

  it('delegates AccountTreeController getAccountsFromSelectedAccountGroup action', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(controllerMessenger, 'delegate');

    getAccountActivityServiceMessenger(controllerMessenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountTreeController:getAccountsFromSelectedAccountGroup',
        ]),
      }),
    );
  });

  it('delegates required events for AccountActivityService', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(controllerMessenger, 'delegate');

    getAccountActivityServiceMessenger(controllerMessenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          ...ACCOUNT_ACTIVITY_SERVICE_DELEGATED_EVENTS,
        ]),
      }),
    );
  });
});
