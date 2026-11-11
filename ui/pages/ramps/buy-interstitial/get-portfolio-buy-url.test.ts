import { getPortfolioBuyUrl } from './get-portfolio-buy-url';

describe('getPortfolioBuyUrl', () => {
  it('forwards the link params to the Portfolio buy URL', () => {
    const params = new URLSearchParams({ address: '0xabc', chainId: '137' });

    expect(getPortfolioBuyUrl(params)).toBe(
      'https://app.metamask.io/buy?address=0xabc&chainId=137',
    );
  });
});
