import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getRewardsControllerMessenger,
  getRewardsControllerInitMessenger,
} from './rewards-controller-messenger';

describe('getRewardsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const rewardsControllerMessenger = getRewardsControllerMessenger(messenger);

    expect(rewardsControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getRewardsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const rewardsControllerInitMessenger =
      getRewardsControllerInitMessenger(messenger);

    expect(rewardsControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
