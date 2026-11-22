import { Env } from '@metamask/subscription-controller';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';
import { getSubscriptionServiceInstanceOptions } from './subscription-service';

jest.mock('../../../../shared/lib/shield');

describe('getSubscriptionServiceInstanceOptions', () => {
  it('returns the configured environment and service dependencies', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      subscriptionEnv: Env.UAT,
    } as ReturnType<typeof loadShieldConfig>);

    const options = getSubscriptionServiceInstanceOptions();

    expect(options).toStrictEqual({
      env: Env.UAT,
      captureException,
      fetchFunction: expect.any(Function),
    });
    expect(options.fetchFunction).not.toBe(globalThis.fetch);
  });
});
