import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getNetworkEnablementControllerMessenger,
  getNetworkEnablementControllerInitMessenger,
} from './network-enablement-controller-messenger';

const NETWORK_ENABLEMENT_CONTROLLER_DELEGATED_ACTIONS = [
  'NetworkController:getState',
  'MultichainNetworkController:getState',
] as const;

const NETWORK_ENABLEMENT_CONTROLLER_DELEGATED_EVENTS = [
  'NetworkController:networkAdded',
  'NetworkController:networkRemoved',
  'NetworkController:stateChange',
  'TransactionController:transactionSubmitted',
] as const;

describe('getNetworkEnablementControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const networkEnablementControllerMessenger =
      getNetworkEnablementControllerMessenger(messenger);
    expect(networkEnablementControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates required actions for NetworkEnablementController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getNetworkEnablementControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          ...NETWORK_ENABLEMENT_CONTROLLER_DELEGATED_ACTIONS,
        ]),
      }),
    );
  });

  it('delegates required events for NetworkEnablementController', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getNetworkEnablementControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          ...NETWORK_ENABLEMENT_CONTROLLER_DELEGATED_EVENTS,
        ]),
      }),
    );
  });
});

describe('getNetworkEnablementControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const networkEnablementControllerInitMessenger =
      getNetworkEnablementControllerInitMessenger(messenger);
    expect(networkEnablementControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
