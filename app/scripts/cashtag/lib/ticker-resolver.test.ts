import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { createTickerResolver } from './ticker-resolver';
import type { AssetData } from './types';

const btc: AssetData = {
  ticker: 'BTC',
  name: 'Bitcoin',
  iconUrl: null,
  color: null,
  caipAssetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  chainId: 'bip122:000000000019d6689c085ae165831e93',
  isNative: true,
  resultType: 'Verified',
  price: 1,
  change24hPercent: 0,
  marketCap: 1,
  liquidity: null,
  volume24h: 1,
};

describe('createTickerResolver', () => {
  it('retries after a thrown messaging error', async () => {
    const sendRuntimeMessage = jest
      .fn()
      .mockRejectedValueOnce(new Error('Extension context invalidated'))
      .mockResolvedValueOnce({
        body: { asset: btc, similar: [] },
      });
    const resolveTicker = createTickerResolver(sendRuntimeMessage);

    await expect(resolveTicker('btc')).resolves.toBeNull();
    await expect(resolveTicker('btc')).resolves.toEqual({
      primary: btc,
      similar: [],
    });
    expect(sendRuntimeMessage).toHaveBeenCalledTimes(2);
  });

  it('retries after a successful empty payload', async () => {
    const sendRuntimeMessage = jest
      .fn()
      .mockResolvedValueOnce({ body: { asset: null, similar: [] } })
      .mockResolvedValueOnce({
        body: { asset: btc, similar: [] },
      });
    const resolveTicker = createTickerResolver(sendRuntimeMessage);

    await expect(resolveTicker('btc')).resolves.toBeNull();
    await expect(resolveTicker('btc')).resolves.toMatchObject({
      primary: btc,
    });
    expect(sendRuntimeMessage).toHaveBeenCalledTimes(2);
    expect(sendRuntimeMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { symbol: 'BTC' },
    });
  });

  it('caches a successful lookup', async () => {
    const sendRuntimeMessage = jest.fn().mockResolvedValue({
      body: { asset: btc, similar: [] },
    });
    const resolveTicker = createTickerResolver(sendRuntimeMessage);

    await resolveTicker('btc');
    await resolveTicker('BTC');

    expect(sendRuntimeMessage).toHaveBeenCalledTimes(1);
  });
});
