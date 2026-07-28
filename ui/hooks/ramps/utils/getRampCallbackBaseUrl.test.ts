import { ENVIRONMENT } from '../../../../shared/constants/build';
import { getRampCallbackBaseUrl } from './getRampCallbackBaseUrl';

const PRODUCTION_CALLBACK =
  'https://on-ramp-content.api.cx.metamask.io/regions/fake-callback';
const STAGING_CALLBACK =
  'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';
const DEVELOPMENT_CALLBACK =
  'https://on-ramp.dev-api.cx.metamask.io/regions/fake-callback';

describe('getRampCallbackBaseUrl', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
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
    ENVIRONMENT.RELEASE_CANDIDATE,
    ENVIRONMENT.STAGING,
    ENVIRONMENT.TESTING,
  ]) {
    it(`returns the staging URL for the ${environment} environment`, () => {
      process.env.METAMASK_ENVIRONMENT = environment;
      expect(getRampCallbackBaseUrl()).toBe(STAGING_CALLBACK);
    });
  }

  it('returns the staging URL when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampCallbackBaseUrl()).toBe(STAGING_CALLBACK);
  });
});
