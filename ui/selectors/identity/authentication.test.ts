import {
  selectIsSignedIn,
  selectNeedsProfilePairing,
  selectNeedsSocialPairing,
  selectSessionData,
} from './authentication';

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
            canonicalProfileId: 'profileId',
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
            canonicalProfileId: 'profileId2',
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

  it('selectNeedsProfilePairing returns the persisted value when present', () => {
    expect(
      selectNeedsProfilePairing({
        metamask: { ...mockState.metamask, needsProfilePairing: false },
      }),
    ).toBe(false);
  });

  it('selectNeedsProfilePairing defaults to true when the field is absent', () => {
    expect(selectNeedsProfilePairing(mockState)).toBe(true);
  });

  it('selectNeedsSocialPairing returns the persisted value when present', () => {
    expect(
      selectNeedsSocialPairing({
        metamask: { ...mockState.metamask, needsSocialPairing: false },
      }),
    ).toBe(false);
  });

  it('selectNeedsSocialPairing defaults to true when the field is absent', () => {
    expect(selectNeedsSocialPairing(mockState)).toBe(true);
  });
});
