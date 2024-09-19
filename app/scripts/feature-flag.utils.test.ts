import {
  buildApiUrlAllFeatureFlags,
  buildApiUrlSingleFeatureFlag,
  getAllFeatureFlags,
  getSingleFeatureFlag,
  validateBuildType,
  validateEnvironment,
} from './feature-flag.utils';

describe('feature-flag.utils', () => {
  const mockBaseUrl = 'test';
  const mockVersion = 'v1';

  describe('buildApiUrlAllFeatureFlags', () => {
    it('builds the correct URL with default parameters', () => {
      const url = buildApiUrlAllFeatureFlags(mockBaseUrl);
      console.log(url, mockBaseUrl);
      expect(url).toBe(
        `${mockBaseUrl}/${mockVersion}/flags?client=extension&distribution=main&environment=prod`,
      );
    });

    it('builds the correct URL with custom parameters', () => {
      const url = buildApiUrlAllFeatureFlags(
        mockBaseUrl,
        'flask',
        'development',
      );
      expect(url).toBe(
        `${mockBaseUrl}/${mockVersion}/flags?client=extension&distribution=flask&environment=dev`,
      );
    });
  });

  describe('buildApiUrlSingleFeatureFlag', () => {
    it('builds the correct URL with default parameters', () => {
      const url = buildApiUrlSingleFeatureFlag(mockBaseUrl, 'testFlag');
      expect(url).toBe(
        `${mockBaseUrl}/${mockVersion}/flags/testFlag?client=extension&distribution=main&environment=prod`,
      );
    });

    it('builds the correct URL with custom parameters', () => {
      const url = buildApiUrlSingleFeatureFlag(
        mockBaseUrl,
        'testFlag',
        'flask',
        'development',
      );
      expect(url).toBe(
        `${mockBaseUrl}/${mockVersion}/flags/testFlag?client=extension&distribution=flask&environment=dev`,
      );
    });
  });

  describe('getAllFeatureFlags', () => {
    it('fetches all feature flags successfully', async () => {
      const mockResponse = [{ flag1: true }, { flag2: false }];
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const flags = await getAllFeatureFlags(mockBaseUrl, 'main', 'prod');
      expect(flags).toEqual({ flag1: true, flag2: false });
    });

    it('handles fetch error gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch error'));

      const flags = await getAllFeatureFlags(mockBaseUrl, 'main', 'prod');
      expect(flags).toEqual({});
    });
  });

  describe('getSingleFeatureFlag', () => {
    it('fetches a single feature flag successfully', async () => {
      const mockResponse = { flag1: true };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const flag = await getSingleFeatureFlag(
        mockBaseUrl,
        'flag1',
        'main',
        'prod',
      );
      expect(flag).toEqual(mockResponse);
    });

    it('handles fetch error gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch error'));

      const flag = await getSingleFeatureFlag(
        mockBaseUrl,
        'flag1',
        'main',
        'prod',
      );
      expect(flag).toEqual({});
    });
  });
  describe('validateEnvironment', () => {
    it('returns the correct environment for valid input', () => {
      expect(validateEnvironment('prod')).toBe('prod');
      expect(validateEnvironment('development')).toBe('dev');
    });

    it('returns default environment for invalid input', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(validateEnvironment('invalid')).toBe('prod');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid METAMASK_ENVIRONMENT value: invalid. Must be one of prod, development. Using default value: prod.',
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('validateBuildType', () => {
    it('returns the correct build type for valid input', () => {
      expect(validateBuildType('main')).toBe('main');
      expect(validateBuildType('flask')).toBe('flask');
      expect(validateBuildType('qa')).toBe('qa');
    });

    it('returns default build type for invalid input', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(validateBuildType('invalid')).toBe('main');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid METAMASK_BUILD_TYPE value: invalid. Must be one of main, flask, qa. Using default value: main.',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
