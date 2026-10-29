import {
  rampsPaymentMethodsKeys,
  rampsPaymentMethodsOptions,
} from './paymentMethods';

jest.mock('../../../store/controller-actions/ramps-controller', () => ({
  getRampsPaymentMethods: jest.fn().mockResolvedValue({
    payments: [{ id: 'credit_debit_card', name: 'Card' }],
  }),
}));

const { getRampsPaymentMethods } = jest.requireMock(
  '../../../store/controller-actions/ramps-controller',
);

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

describe('rampsPaymentMethodsOptions', () => {
  it('loads payment methods from the controller action', async () => {
    const params = {
      regionCode: 'US',
      fiat: 'USD',
      assetId: 'eip155:1/slip44:60',
      providerId: 'transak',
    };

    const options = rampsPaymentMethodsOptions(params);
    const result = await (
      options.queryFn as () => ReturnType<NonNullable<typeof options.queryFn>>
    )();

    expect(result).toMatchSnapshot();
    expect(getRampsPaymentMethods).toHaveBeenCalledWith('US', {
      fiat: 'USD',
      assetId: 'eip155:1/slip44:60',
      provider: 'transak',
    });
  });
});
