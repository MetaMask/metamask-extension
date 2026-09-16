import { getDefaultRedirectCallbackUrl } from '@metamask/ramps-controller';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { getRampsEnvironment } from '../../../../shared/lib/ramps/environment';
import { getRampCallbackBaseUrl } from './getRampCallbackBaseUrl';

const PRODUCTION_CALLBACK =
  'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback';
const STAGING_CALLBACK =
  'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';
const DEVELOPMENT_CALLBACK =
  'https://on-ramp.dev-api.cx.metamask.io/regions/fake-callback';

describe('getRampCallbackBaseUrl', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;
  const originalBuildType = process.env.METAMASK_BUILD_TYPE;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
    process.env.METAMASK_BUILD_TYPE = originalBuildType;
  });

  it('returns the production URL for the production environment', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(getRampCallbackBaseUrl()).toBe(PRODUCTION_CALLBACK);
  });

  // `on-ramp-content.dev-api.cx.metamask.io` does not exist — pointing
  // development at it made providers redirect to a DNS failure page.
  it('returns the ramps dev API URL for the development environment', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    expect(getRampCallbackBaseUrl()).toBe(DEVELOPMENT_CALLBACK);
  });

  for (const environment of [
    ENVIRONMENT.OTHER,
    ENVIRONMENT.PULL_REQUEST,
    ENVIRONMENT.TESTING,
  ]) {
    it(`returns the staging URL for the ${environment} environment`, () => {
      process.env.METAMASK_ENVIRONMENT = environment;
      expect(getRampCallbackBaseUrl()).toBe(STAGING_CALLBACK);
    });
  }

  it('returns the production URL for a main staging build', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;
    process.env.METAMASK_BUILD_TYPE = 'main';

    expect(getRampCallbackBaseUrl()).toBe(PRODUCTION_CALLBACK);
  });

  it('returns the staging URL for an experimental staging build', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;
    process.env.METAMASK_BUILD_TYPE = 'experimental';

    expect(getRampCallbackBaseUrl()).toBe(STAGING_CALLBACK);
  });

  it('returns the production URL for a release-candidate build', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;
    process.env.METAMASK_BUILD_TYPE = 'main';

    expect(getRampCallbackBaseUrl()).toBe(PRODUCTION_CALLBACK);
  });

  it('returns the staging URL when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampCallbackBaseUrl()).toBe(STAGING_CALLBACK);
  });

  // The callback host map lives in `@metamask/ramps-controller`; this locks the
  // shared helper to core's derivation so the two cannot drift apart.
  it('delegates to core getDefaultRedirectCallbackUrl for the resolved environment', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(getRampCallbackBaseUrl()).toBe(
      getDefaultRedirectCallbackUrl(getRampsEnvironment()),
    );
  });
});
