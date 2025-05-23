import { selectIsSignedIn, selectSessionData } from './authentication';

describe('Authentication Selectors', () => {
  const mockState = {
    metamask: {
      isSignedIn: true,
      sessionData: {
        token: {
          accessToken: 'accessToken',
          expiresIn: 0,
          obtainedAt: 0,
        },
        profile: {
          identifierId: 'identifierId',
          profileId: 'profileId',
          metaMetricsId: 'metaMetricsId',
        },
      },
    },
  };

  it('should select the authentication status', () => {
    expect(selectIsSignedIn(mockState)).toBe(mockState.metamask.isSignedIn);
  });

  it('should select the session data', () => {
    expect(selectSessionData(mockState)).toEqual(
      mockState.metamask.sessionData,
    );
  });
});
