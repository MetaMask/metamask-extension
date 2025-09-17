import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getAccountTrackerControllerInitMessenger,
  getAccountTrackerControllerMessenger,
} from './account-tracker-controller-messenger';

describe('getAccountTrackerControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountTrackerControllerMessenger =
      getAccountTrackerControllerMessenger(messenger);

    expect(accountTrackerControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getAccountTrackerControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountTrackerControllerInitMessenger =
      getAccountTrackerControllerInitMessenger(messenger);

    expect(accountTrackerControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
