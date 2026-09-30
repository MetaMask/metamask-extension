import { ENVIRONMENT } from '../../constants/build';
import { devApiEnv } from './dev-api-env';

const environmentKeys = ['METAMASK_ENVIRONMENT', 'MM_DEV_API_ENV'] as const;

describe('devApiEnv', () => {
  const originalEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    environmentKeys.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    environmentKeys.forEach((key) => {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('resolves dev only for development builds that opt in', () => {
    const unset = devApiEnv();

    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    const developmentWithoutFlag = devApiEnv();

    process.env.MM_DEV_API_ENV = 'dev';
    const developmentOptedIn = devApiEnv();

    process.env.MM_DEV_API_ENV = 'DEV';
    const developmentOptedInUppercase = devApiEnv();

    process.env.MM_DEV_API_ENV = 'nonsense';
    const developmentUnrecognized = devApiEnv();

    process.env.MM_DEV_API_ENV = 'dev';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    const testingOptedIn = devApiEnv();

    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    const productionOptedIn = devApiEnv();

    expect({
      unset,
      developmentWithoutFlag,
      developmentOptedIn,
      developmentOptedInUppercase,
      developmentUnrecognized,
      testingOptedIn,
      productionOptedIn,
    }).toMatchInlineSnapshot(`
      {
        "developmentOptedIn": "dev",
        "developmentOptedInUppercase": "dev",
        "developmentUnrecognized": "prod",
        "developmentWithoutFlag": "prod",
        "productionOptedIn": "prod",
        "testingOptedIn": "prod",
        "unset": "prod",
      }
    `);
  });
});
