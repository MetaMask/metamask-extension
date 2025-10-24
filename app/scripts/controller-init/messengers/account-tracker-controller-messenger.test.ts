import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getAccountTrackerControllerInitMessenger,
  getAccountTrackerControllerMessenger,
} from './account-tracker-controller-messenger';

describe('getAccountTrackerControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const accountTrackerControllerMessenger =
      getAccountTrackerControllerMessenger(messenger);

    expect(accountTrackerControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getAccountTrackerControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const accountTrackerControllerInitMessenger =
      getAccountTrackerControllerInitMessenger(messenger);

    expect(accountTrackerControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
