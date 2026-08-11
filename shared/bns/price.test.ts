import {
  clearBrnkcPriceCache,
  getBrnkcUsdPrice,
} from './price';
import type { BrnkcPriceResult } from './price';

const MOCK_ORACLE = '0xA3e9Dc4Fd7032Db1F4e8C8e776B3a7f23a65a85E';
const MOCK_PRICE_HEX = '00000000000000000000000000000000000000000000000000000000000000aa';
const MOCK_TS_HEX = '00000000000000000000000000000000000000000000000000000000000000e4';

const MOCK_CONFIG = {
  registryAddress: '0x0000000000000000000000000000000000000001',
  gatewayHost: 'ipfs.bearnetwork.net',
  rpcUrls: [
    'https://brnkc-mainnet.bearnetwork.net',
    'https://brnkc-mainnet1.bearnetwork.net',
    'https://bnes-mainnet.bearnetwork.net',
  ],
  timeoutMs: 10000,
  oracleAddress: MOCK_ORACLE,
} as const;

describe('shared/bns price', () => {
  beforeEach(() => {
    clearBrnkcPriceCache();
  });

  it('rejects when oracle address is not configured', async () => {
    await expect(
      getBrnkcUsdPrice({
        ...MOCK_CONFIG,
        oracleAddress: undefined,
      }),
    ).rejects.toThrow('BNS oracle address is not configured');
  });

  it('rejects when oracle address is zero', async () => {
    await expect(
      getBrnkcUsdPrice({
        ...MOCK_CONFIG,
        oracleAddress: '0x0000000000000000000000000000000000000000',
      }),
    ).rejects.toThrow('BNS oracle address is not configured');
  });

  it('queries oracle and caches result', async () => {
    const ethCall = jest.fn().mockResolvedValue(
      `0x${MOCK_PRICE_HEX}${MOCK_TS_HEX}`,
    );

    const result = await getBrnkcUsdPrice(MOCK_CONFIG, ethCall);

    expect(ethCall).toHaveBeenCalledTimes(1);
    expect(ethCall).toHaveBeenCalledWith({
      to: MOCK_ORACLE,
      data: expect.stringContaining('ac41865a'),
    });
    expect(result.priceWei).toBe(0xaan);
    expect(result.timestamp).toBe(0xe4);
    expect(result.cacheAgeMs).toBe(0);
  });

  it('returns cached result within TTL', async () => {
    const ethCall = jest.fn().mockResolvedValue(
      `0x${MOCK_PRICE_HEX}${MOCK_TS_HEX}`,
    );

    const first = await getBrnkcUsdPrice(MOCK_CONFIG, ethCall);
    const second = await getBrnkcUsdPrice(MOCK_CONFIG, ethCall);

    expect(ethCall).toHaveBeenCalledTimes(1);
    expect(second.priceWei).toBe(first.priceWei);
    expect(second.cacheAgeMs).toBeGreaterThanOrEqual(0);
  });

  it('re-queries after cache TTL expires', async () => {
    const secondPriceHex = '00000000000000000000000000000000000000000000000000000000000000bb';
    const secondTsHex = '00000000000000000000000000000000000000000000000000000000000000f0';
    const ethCall = jest
      .fn()
      .mockResolvedValueOnce(`0x${MOCK_PRICE_HEX}${MOCK_TS_HEX}`)
      .mockResolvedValueOnce(`0x${secondPriceHex}${secondTsHex}`);

    await getBrnkcUsdPrice(MOCK_CONFIG, ethCall);

    // Fast-forward past TTL
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 5 * 60 * 1000 + 1000);

    const second = await getBrnkcUsdPrice(MOCK_CONFIG, ethCall);

    expect(ethCall).toHaveBeenCalledTimes(2);
    expect(second.priceWei).toBe(0xbbn);

    Date.now = originalNow;
  });

  it('rejects zero price from oracle', async () => {
    const ethCall = jest.fn().mockResolvedValue(
      `0x${'00'.repeat(32)}${'00'.repeat(32)}`,
    );

    await expect(getBrnkcUsdPrice(MOCK_CONFIG, ethCall)).rejects.toThrow(
      'BNESOracle returned zero price',
    );
  });

  it('rejects malformed decode', async () => {
    const ethCall = jest.fn().mockResolvedValue('0x');

    await expect(getBrnkcUsdPrice(MOCK_CONFIG, ethCall)).rejects.toThrow(
      'Failed to decode BNESOracle getPrice result',
    );
  });
});
