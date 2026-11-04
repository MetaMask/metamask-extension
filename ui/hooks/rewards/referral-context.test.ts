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

  jestIt.each<[string, 'continue' | 'drop' | 'take']>([
    ['continueReferralContext', 'continue'],
    ['dropReferralContext', 'drop'],
    ['takeReferralContext', 'take'],
  ])('calls %s with the context id', async (action, method) => {
    await referralContextClient[method]('context-id');
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      `RewardsMoneyController:${action}`,
      ['context-id'],
    );
  });

  it('answers with the displayed code', async () => {
    await referralContextClient.answer('ABC');
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'RewardsMoneyController:answerReferralContext',
      ['ABC'],
    );
  });
});
