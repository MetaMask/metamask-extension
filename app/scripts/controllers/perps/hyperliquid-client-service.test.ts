import { HyperLiquidClientService } from '../../../../node_modules/@metamask/perps-controller/dist/services/HyperLiquidClientService.cjs';

jest.mock('@nktkas/hyperliquid', () => ({
  ExchangeClient: jest.fn(),
  InfoClient: jest.fn(),
  SubscriptionClient: jest.fn(),
}));

describe('HyperLiquidClientService.fetchHistoricalCandles', () => {
  function createService() {
    return new HyperLiquidClientService({
      logger: { error: jest.fn() },
      debugLogger: { log: jest.fn() },
    });
  }

  it('uses the HTTP info client for candle snapshots', async () => {
    const service = createService();
    const candleSnapshot = jest.fn().mockResolvedValue([]);

    jest
      .spyOn(service, 'ensureInitialized')
      .mockImplementation(() => undefined);
    const getInfoClient = jest
      .spyOn(service, 'getInfoClient')
      .mockReturnValue({ candleSnapshot });

    await service.fetchHistoricalCandles({
      symbol: 'BTC',
      interval: '1h',
      limit: 10,
    });

    expect(getInfoClient).toHaveBeenCalledWith({ useHttp: true });
    expect(candleSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        coin: 'BTC',
        interval: '1h',
      }),
      undefined,
    );
  });

  it('transforms snapshot candles into controller candle data', async () => {
    const service = createService();
    const candleSnapshot = jest
      .fn()
      .mockResolvedValue([
        { t: 1700000000000, o: 1, h: 2, l: 0.5, c: 1.5, v: 42 },
      ]);

    jest
      .spyOn(service, 'ensureInitialized')
      .mockImplementation(() => undefined);
    jest.spyOn(service, 'getInfoClient').mockReturnValue({ candleSnapshot });

    const result = await service.fetchHistoricalCandles({
      symbol: 'ETH',
      interval: '5m',
      limit: 5,
    });

    expect(result).toStrictEqual({
      symbol: 'ETH',
      interval: '5m',
      candles: [
        {
          time: 1700000000000,
          open: '1',
          high: '2',
          low: '0.5',
          close: '1.5',
          volume: '42',
        },
      ],
    });
  });
});
