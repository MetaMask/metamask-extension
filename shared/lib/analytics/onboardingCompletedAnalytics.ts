export const ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION = 'extension' as const;

export const ONBOARDING_TYPE_SEED_PHRASE = 'seed_phrase' as const;
export const ONBOARDING_TYPE_SOCIAL_LOGIN = 'social_login' as const;

export type OnboardingType =
  | typeof ONBOARDING_TYPE_SEED_PHRASE
  | typeof ONBOARDING_TYPE_SOCIAL_LOGIN;

export interface WalletSetupCompletedAnalyticsProps {
  wallet_setup_type: 'new' | 'import';
  new_wallet: boolean;
  account_type: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  attribution_id?: string;
}

export type OnboardingCompletedAnalyticsProps =
  WalletSetupCompletedAnalyticsProps & {
    implementation_type: typeof ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION;
    onboarding_type: OnboardingType;
  };

export function getOnboardingCompletedAnalyticsProps(
  walletSetupCompletedProps: WalletSetupCompletedAnalyticsProps,
  isSocialLogin: boolean,
): OnboardingCompletedAnalyticsProps {
  return {
    ...walletSetupCompletedProps,
    implementation_type: ONBOARDING_IMPLEMENTATION_TYPE_EXTENSION,
    onboarding_type: isSocialLogin
      ? ONBOARDING_TYPE_SOCIAL_LOGIN
      : ONBOARDING_TYPE_SEED_PHRASE,
  };
}
