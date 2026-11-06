import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE, type Destination } from './route';
import { social, socialProfile } from './social';
import { routes } from '.';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('social deep link route', () => {
  it('registers the Social feed and profile routes', () => {
    expect(routes.get('/social')).toBe(social);
    expect(routes.get('/social/profile')).toBe(socialProfile);
  });

  it('has the Social feed pathname', () => {
    expect(social.pathname).toBe('/social');
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    ['trending', 'https://link.metamask.io/social?tab=trending'],
    ['following', 'https://link.metamask.io/social?tab=following'],
    ['leaderboard', 'https://link.metamask.io/social?tab=leaderboard'],
    ['live-trades', 'https://link.metamask.io/social?tab=live-trades'],
  ])(
    'opens the default route with a QR deeplink for the %s tab',
    (_tab: string, expectedUrl: string) => {
      const destination = social.handler(
        new URLSearchParams(expectedUrl.split('?')[1]),
      );

      assertPathDestination(destination);
      expect(destination.path).toBe(DEFAULT_ROUTE);
      expect(destination.query.get(HomeQueryParams.SocialDeeplinkUrl)).toBe(
        expectedUrl,
      );
    },
  );

  it('preserves a missing tab so mobile can fall back to trending', () => {
    const destination = social.handler(new URLSearchParams());

    assertPathDestination(destination);
    expect(destination.path).toBe(DEFAULT_ROUTE);
    expect(destination.query.get(HomeQueryParams.SocialDeeplinkUrl)).toBe(
      'https://link.metamask.io/social',
    );
  });

  it('preserves an unknown tab instead of rewriting it', () => {
    const destination = social.handler(
      new URLSearchParams({ tab: 'not-a-tab' }),
    );

    assertPathDestination(destination);
    expect(destination.query.get(HomeQueryParams.SocialDeeplinkUrl)).toBe(
      'https://link.metamask.io/social?tab=not-a-tab',
    );
  });
});

describe('social profile deep link route', () => {
  it('has the Social profile pathname', () => {
    expect(socialProfile.pathname).toBe('/social/profile');
  });

  it('preserves traderId in the QR deeplink', () => {
    const destination = socialProfile.handler(
      new URLSearchParams({ traderId: 'trader-123' }),
    );

    assertPathDestination(destination);
    expect(destination.path).toBe(DEFAULT_ROUTE);
    expect(destination.query.get(HomeQueryParams.SocialDeeplinkUrl)).toBe(
      'https://link.metamask.io/social/profile?traderId=trader-123',
    );
  });

  it('encodes traderId values that need escaping', () => {
    const destination = socialProfile.handler(
      new URLSearchParams({ traderId: 'id/with spaces&symbols' }),
    );

    assertPathDestination(destination);
    expect(destination.query.get(HomeQueryParams.SocialDeeplinkUrl)).toBe(
      'https://link.metamask.io/social/profile?traderId=id%2Fwith+spaces%26symbols',
    );
  });
});
