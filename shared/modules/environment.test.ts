import { ENVIRONMENT } from '../../development/build/constants';
import {
  isGatorPermissionsFeatureEnabled,
  isProduction,
  isGatorPermissionsRevocationFeatureEnabled,
} from './environment';

describe('isProduction', () => {
  let originalMetaMaskEnvironment: string | undefined;

  beforeAll(() => {
    originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  });

  afterAll(() => {
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
  });

  it('should return true when ENVIRONMENT is "production"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(isProduction()).toBe(true);
  });

  it('should return false when ENVIRONMENT is "development"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    expect(isProduction()).toBe(false);
  });

  it('should return false when ENVIRONMENT is "testing"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    expect(isProduction()).toBe(false);
  });
});

describe('isGatorPermissionsFeatureEnabled', () => {
  it('should return true when GATOR_PERMISSIONS_ENABLED is "true"', () => {
    process.env.GATOR_PERMISSIONS_ENABLED = 'true';
    expect(isGatorPermissionsFeatureEnabled()).toBe(true);
  });

  it('should return false when GATOR_PERMISSIONS_ENABLED is "false"', () => {
    process.env.GATOR_PERMISSIONS_ENABLED = 'false';
    expect(isGatorPermissionsFeatureEnabled()).toBe(false);
  });

  it('should return false when GATOR_PERMISSIONS_ENABLED is undefined', () => {
    delete process.env.GATOR_PERMISSIONS_ENABLED;
    expect(isGatorPermissionsFeatureEnabled()).toBe(false);
  });
});

describe('isGatorPermissionsRevocationFeatureEnabled', () => {
  it('should return true when GATOR_PERMISSIONS_REVOCATION_ENABLED is "true"', () => {
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED = 'true';
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(true);
  });

  it('should return false when GATOR_PERMISSIONS_REVOCATION_ENABLED is "false"', () => {
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED = 'false';
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(false);
  });

  it('should return false when GATOR_PERMISSIONS_REVOCATION_ENABLED is undefined', () => {
    delete process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED;
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(false);
  });
});
