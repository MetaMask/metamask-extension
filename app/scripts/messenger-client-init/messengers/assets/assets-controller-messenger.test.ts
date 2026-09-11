import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  ASSETS_CONTROLLER_DELEGATED_ACTIONS,
  ASSETS_CONTROLLER_DELEGATED_EVENTS,
  ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS,
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets-controller-messenger';

describe('getAssetsControllerMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);
    expect(assetsControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('creates messenger with AssetsController namespace', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = getAssetsControllerMessenger(messenger);

    // The messenger should have the namespace property accessible
    expect(assetsControllerMessenger).toBeDefined();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_DELEGATED_ACTIONS)(
    'delegates %s action',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_DELEGATED_EVENTS)(
    'delegates %s event',
    (event: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([event]),
        }),
      );
    },
  );

  it('does not delegate AccountTreeController:stateChange (core#10059)', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    const delegateCall = delegateSpy.mock.calls[0]?.[0] as {
      events?: string[];
    };
    expect(delegateCall.events).not.toContain(
      'AccountTreeController:stateChange',
    );
  });

  it('delegates core#10059 lifecycle getState/isUnlocked actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAssetsControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'AccountTreeController:isInitialized',
          'ClientController:getState',
          'KeyringController:isUnlocked',
        ]),
      }),
    );
  });
});

describe('getAssetsControllerInitMessenger', () => {
  it('returns a messenger instance', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerInitMessenger =
      getAssetsControllerInitMessenger(messenger);
    expect(assetsControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('creates messenger with AssetsControllerInit namespace', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerInitMessenger =
      getAssetsControllerInitMessenger(messenger);

    // The messenger should have the namespace property accessible
    expect(assetsControllerInitMessenger).toBeDefined();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS)(
    'delegates %s action for initialization',
    (action: string) => {
      const messenger = getRootMessenger<never, never>();
      const delegateSpy = jest.spyOn(messenger, 'delegate');

      getAssetsControllerInitMessenger(messenger);

      expect(delegateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining([action]),
        }),
      );
    },
  );
});
