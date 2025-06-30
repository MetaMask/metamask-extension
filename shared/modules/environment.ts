import { ENVIRONMENT } from '../../development/build/constants';

export const isProduction = (): boolean => {
  return (
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING
  );
};

export const getIsDevOrTestEnv = (): boolean => {
  return (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING ||
    process.env.METAMASK_ENVIRONMENT === 'test'
  );
};

export const getIsSeedlessOnboardingFeatureEnabled = (): boolean => {
  return process.env.SEEDLESS_ONBOARDING_ENABLED?.toString() === 'true';
};
