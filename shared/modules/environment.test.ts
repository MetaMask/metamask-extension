import { ENVIRONMENT } from '../../development/build/constants';
import {
  getEnabledAdvancedPermissions,
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

describe('getEnabledAdvancedPermissions', () => {
  let originalGatorEnabledPermissionTypes: string | undefined;

  beforeAll(() => {
    originalGatorEnabledPermissionTypes =
      process.env.GATOR_ENABLED_PERMISSION_TYPES;
  });

  afterAll(() => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      originalGatorEnabledPermissionTypes;
  });

  it('should return an empty array when GATOR_ENABLED_PERMISSION_TYPES is not set', () => {
    delete process.env.GATOR_ENABLED_PERMISSION_TYPES;
    expect(getEnabledAdvancedPermissions()).toStrictEqual([]);
  });

  it('should return an empty array when GATOR_ENABLED_PERMISSION_TYPES is an empty string', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = '';
    expect(getEnabledAdvancedPermissions()).toStrictEqual([]);
  });

  it('should parse comma-separated values correctly', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,native-token-periodic,erc20-token-stream';
    expect(getEnabledAdvancedPermissions()).toStrictEqual([
      'native-token-stream',
      'native-token-periodic',
      'erc20-token-stream',
    ]);
  });

  it('should filter out empty strings from the result', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,,erc20-token-stream';
    expect(getEnabledAdvancedPermissions()).toStrictEqual([
      'native-token-stream',
      'erc20-token-stream',
    ]);
  });

  it('should handle a single permission type', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = 'native-token-stream';
    expect(getEnabledAdvancedPermissions()).toStrictEqual([
      'native-token-stream',
    ]);
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
