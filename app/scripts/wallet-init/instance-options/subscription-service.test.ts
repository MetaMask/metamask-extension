import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';
import { getSubscriptionServiceInstanceOptions } from './subscription-service';

jest.mock('../../../../shared/lib/shield');

describe('getSubscriptionServiceInstanceOptions', () => {
  it('returns the configured API base URL and service dependencies', () => {
    jest.mocked(loadShieldConfig).mockReturnValue({
      subscriptionApiUrl: 'https://subscription.uat-api.cx.metamask.io',
    } as ReturnType<typeof loadShieldConfig>);

    const options = getSubscriptionServiceInstanceOptions();

    expect(options).toStrictEqual({
      baseUrl: 'https://subscription.uat-api.cx.metamask.io',
      captureException,
      fetchFunction: expect.any(Function),
    });
    expect(options.fetchFunction).not.toBe(globalThis.fetch);
  });
});
