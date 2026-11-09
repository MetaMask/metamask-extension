import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS,
  ASSETS_CONTROLLER_INIT_DELEGATED_EVENTS,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

describe('getAssetsControllerInitMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerInitMessenger =
      getAssetsControllerInitMessenger(messenger);
    expect(assetsControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates initialization actions and events', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [...ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS],
        events: [...ASSETS_CONTROLLER_INIT_DELEGATED_EVENTS],
      }),
    );
  });
});
