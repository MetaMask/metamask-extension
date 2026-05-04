import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';

describe('getTokenDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');
    const controllerMessenger = getTokenDetectionControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining(['NetworkController:networkAdded']),
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
});
