import { injectPills } from './inject';

describe('injectPills', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('restores the original cashtag after the resolved ticker changes', async () => {
    const tweet = document.createElement('article');
    tweet.dataset.testid = 'tweet';
    tweet.innerHTML = '<a href="/search?q=%24MSFT&src=cashtag_click">$MSFT</a>';
    document.body.append(tweet);

    const stop = injectPills(async () => ({
      ticker: 'MSFTON',
      name: 'Example Token',
      iconUrl: null,
      color: null,
      caipAssetId: null,
      chainId: null,
      isNative: false,
      resultType: null,
      price: 1,
      change24hPercent: 0,
      marketCap: null,
      liquidity: null,
      volume24h: null,
    }));

    await Promise.resolve();

    const anchor = tweet.querySelector('a');
    expect(anchor?.textContent).toContain('MSFT');

    stop.stop();

    expect(anchor?.textContent).toBe('$MSFT');
  });
});
