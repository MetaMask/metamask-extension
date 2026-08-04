/* eslint-disable @typescript-eslint/naming-convention */
import type { RampsOrder } from '@metamask/ramps-controller';
import {
  buildRampsTransactionCompletedProperties,
  buildRampsTransactionConfirmedProperties,
  buildRampsTransactionFailedProperties,
} from './buildRampsTransactionCompletedProperties';

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
    expect(
      buildRampsTransactionCompletedProperties(makeOrder(), 'session-1'),
    ).toStrictEqual({
      ramp_type: 'UNIFIED_BUY_2',
      ramp_routing: 'AGGREGATOR',
      checkout_session_id: 'session-1',
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
    });
  });

  it('computes exchange_rate from amounts net of fees when missing', () => {
    const props = buildRampsTransactionCompletedProperties(
      makeOrder({ exchangeRate: undefined }),
    );
    // (100 - 4) / 0.02 = 4800
    expect(props.exchange_rate).toBe(4800);
  });

  it('omits checkout_session_id when no session id is passed', () => {
    const props = buildRampsTransactionCompletedProperties(makeOrder());
    expect(props).not.toHaveProperty('checkout_session_id');
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

describe('buildRampsTransactionFailedProperties', () => {
  it('reuses the completed shape and adds error_message from statusDescription', () => {
    const props = buildRampsTransactionFailedProperties(
      makeOrder({ statusDescription: 'card_declined' }),
      'session-1',
    );
    expect(props.amount_source).toBe(100);
    expect(props.provider_onramp).toBe('Transak');
    expect(props.error_message).toBe('card_declined');
    expect(props.checkout_session_id).toBe('session-1');
  });

  it('falls back to a generic error_message when statusDescription is empty', () => {
    const props = buildRampsTransactionFailedProperties(
      makeOrder({ statusDescription: '' }),
    );
    expect(props.error_message).toBe('transaction_failed');
    expect(props).not.toHaveProperty('checkout_session_id');
  });
});

describe('buildRampsTransactionConfirmedProperties', () => {
  it('maps a fully-populated order to the confirmed schema shape', () => {
    expect(
      buildRampsTransactionConfirmedProperties(
        makeOrder(),
        undefined,
        'session-1',
      ),
    ).toStrictEqual({
      ramp_type: 'UNIFIED_BUY_2',
      ramp_routing: 'AGGREGATOR',
      checkout_session_id: 'session-1',
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
    });
  });

  it('does not include provider_onramp (not in the confirmed schema)', () => {
    const props = buildRampsTransactionConfirmedProperties(makeOrder());
    expect(props).not.toHaveProperty('provider_onramp');
  });

  it('does not include region when no region argument is passed', () => {
    const props = buildRampsTransactionConfirmedProperties(makeOrder());
    expect(props).not.toHaveProperty('region');
  });

  it('includes region and uses it for country when passed', () => {
    const props = buildRampsTransactionConfirmedProperties(makeOrder(), 'fr');
    expect(props.region).toBe('fr');
    expect(props.country).toBe('fr');
  });

  it('falls back to order.region for country when no region argument is passed', () => {
    const props = buildRampsTransactionConfirmedProperties(makeOrder());
    expect(props.country).toBe('us-ca');
  });

  it('computes exchange_rate from amounts net of fees when missing', () => {
    const props = buildRampsTransactionConfirmedProperties(
      makeOrder({ exchangeRate: undefined }),
    );
    expect(props.exchange_rate).toBe(4800);
  });

  it('uses empty/zero fallbacks and omits provider_order_id when fields are missing', () => {
    const props = buildRampsTransactionConfirmedProperties(
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
  });
});
