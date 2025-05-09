import { CHAIN_SPEC_URL } from '../../../shared/constants/network';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../shared/constants/time';
import { isOriginalNativeTokenSymbol } from './isOriginalNativeTokenSymbol';

jest.mock('../../../shared/lib/fetch-with-cache');

describe('isOriginalNativeTokenSymbol', () => {
  it('should return true when mapping in CHAIN_ID_TO_CURRENCY_SYMBOL_MAP matches the ticker', async () => {
    const chainId = '0x1';
    const ticker = 'ETH';

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(true);
  });

  it('should return false when mapping in CHAIN_ID_TO_CURRENCY_SYMBOL_MAP does not match the ticker', async () => {
    const chainId = '0x1';
    const ticker = 'BTC';

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(false);
  });

  it('should return true when ticker is found in the network collision map', async () => {
    const chainId = '0x15b38';
    const ticker = 'CHZ';

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(true);
  });

  it('should return false when ticker is not found in the network collision map', async () => {
    const chainId = '0x2';
    const ticker = 'NOT_FOUND';

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(false);
  });

  it('should return true when fetchWithCache returns a chain with a matching nativeCurrency symbol', async () => {
    const chainId = '0x3'; // hex for 3 in decimal
    const ticker = 'SOL';

    // Set up the fetchWithCache mock to return a chain with a matching symbol
    (fetchWithCache as jest.Mock).mockResolvedValue([
      { chainId: 3, nativeCurrency: { symbol: 'SOL' } },
    ]);

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    // Verify that fetchWithCache was called with the expected parameters:
    expect(fetchWithCache).toHaveBeenCalledWith({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getSafeChainsList',
    });
    expect(result).toBe(true);
  });

  it('should return false when fetchWithCache returns a chain with a non-matching nativeCurrency symbol', async () => {
    const chainId = '0x3';
    const ticker = 'NON_SOL';

    (fetchWithCache as jest.Mock).mockResolvedValue([
      { chainId: 3, nativeCurrency: { symbol: 'SOL' } },
    ]);

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(false);
  });

  it('should return false if an error occurs', async () => {
    const chainId = '0x4';
    const ticker = 'ANY';

    // Simulate an error thrown by fetchWithCache
    (fetchWithCache as jest.Mock).mockRejectedValue(new Error('Network Error'));

    const result = await isOriginalNativeTokenSymbol({ ticker, chainId });
    expect(result).toBe(false);
  });
});
