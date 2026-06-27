import { RampsEnvironment } from '@metamask/ramps-controller';

import { getRampsEnvironment } from './ramps-environment';

describe('getRampsEnvironment', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
  });

  it.each(['production', 'beta', 'rc'])(
    'returns Production for METAMASK_ENVIRONMENT=%s',
    (env) => {
      process.env.METAMASK_ENVIRONMENT = env;
      expect(getRampsEnvironment()).toBe(RampsEnvironment.Production);
    },
  );

  it.each(['dev', 'test'])(
    'returns Staging for METAMASK_ENVIRONMENT=%s',
    (env) => {
      process.env.METAMASK_ENVIRONMENT = env;
      expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
    },
  );

  it('returns Staging when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });
});
