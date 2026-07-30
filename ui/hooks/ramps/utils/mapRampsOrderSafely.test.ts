import type { RampsOrder } from '@metamask/ramps-controller';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { mapRampsOrderSafely } from './mapRampsOrderSafely';
import { setPendingOrderPreview } from './pendingOrderPreview';

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
    // Shared contract: order.id ?? providerOrderId — not getInternalOrderCode.
    expect(mapped?.data.id).toBe('/providers/transak/orders/order-abc');
  });

  it('returns undefined when the shared mapper filters the order out', () => {
    const order = {
      ...baseOrder,
      status: 'PRECREATED',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)).toBeUndefined();
  });

  it('returns undefined when the order cannot be mapped', () => {
    const order = {
      ...baseOrder,
      network: undefined,
      cryptoCurrency: undefined,
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)).toBeUndefined();
  });

  it('seeds a missing chainId from the fallback (redirect stub)', () => {
    const order = {
      ...baseOrder,
      network: undefined,
      cryptoCurrency: undefined,
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order, 'eip155:1')?.chainId).toBe('eip155:1');
  });

  it('does not override a resolvable chainId with the fallback', () => {
    expect(mapRampsOrderSafely(baseOrder, 'eip155:137')?.chainId).toBe(
      'eip155:1',
    );
  });

  it('overlays a stashed preview onto an order with no token/fiat data yet', () => {
    setPendingOrderPreview('order-2', {
      cryptoCurrency: { symbol: 'ETH', assetId: 'eip155:1/slip44:60' },
      cryptoAmount: '0.05',
      fiatCurrency: { symbol: 'USD' },
      fiatAmount: 100,
      totalFeesFiat: 2,
    } as never);
    const order = {
      ...baseOrder,
      providerOrderId: 'order-2',
      cryptoCurrency: undefined,
      fiatCurrency: undefined,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token).toMatchObject({ symbol: 'ETH', amount: '0.05' });
    expect(mapped?.data.fiat).toMatchObject({ amount: '100', currency: 'USD' });
  });

  it('leaves the order untouched when no preview was stashed for it', () => {
    const order = {
      ...baseOrder,
      providerOrderId: 'order-without-preview',
      cryptoCurrency: undefined,
      fiatCurrency: undefined,
      status: 'PENDING',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token).toBeUndefined();
    expect(mapped?.data.fiat?.currency).toBeUndefined();
  });
});
