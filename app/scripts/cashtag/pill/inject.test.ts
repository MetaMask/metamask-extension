import { injectPills } from './inject';

describe('injectPills', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('restores the original cashtag after the resolved ticker changes', async () => {
    const tweet = document.createElement('article');
    tweet.dataset.testid = 'tweet';
    tweet.innerHTML = '<a href="/search?q=%24ABC&src=cashtag_click">$ABC</a>';
    document.body.append(tweet);

    const stop = await injectPills(async () => ({
      ticker: 'XYZ',
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
    expect(anchor?.textContent).toContain('XYZ');

    stop.stop();

    expect(anchor?.textContent).toBe('$ABC');
  });
});
