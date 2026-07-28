/* eslint-disable @typescript-eslint/naming-convention */
import type { RampsOrder } from '@metamask/ramps-controller';
import { buildRampsTransactionCompletedProperties } from './buildRampsTransactionCompletedProperties';

function makeOrder(overrides: Partial<RampsOrder> = {}): RampsOrder {
  return {
    providerOrderId: 'transak/orders/abc123',
    fiatAmount: 100,
    cryptoAmount: 0.02,
    exchangeRate: 4800,
    networkFees: 1.5,
    partnerFees: 2.5,
    totalFeesFiat: 4,
    paymentMethod: { id: 'credit_debit_card' },
    region: 'us-ca',
    cryptoCurrency: { assetId: 'eip155:1/slip44:60', symbol: 'ETH' },
    network: { chainId: 'eip155:1', name: 'Ethereum' },
    fiatCurrency: { symbol: 'USD' },
    provider: { name: 'Transak' },
    ...overrides,
  } as unknown as RampsOrder;
}

describe('buildRampsTransactionCompletedProperties', () => {
  it('maps a fully-populated order to the schema shape', () => {
    expect(buildRampsTransactionCompletedProperties(makeOrder())).toStrictEqual(
      {
        ramp_type: 'UNIFIED_BUY_2',
        ramp_routing: 'AGGREGATOR',
        provider_order_id: 'transak/orders/abc123',
        amount_source: 100,
        amount_destination: 0.02,
        exchange_rate: 4800,
        gas_fee: 1.5,
        processing_fee: 2.5,
        total_fee: 4,
        payment_method_id: 'credit_debit_card',
        country: 'us-ca',
        currency_destination: 'eip155:1/slip44:60',
        currency_destination_symbol: 'ETH',
        currency_destination_network: 'Ethereum',
        currency_source: 'USD',
        provider_onramp: 'Transak',
      },
    );
  });

  it('computes exchange_rate from amounts net of fees when missing', () => {
    const props = buildRampsTransactionCompletedProperties(
      makeOrder({ exchangeRate: undefined }),
    );
    // (100 - 4) / 0.02 = 4800
    expect(props.exchange_rate).toBe(4800);
  });

  it('falls back to 0 exchange_rate when cryptoAmount is 0', () => {
    const props = buildRampsTransactionCompletedProperties(
      makeOrder({ exchangeRate: undefined, cryptoAmount: 0 }),
    );
    expect(props.exchange_rate).toBe(0);
  });

  it('uses empty/zero fallbacks and omits provider_order_id when fields are missing', () => {
    const props = buildRampsTransactionCompletedProperties(
      makeOrder({
        providerOrderId: '',
        exchangeRate: undefined,
        networkFees: undefined,
        partnerFees: undefined,
        paymentMethod: undefined,
        region: undefined,
        cryptoCurrency: undefined,
        fiatCurrency: undefined,
        provider: undefined,
      }),
    );
    expect(props).not.toHaveProperty('provider_order_id');
    expect(props.gas_fee).toBe(0);
    expect(props.processing_fee).toBe(0);
    expect(props.payment_method_id).toBe('');
    expect(props.country).toBe('');
    expect(props.currency_destination).toBe('');
    expect(props.currency_source).toBe('');
    expect(props.provider_onramp).toBe('');
  });
});
