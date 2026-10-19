import { captureException } from '../../../shared/lib/sentry';
import { reportRewardsMoneyReadFailure } from './report-rewards-money-read-failure';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

describe('reportRewardsMoneyReadFailure', () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  it('skips the first short busy response and reports the follow-up', () => {
    const busy = { data: { status: 503, retryAfterSeconds: 2 } };

    reportRewardsMoneyReadFailure(
      busy,
      'referralMe.fetch_failed',
      false,
      'rewards-money',
    );
    expect(mockCaptureException).not.toHaveBeenCalled();

    reportRewardsMoneyReadFailure(
      busy,
      'referralMe.fetch_failed',
      true,
      'rewards-money',
    );
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { feature: 'rewards-money', context: 'referralMe.fetch_failed' },
    });
  });

  it('skips a disabled controller', () => {
    reportRewardsMoneyReadFailure(
      new Error('Rewards Money is disabled'),
      'referralMe.fetch_failed',
      false,
      'rewards-money',
    );

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('reports a hard failure once', () => {
    const error = new Error('network');

    reportRewardsMoneyReadFailure(
      error,
      'referralMe.fetch_failed',
      false,
      'rewards-money',
    );
    reportRewardsMoneyReadFailure(
      error,
      'referralMe.fetch_failed',
      false,
      'rewards-money',
    );

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });
});
