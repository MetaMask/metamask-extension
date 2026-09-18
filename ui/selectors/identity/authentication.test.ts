import { KeyringTypes } from '@metamask/keyring-controller';
import {
  selectCanonicalProfileId,
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

  it('selectCanonicalProfileId returns the canonical id for the primary HD keyring', () => {
    expect(
      selectCanonicalProfileId({
        metamask: {
          ...mockState.metamask,
          keyrings: [
            {
              type: KeyringTypes.hd,
              metadata: { id: 'entropySourceId1' },
            },
          ],
        },
      }),
    ).toBe('profileId');
  });

  it('selectCanonicalProfileId returns the primary SRP session when a stale first entry remains', () => {
    expect(
      selectCanonicalProfileId({
        metamask: {
          ...mockState.metamask,
          keyrings: [
            {
              type: KeyringTypes.hd,
              metadata: { id: 'entropySourceId2' },
            },
          ],
        },
      }),
    ).toBe('profileId2');
  });

  it('selectCanonicalProfileId returns undefined when there is no session for the primary SRP', () => {
    expect(selectCanonicalProfileId(mockState)).toBeUndefined();
  });
});
