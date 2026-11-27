// eslint-disable-next-line @typescript-eslint/no-shadow
import { it } from '@jest/globals';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import {
  getBrazeIdentityAction,
  getBrazeLanguage,
  getPrimaryCanonicalProfileId,
  isBrazeConfigured,
  type BrazeIdentityInputs,
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

  it('requires both API key and endpoint and stays disabled in test builds', () => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;
    expect(isBrazeConfigured()).toBe(true);

    process.env.IN_TEST = 'true';
    expect(isBrazeConfigured()).toBe(false);

    delete process.env.IN_TEST;
    delete process.env.BRAZE_SDK_ENDPOINT;
    expect(isBrazeConfigured()).toBe(false);
  });
});

describe('getPrimaryCanonicalProfileId', () => {
  it('selects the primary SRP session and returns undefined when locked or absent', () => {
    expect(
      getPrimaryCanonicalProfileId('primaryEntropySource', srpSessionData),
    ).toBe('primary-canonical');
    expect(
      getPrimaryCanonicalProfileId(undefined, srpSessionData),
    ).toBeUndefined();
    expect(
      getPrimaryCanonicalProfileId('otherEntropySource', srpSessionData),
    ).toBeUndefined();
  });
});

describe('getBrazeLanguage', () => {
  it.each([
    ['en', 'en'],
    ['pt_BR', 'pt'],
    ['hn', 'hi'],
    ['', undefined],
    ['xyz', undefined],
  ])('maps %s to %s', (locale, language) => {
    expect(getBrazeLanguage(locale)).toBe(language);
  });
});

describe('getBrazeIdentityAction', () => {
  const eligible: BrazeIdentityInputs = {
    completedOnboarding: true,
    useExternalServices: true,
    hasAnalyticsConsent: true,
    hasMarketingConsent: false,
    isUnlocked: true,
    canonicalProfileId: 'canonical-123',
    language: 'fr',
    isUiOpen: true,
  };

  it.each([
    [
      'MetaMetrics only',
      { hasAnalyticsConsent: true, hasMarketingConsent: false },
    ],
    [
      'marketing consent only',
      { hasAnalyticsConsent: false, hasMarketingConsent: true },
    ],
    ['both consents', { hasAnalyticsConsent: true, hasMarketingConsent: true }],
  ])('identifies when %s is enabled', (_, consentOverrides) => {
    expect(
      getBrazeIdentityAction({ ...eligible, ...consentOverrides }),
    ).toStrictEqual({
      type: 'identify',
      profileId: 'canonical-123',
      language: 'fr',
    });
  });

  it('identifies without a language when unknown', () => {
    expect(
      getBrazeIdentityAction({ ...eligible, language: undefined }),
    ).toStrictEqual({
      type: 'identify',
      profileId: 'canonical-123',
      language: undefined,
    });
  });

  it.each([
    ['onboarding is incomplete', { completedOnboarding: false }],
    ['Basic Functionality is off', { useExternalServices: false }],
    [
      'both consents are off',
      { hasAnalyticsConsent: false, hasMarketingConsent: false },
    ],
  ])('clears Braze when %s even with UI closed', (_, override) => {
    expect(
      getBrazeIdentityAction({ ...eligible, isUiOpen: false, ...override }),
    ).toStrictEqual({ type: 'clear' });
  });

  it.each([
    ['locked', { isUnlocked: false, canonicalProfileId: undefined }],
    ['profile ID is missing', { canonicalProfileId: undefined }],
    ['no UI document is open', { isUiOpen: false }],
  ])('keeps current identity when %s', (_, override) => {
    expect(getBrazeIdentityAction({ ...eligible, ...override })).toStrictEqual({
      type: 'keep',
    });
  });
});
