import {
  getBackendApiUrlsOption,
  isBackendAuthDisabled,
} from './core-backend-api-urls';

const environmentKeys = [
  'MM_BACKEND_ACCOUNTS_API_URL',
  'MM_BACKEND_PRICES_API_URL',
  'MM_BACKEND_TOKEN_API_URL',
  'MM_BACKEND_TOKENS_API_URL',
  'MM_BACKEND_DISABLE_AUTH',
] as const;

describe('core-backend-api-urls', () => {
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

  describe('getBackendApiUrlsOption', () => {
    it('returns an empty object when no URL overrides are set', () => {
      expect(getBackendApiUrlsOption()).toStrictEqual({});
    });

    it('returns apiUrls for each override that is set', () => {
      process.env.MM_BACKEND_ACCOUNTS_API_URL = 'https://accounts.example';
      process.env.MM_BACKEND_PRICES_API_URL = 'https://prices.example';

      expect(getBackendApiUrlsOption()).toStrictEqual({
        apiUrls: {
          ACCOUNTS: 'https://accounts.example',
          PRICES: 'https://prices.example',
        },
      });
    });
  });

  describe('isBackendAuthDisabled', () => {
    it('returns false when the env var is unset', () => {
      expect(isBackendAuthDisabled()).toBe(false);
    });

    it('returns true when the env var is "true"', () => {
      process.env.MM_BACKEND_DISABLE_AUTH = 'true';

      expect(isBackendAuthDisabled()).toBe(true);
    });
  });
});
