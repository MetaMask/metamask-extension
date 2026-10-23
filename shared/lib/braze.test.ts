// eslint-disable-next-line @typescript-eslint/no-shadow
import { it } from '@jest/globals';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import {
  getDesiredBrazeUser,
  getPrimaryCanonicalProfileId,
  isBrazeConfigured,
  type BrazeUserInputs,
} from './braze';

const buildSession = (canonicalProfileId: string) => ({
  token: { accessToken: 'token', expiresIn: 0, obtainedAt: 0 },
  profile: {
    identifierId: 'identifierId',
    profileId: 'profileId',
    canonicalProfileId,
    metaMetricsId: 'metaMetricsId',
  },
});

const srpSessionData = {
  staleEntropySource: buildSession('stale-canonical'),
  primaryEntropySource: buildSession('primary-canonical'),
} as unknown as AuthenticationControllerState['srpSessionData'];

describe('isBrazeConfigured', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('requires both the API key and endpoint', () => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;

    expect(isBrazeConfigured()).toBe(true);

    delete process.env.BRAZE_SDK_ENDPOINT;
    expect(isBrazeConfigured()).toBe(false);
  });

  it('returns false in test builds', () => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
      IN_TEST: 'true',
    };

    expect(isBrazeConfigured()).toBe(false);
  });
});

describe('getPrimaryCanonicalProfileId', () => {
  it('returns the primary SRP session, not the first session entry', () => {
    expect(
      getPrimaryCanonicalProfileId('primaryEntropySource', srpSessionData),
    ).toBe('primary-canonical');
  });

  it('returns undefined without a primary keyring (locked wallet)', () => {
    expect(
      getPrimaryCanonicalProfileId(undefined, srpSessionData),
    ).toBeUndefined();
  });

  it('returns undefined without a session for the primary SRP', () => {
    expect(
      getPrimaryCanonicalProfileId('otherEntropySource', srpSessionData),
    ).toBeUndefined();
  });
});

describe('getDesiredBrazeUser', () => {
  const eligible: BrazeUserInputs = {
    completedOnboarding: true,
    useExternalServices: true,
    isSignedIn: true,
    isUnlocked: true,
    canonicalProfileId: 'canonical-123',
  };

  it('returns the canonical profile ID when every gate passes', () => {
    expect(getDesiredBrazeUser(eligible)).toBe('canonical-123');
  });

  it.each([
    ['onboarding is incomplete', { completedOnboarding: false }],
    ['Basic Functionality is off', { useExternalServices: false }],
    ['the user is signed out', { isSignedIn: false }],
  ])('clears the user when %s', (_, override) => {
    expect(getDesiredBrazeUser({ ...eligible, ...override })).toBeNull();
  });

  it('clears the user when signed out, even while locked', () => {
    expect(
      getDesiredBrazeUser({
        ...eligible,
        isSignedIn: false,
        isUnlocked: false,
        canonicalProfileId: undefined,
      }),
    ).toBeNull();
  });

  it.each([
    ['the wallet is locked', { isUnlocked: false }],
    ['the profile ID is not available yet', { canonicalProfileId: undefined }],
  ])('keeps the current user when %s', (_, override) => {
    expect(getDesiredBrazeUser({ ...eligible, ...override })).toBeUndefined();
  });
});
