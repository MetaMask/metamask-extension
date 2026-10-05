import { Env as SubscriptionEnv } from '@metamask/subscription-controller';
import { ENVIRONMENT } from '../../constants/build';
import { loadShieldConfig } from './config';

function restore(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe('loadShieldConfig', () => {
  const originalEnvironment = process.env.METAMASK_ENVIRONMENT;
  const originalDevApiEnv = process.env.MM_DEV_API_ENV;
  const originalBuildType = process.env.METAMASK_BUILD_TYPE;

  afterEach(() => {
    restore('METAMASK_ENVIRONMENT', originalEnvironment);
    restore('MM_DEV_API_ENV', originalDevApiEnv);
    restore('METAMASK_BUILD_TYPE', originalBuildType);
  });

  it('uses the production subscription host by default', () => {
    delete process.env.MM_DEV_API_ENV;
    process.env.METAMASK_BUILD_TYPE = 'main';

    expect(loadShieldConfig().subscriptionEnv).toBe(SubscriptionEnv.PRD);
  });

  it('uses the dev subscription host when the dev identity env is selected', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    process.env.MM_DEV_API_ENV = 'dev';
    process.env.METAMASK_BUILD_TYPE = 'main';

    expect(loadShieldConfig().subscriptionEnv).toBe(SubscriptionEnv.DEV);
  });
});
