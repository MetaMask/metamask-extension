import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';

describe('getTokenDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const controllerMessenger = getTokenDetectionControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getTokenDetectionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const initMessenger = getTokenDetectionControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
