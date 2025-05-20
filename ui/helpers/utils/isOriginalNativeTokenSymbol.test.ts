import { Hex } from '@metamask/utils';
import { CHAIN_SPEC_URL } from '../../../shared/constants/network';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../shared/constants/time';
import {
  getOriginalNativeTokenSymbol,
  isOriginalNativeTokenSymbol,
} from './isOriginalNativeTokenSymbol';

jest.mock('../../../shared/lib/fetch-with-cache');
const mockFetchWithCache = jest.mocked(fetchWithCache);

describe('getOriginalNativeTokenSymbol', () => {
  const arrangeParams = () => ({
    chainId: '0x1' as Hex,
    useAPICall: true,
  });

  it('should return original ticker from CHAIN_ID_TO_CURRENCY_SYMBOL_MAP', async () => {
    const params = arrangeParams();
    const result = await getOriginalNativeTokenSymbol(params);
    expect(result).toBe('ETH');
  });

  it('should result original ticker from CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION', async () => {
    const params = arrangeParams();
    params.chainId = '0x15b38';
    const result = await getOriginalNativeTokenSymbol(params);
    expect(result).toBe('CHZ');
  });

  it('should return null when API cannot be used (e.g. basic functionality)', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    params.useAPICall = false;
    const result = await getOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return ticker from API call', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    mockFetchWithCache.mockResolvedValue([
      { chainId: 3, nativeCurrency: { symbol: 'SOL' } },
    ]);

    const result = await getOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).toHaveBeenCalled();
    expect(result).toBe('SOL');
  });

  it('should not return ticker if API fails', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    mockFetchWithCache.mockRejectedValue(new Error('Network Error'));

    const result = await getOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

describe('isOriginalNativeTokenSymbol', () => {
  const arrangeParams = () => ({
    ticker: 'ETH',
    chainId: '0x1' as Hex,
    useAPICall: true,
  });
  it('should return true when mapping in CHAIN_ID_TO_CURRENCY_SYMBOL_MAP matches the ticker', async () => {
    const params = arrangeParams();

    const result = await isOriginalNativeTokenSymbol(params);
    expect(result).toBe(true);
  });

  it('should return false when mapping in CHAIN_ID_TO_CURRENCY_SYMBOL_MAP does not match the ticker', async () => {
    const params = arrangeParams();
    params.ticker = 'BTC';

    const result = await isOriginalNativeTokenSymbol(params);
    expect(result).toBe(false);
  });

  it('should return true when ticker is found in the network collision map', async () => {
    const params = arrangeParams();
    params.chainId = '0x15b38';
    params.ticker = 'CHZ';

    const result = await isOriginalNativeTokenSymbol(params);
    expect(result).toBe(true);
  });

  it('should return false when ticker does not match the network collision map', async () => {
    const params = arrangeParams();
    params.chainId = '0x15b38';
    params.ticker = 'NOT_FOUND';

    const result = await isOriginalNativeTokenSymbol(params);
    expect(result).toBe(false);
  });

  it('should return true when fetchWithCache returns a chain with a matching nativeCurrency symbol', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    params.ticker = 'SOL';

    // Set up the fetchWithCache mock to return a chain with a matching symbol
    mockFetchWithCache.mockResolvedValue([
      { chainId: 3, nativeCurrency: { symbol: 'SOL' } },
    ]);

    const result = await isOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).toHaveBeenCalledWith({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getSafeChainsList',
    });
    expect(result).toBe(true);
  });

  it('should return false when fetchWithCache returns a chain with a non-matching nativeCurrency symbol', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    params.ticker = 'NON_SOL';

    mockFetchWithCache.mockResolvedValue([
      { chainId: 3, nativeCurrency: { symbol: 'SOL' } },
    ]);

    const result = await isOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).toHaveBeenCalledWith({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getSafeChainsList',
    });
    expect(result).toBe(false);
  });

  it('should return true if fails to get original ticker symbol from API error', async () => {
    const params = arrangeParams();
    params.chainId = '0x3';
    params.ticker = 'SOL';

    // Simulate an error thrown by fetchWithCache
    mockFetchWithCache.mockRejectedValue(new Error('Network Error'));

    const result = await isOriginalNativeTokenSymbol(params);
    expect(mockFetchWithCache).toHaveBeenCalledWith({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getSafeChainsList',
    });
    expect(result).toBe(true);
  });
});
