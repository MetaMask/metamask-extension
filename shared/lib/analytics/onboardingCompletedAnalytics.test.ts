/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment-shaped assertions match analytics schema */
import {
  getOnboardingCompletedAnalyticsProps,
  ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION,
  ONBOARDING_TYPE_SEED_PHRASE,
  ONBOARDING_TYPE_SOCIAL_LOGIN,
} from './onboardingCompletedAnalytics';

const walletSetupCompletedProps = {
  wallet_setup_type: 'new' as const,
  new_wallet: true,
  account_type: 'metamask',
  utm_source: 'newsletter',
};

describe('getOnboardingCompletedAnalyticsProps', () => {
  it('returns wallet setup completed props with extension implementation and seed_phrase onboarding type', () => {
    expect(
      getOnboardingCompletedAnalyticsProps(walletSetupCompletedProps, false),
    ).toStrictEqual({
      ...walletSetupCompletedProps,
      implementation_type: ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION,
      onboarding_type: ONBOARDING_TYPE_SEED_PHRASE,
    });
  });

  it('returns wallet setup completed props with extension implementation and social_login onboarding type', () => {
    expect(
      getOnboardingCompletedAnalyticsProps(walletSetupCompletedProps, true),
    ).toStrictEqual({
      ...walletSetupCompletedProps,
      implementation_type: ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION,
      onboarding_type: ONBOARDING_TYPE_SOCIAL_LOGIN,
    });
  });
});
