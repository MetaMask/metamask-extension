import { Env } from '@metamask/subscription-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { getSubscriptionServiceInstanceOptions } from './subscription-controller';

jest.mock('../../../../shared/lib/shield');

describe('getSubscriptionServiceInstanceOptions', () => {
  it('returns the configured environment and service dependencies', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      subscriptionEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    expect(getSubscriptionServiceInstanceOptions()).toStrictEqual({
      env: Env.UAT,
      fetchFunction: expect.any(Function),
      captureException: expect.any(Function),
    });
  });
});
