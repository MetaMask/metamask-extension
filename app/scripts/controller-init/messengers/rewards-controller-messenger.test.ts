import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getRewardsControllerMessenger,
  getRewardsControllerInitMessenger,
} from './rewards-controller-messenger';

describe('getRewardsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const rewardsControllerMessenger = getRewardsControllerMessenger(messenger);

    expect(rewardsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getRewardsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const rewardsControllerInitMessenger =
      getRewardsControllerInitMessenger(messenger);

    expect(rewardsControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
