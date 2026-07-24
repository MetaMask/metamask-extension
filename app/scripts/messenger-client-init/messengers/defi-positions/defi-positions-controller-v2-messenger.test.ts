import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getDeFiPositionsControllerV2InitMessenger,
  getDeFiPositionsControllerV2Messenger,
} from './defi-positions-controller-v2-messenger';

describe('getDeFiPositionsControllerV2Messenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const defiPositionsControllerV2Messenger =
      getDeFiPositionsControllerV2Messenger(messenger);

    expect(defiPositionsControllerV2Messenger).toBeInstanceOf(Messenger);
  });

  it('delegates required actions for DeFiPositionsControllerV2', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getDeFiPositionsControllerV2Messenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['AccountTreeController:getAccountsFromSelectedAccountGroup'],
      }),
    );
  });
});

describe('getDeFiPositionsControllerV2InitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const defiPositionsControllerV2InitMessenger =
      getDeFiPositionsControllerV2InitMessenger(messenger);

    expect(defiPositionsControllerV2InitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates required initialization actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getDeFiPositionsControllerV2InitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'PreferencesController:getState',
          'OnboardingController:getState',
          'RemoteFeatureFlagController:getState',
          'AssetsController:getState',
          'AuthenticationController:getBearerToken',
        ],
      }),
    );
  });
});
