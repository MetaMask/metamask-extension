import { selectIsSignedIn, selectSessionData } from './authentication';

describe('Authentication Selectors', () => {
  const mockState = {
    metamask: {
      isSignedIn: true,
      srpSessionData: {
        entropySourceId1: {
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
        entropySourceId2: {
          token: {
            accessToken: 'accessToken2',
            expiresIn: 0,
            obtainedAt: 0,
          },
          profile: {
            identifierId: 'identifierId2',
            profileId: 'profileId2',
            metaMetricsId: 'metaMetricsId2',
          },
        },
      },
    },
  };

  it('should select the authentication status', () => {
    expect(selectIsSignedIn(mockState)).toBe(mockState.metamask.isSignedIn);
  });

  it('should select the session data', () => {
    expect(selectSessionData(mockState)).toEqual(
      mockState.metamask.srpSessionData.entropySourceId1,
    );
  });
});
