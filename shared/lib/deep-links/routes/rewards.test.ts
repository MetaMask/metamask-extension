import { rewards } from './rewards';

describe('rewards deep link route', () => {
  it('has the correct pathname', () => {
    expect(rewards.pathname).toBe('/rewards');
  });

  it('returns the correct title key', () => {
    expect(rewards.getTitle(new URLSearchParams())).toBe(
      'deepLink_theRewardsPage',
    );
  });

  it('returns the /rewards route and preserves query parameters', () => {
    const params = new URLSearchParams(
      'referral=ABC123&sig_params=referral&sig=signature&utm_source=twitter&_hsenc=value&attributionId=attr',
    );

    const destination = rewards.handler(params);

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe('/rewards');
    expect((destination as { query: URLSearchParams }).query.toString()).toBe(
      params.toString(),
    );
  });
});
