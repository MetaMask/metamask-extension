import { ENVIRONMENT } from '../../development/build/constants';
import { isGatorPermissionsViewEnabled, isProduction } from './environment';

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
  it('should return true when GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED is "true"', () => {
    process.env.GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED = 'true';
    expect(isGatorPermissionsViewEnabled()).toBe(true);
  });

  it('should return false when GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED is "false"', () => {
    process.env.GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED = 'false';
    expect(isGatorPermissionsViewEnabled()).toBe(false);
  });

  it('should return false when GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED is undefined', () => {
    delete process.env.GATOR_GRANTED_PERMISSIONS_VIEW_ENABLED;
    expect(isGatorPermissionsViewEnabled()).toBe(false);
  });
});
