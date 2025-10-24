import { Messenger } from '@metamask/messenger';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getTokenDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getTokenDetectionControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getTokenDetectionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const initMessenger = getTokenDetectionControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(Messenger);
  });
});
