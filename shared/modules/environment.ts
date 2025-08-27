import { ENVIRONMENT } from '../../development/build/constants';

export const isProduction = (): boolean => {
  return (
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING
  );
};

export const getIsSeedlessOnboardingFeatureEnabled = (): boolean => {
  return process.env.SEEDLESS_ONBOARDING_ENABLED?.toString() === 'true';
};

/**
 * Returns true if the gator permissions feature is enabled
 *
 * @returns true if the gator permissions feature is enabled, false otherwise
 */
export const isGatorPermissionsFeatureEnabled = (): boolean => {
  return process.env.GATOR_PERMISSIONS_ENABLED?.toString() === 'true';
};
