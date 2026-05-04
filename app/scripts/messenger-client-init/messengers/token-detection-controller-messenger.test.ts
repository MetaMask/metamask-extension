import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';

describe('getTokenDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getTokenDetectionControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the expected actions and events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTokenDetectionControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledTimes(1);
    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'AccountsController:getAccount',
          'AccountsController:getSelectedAccount',
          'KeyringController:getState',
          'NetworkController:getNetworkClientById',
          'NetworkController:getNetworkConfigurationByNetworkClientId',
          'NetworkController:getState',
          'TokensController:getState',
          'TokensController:addDetectedTokens',
          'TokenListController:getState',
          'PreferencesController:getState',
          'TokensController:addTokens',
          'NetworkController:findNetworkClientIdByChainId',
          'AuthenticationController:getBearerToken',
        ],
        events: [
          'AccountsController:selectedEvmAccountChange',
          'KeyringController:lock',
          'KeyringController:unlock',
          'NetworkController:networkDidChange',
          'NetworkController:networkAdded',
          'TokenListController:stateChange',
          'PreferencesController:stateChange',
          'TransactionController:transactionConfirmed',
        ],
      }),
    );
  });
});

describe('getTokenDetectionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const initMessenger = getTokenDetectionControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the expected initialization actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getTokenDetectionControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledTimes(1);
    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'AssetsContractController:getBalancesInSingleCall',
          'MetaMetricsController:trackEvent',
          'PreferencesController:getState',
        ],
      }),
    );
  });
});
