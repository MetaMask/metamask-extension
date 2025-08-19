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

export const getIsEip7715ReadablePermissionsFeatureEnabled = (): boolean => {
  return (
    process.env.EIP_7715_READABLE_PERMISSIONS_ENABLED?.toString() === 'true' &&
    Boolean(process.env.PERMISSIONS_KERNEL_SNAP_ID)
  );
};
