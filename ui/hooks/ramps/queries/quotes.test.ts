import { rampsQuotesKeys } from './quotes';

describe('rampsQuotesKeys', () => {
  it('includes forceRefresh, ttl, and redirectUrl in the detail key', () => {
    expect(
      rampsQuotesKeys.detail({
        assetId: 'eip155:1/slip44:60',
        amount: 100,
        walletAddress: '0xabc',
        paymentMethods: ['credit_debit_card'],
        providers: ['transak'],
        redirectUrl: 'https://metamask.io/callback',
        forceRefresh: true,
        ttl: 15_000,
      }),
    ).toMatchSnapshot();
  });

  it('changes when forceRefresh changes', () => {
    const base = {
      assetId: 'eip155:1/slip44:60',
      amount: 100,
      walletAddress: '0xabc',
      paymentMethods: ['credit_debit_card'],
      providers: ['transak'],
      forceRefresh: false,
    };

    expect(rampsQuotesKeys.detail(base)).not.toEqual(
      rampsQuotesKeys.detail({ ...base, forceRefresh: true }),
    );
  });
});
