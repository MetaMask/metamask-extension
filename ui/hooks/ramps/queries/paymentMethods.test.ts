import { rampsPaymentMethodsKeys } from './paymentMethods';

describe('rampsPaymentMethodsKeys', () => {
  it('includes fiat and assetId in the detail key', () => {
    expect(
      rampsPaymentMethodsKeys.detail({
        regionCode: 'US',
        fiat: 'USD',
        assetId: 'eip155:1/slip44:60',
        providerId: 'transak',
      }),
    ).toMatchSnapshot();
  });

  it('changes when fiat or assetId changes', () => {
    const base = {
      regionCode: 'us',
      fiat: 'usd',
      assetId: 'eip155:1/slip44:60',
      providerId: 'transak',
    };

    expect(rampsPaymentMethodsKeys.detail(base)).not.toEqual(
      rampsPaymentMethodsKeys.detail({ ...base, fiat: 'eur' }),
    );
    expect(rampsPaymentMethodsKeys.detail(base)).not.toEqual(
      rampsPaymentMethodsKeys.detail({
        ...base,
        assetId: 'eip155:1/erc20:0xabc',
      }),
    );
  });
});
