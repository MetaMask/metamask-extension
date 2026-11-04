import { it as jestIt } from '@jest/globals';
import { submitRequestToBackground } from '../../store/background-connection';
import { referralContextClient } from './referral-context';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('referralContextClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the pending context without arguments', async () => {
    await referralContextClient.getPending();
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'RewardsMoneyController:getPendingReferralContext',
    );
  });

  jestIt.each<[string, 'continue' | 'drop']>([
    ['continueReferralContext', 'continue'],
    ['dropReferralContext', 'drop'],
  ])('calls %s with the context id', async (action, method) => {
    await referralContextClient[method]('context-id');
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      `RewardsMoneyController:${action}`,
      ['context-id'],
    );
  });
});
