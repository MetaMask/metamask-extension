import type { RampsOrder } from '@metamask/ramps-controller';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { mapRampsOrderSafely } from './mapRampsOrderSafely';

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

const baseOrder = {
  provider: { id: 'mockprovider-staging', name: 'MockProvider (Staging)' },
  cryptoAmount: 0.013745,
  fiatAmount: 50,
  cryptoCurrency: { assetId: 'eip155:1/slip44:60', symbol: 'ETH' },
  fiatCurrency: { symbol: 'USD' },
  providerOrderId: '33dfa019e795ddba9974ccfddbeba7f9',
  providerOrderLink: 'https://example.com/status/123',
  createdAt: 1699368322000,
  totalFeesFiat: 0.98,
  txHash: 'fake-hash-staging-server',
  walletAddress: '0x005958702dbcf1c499ffd67dc60dbd4c6992201e',
  status: 'COMPLETED',
  orderType: 'BUY',
  network: { name: 'Ethereum', chainId: 'eip155:1' },
} as unknown as RampsOrder;

describe('mapRampsOrderSafely', () => {
  it('returns the shared ActivityItem without remapping data.id', () => {
    const order = {
      ...baseOrder,
      id: '/providers/transak/orders/order-abc',
      providerOrderId: 'order-abc',
      txHash: '',
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.hash).toBeUndefined();
    expect(mapped?.data.id).toBe('/providers/transak/orders/order-abc');
  });

  it('returns undefined when the shared mapper filters the order out', () => {
    const order = {
      ...baseOrder,
      status: 'PRECREATED',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)).toBeUndefined();
  });

  it('returns undefined when the order cannot resolve a chainId', () => {
    const order = {
      ...baseOrder,
      network: undefined,
      cryptoCurrency: undefined,
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)).toBeUndefined();
  });

  it('keeps a provider-reported crypto amount while the order is pending', () => {
    const order = {
      ...baseOrder,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token?.amount).toBe('0.013745');
  });

  it('maps a pending order without crypto currency metadata', () => {
    const order = {
      ...baseOrder,
      providerOrderId: 'order-without-currency',
      cryptoCurrency: undefined,
      fiatCurrency: undefined,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token).toBeUndefined();
    expect(mapped?.data.fiat?.currency).toBeUndefined();
  });

  it('normalizes a missing txHash so the shared mapper does not throw', () => {
    const order = {
      ...baseOrder,
      txHash: null,
      status: 'PENDING',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.type).toBe('rampBuy');
  });

  it('strips zero crypto and fiat amounts from the mapped item', () => {
    const order = {
      ...baseOrder,
      cryptoAmount: 0,
      fiatAmount: 0,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token?.amount).toBeUndefined();
    expect(mapped?.data.fiat).toBeUndefined();
  });

  it('strips non-finite crypto and fiat amounts from the mapped item', () => {
    const order = {
      ...baseOrder,
      cryptoAmount: NaN,
      fiatAmount: Infinity,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token?.amount).toBeUndefined();
    expect(mapped?.data.fiat).toBeUndefined();
  });

  it('resolves chainId from cryptoCurrency.assetId when network is missing', () => {
    const order = {
      ...baseOrder,
      network: undefined,
      cryptoCurrency: { assetId: 'eip155:1/slip44:60', symbol: 'ETH' },
      status: 'PENDING',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.chainId).toBe('eip155:1');
  });

  it('maps when network is already a non-empty CAIP chain string', () => {
    const order = {
      ...baseOrder,
      network: 'eip155:1',
      status: 'PENDING',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.chainId).toBe('eip155:1');
  });
});
