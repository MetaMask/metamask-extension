import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { fetchBridgeFeatureFlags } from './bridge.util';

jest.mock('../../../shared/lib/fetch-with-cache');

describe('Bridge utils', () => {
  it('should fetch bridge feature flags successfully', async () => {
    const mockResponse = {
      'extension-support': true,
    };

    (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchBridgeFeatureFlags();

    expect(fetchWithCache).toHaveBeenCalledWith({
      url: 'https://bridge.api.cx.metamask.io/getAllFeatureFlags',
      fetchOptions: {
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      },
      cacheOptions: { cacheRefreshTime: 600000 },
      functionName: 'fetchBridgeFeatureFlags',
    });

    expect(result).toEqual({ extensionSupport: true });
  });

  it('should use fallback bridge feature flags if response is unexpected', async () => {
    const mockResponse = {
      flag1: true,
      flag2: false,
    };

    (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchBridgeFeatureFlags();

    expect(fetchWithCache).toHaveBeenCalledWith({
      url: 'https://bridge.api.cx.metamask.io/getAllFeatureFlags',
      fetchOptions: {
        method: 'GET',
        headers: { 'X-Client-Id': 'extension' },
      },
      cacheOptions: { cacheRefreshTime: 600000 },
      functionName: 'fetchBridgeFeatureFlags',
    });

    expect(result).toEqual({ extensionSupport: false });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch');

    (fetchWithCache as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchBridgeFeatureFlags()).rejects.toThrowError(mockError);
  });
});
