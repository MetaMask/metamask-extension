import { RampsEnvironment } from '@metamask/ramps-controller';

import { getRampsEnvironment } from './ramps-environment';

describe('getRampsEnvironment', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
  });

  it('returns Production for METAMASK_ENVIRONMENT=production', () => {
    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Production);
  });

  it('returns Production for METAMASK_ENVIRONMENT=beta', () => {
    process.env.METAMASK_ENVIRONMENT = 'beta';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Production);
  });

  it('returns Production for METAMASK_ENVIRONMENT=rc', () => {
    process.env.METAMASK_ENVIRONMENT = 'rc';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Production);
  });

  it('returns Development for METAMASK_ENVIRONMENT=development', () => {
    process.env.METAMASK_ENVIRONMENT = 'development';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Development);
  });

  it('returns Staging for METAMASK_ENVIRONMENT=dev', () => {
    process.env.METAMASK_ENVIRONMENT = 'dev';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });

  it('returns Staging for METAMASK_ENVIRONMENT=test', () => {
    process.env.METAMASK_ENVIRONMENT = 'test';
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });

  it('returns Staging when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });
});
