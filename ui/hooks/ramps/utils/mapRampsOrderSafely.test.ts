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
} as unknown as RampsOrder;

describe('mapRampsOrderSafely', () => {
  it('maps an order whose network is already an object', () => {
    const order = {
      ...baseOrder,
      network: { name: 'Ethereum', chainId: 'eip155:1' },
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.chainId).toBe('eip155:1');
  });

  it('normalizes a bare chain-id string network (observed on the Banxa-backed staging provider)', () => {
    const order = { ...baseOrder, network: '1' } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.chainId).toBe('eip155:1');
  });

  it('returns undefined instead of throwing when the order is unmappable', () => {
    const order = { ...baseOrder, network: undefined } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)).toBeUndefined();
  });

  it('seeds a missing chainId from the fallback (redirect order not yet populated)', () => {
    const order = { ...baseOrder, network: undefined } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order, 'eip155:1')?.chainId).toBe('eip155:1');
  });

  it('prefers the order chainId over the fallback when present', () => {
    const order = {
      ...baseOrder,
      network: { name: 'Ethereum', chainId: 'eip155:1' },
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order, 'eip155:137')?.chainId).toBe('eip155:1');
  });

  it('normalizes an upper-cased "BUY" orderType to rampBuy (the real API sends it upper-cased)', () => {
    const order = {
      ...baseOrder,
      network: '1',
      orderType: 'BUY',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.type).toBe('rampBuy');
  });

  it('normalizes an upper-cased "SELL" orderType to rampSell', () => {
    const order = {
      ...baseOrder,
      network: '1',
      providerOrderId: 'sell-order-1',
      orderType: 'SELL',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.type).toBe('rampSell');
  });

  it('overlays a stashed preview onto a precreated order with no token/fiat data yet', () => {
    setPendingOrderPreview('order-2', {
      cryptoCurrency: { symbol: 'ETH', assetId: 'eip155:1/slip44:60' },
      cryptoAmount: '0.05',
      fiatCurrency: { symbol: 'USD' },
      fiatAmount: 100,
      totalFeesFiat: 2,
    } as never);
    const order = {
      ...baseOrder,
      network: { name: 'Ethereum', chainId: 'eip155:1' },
      providerOrderId: 'order-2',
      cryptoCurrency: undefined,
      fiatCurrency: undefined,
      status: 'PRECREATED',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token).toMatchObject({ symbol: 'ETH', amount: '0.05' });
    expect(mapped?.data.fiat).toMatchObject({ amount: '100', currency: 'USD' });
  });

  it('leaves the order untouched when no preview was stashed for it', () => {
    const order = {
      ...baseOrder,
      network: { name: 'Ethereum', chainId: 'eip155:1' },
      providerOrderId: 'order-without-preview',
      cryptoCurrency: undefined,
      fiatCurrency: undefined,
      status: 'PRECREATED',
    } as unknown as RampsOrder;

    const mapped = mapRampsOrderSafely(order) as RampOrderItem | undefined;

    expect(mapped?.data.token).toBeUndefined();
    expect(mapped?.data.fiat?.currency).toBeUndefined();
  });

  it('pins orderType to the first confirmed value, ignoring a later conflicting poll of the same order', () => {
    // An order's buy/sell direction can't legitimately change after creation.
    // Polling has been observed to return an inconsistent orderType across
    // successive fetches of the same order, flickering the details screen
    // between Buying/Selling — the second (conflicting) poll result must not
    // override the first.
    const buyOrder = {
      ...baseOrder,
      network: '1',
      providerOrderId: 'pinned-order-1',
      orderType: 'buy',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(buyOrder)?.type).toBe('rampBuy');

    const sameOrderPolledAsSell = {
      ...baseOrder,
      network: '1',
      providerOrderId: 'pinned-order-1',
      orderType: 'sell',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(sameOrderPolledAsSell)?.type).toBe('rampBuy');
  });

  it('does not let one order code affect the pinned orderType of another', () => {
    const buyOrder = {
      ...baseOrder,
      network: '1',
      providerOrderId: 'pinned-order-buy',
      orderType: 'buy',
    } as unknown as RampsOrder;
    const sellOrder = {
      ...baseOrder,
      network: '1',
      providerOrderId: 'pinned-order-sell',
      orderType: 'sell',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(buyOrder)?.type).toBe('rampBuy');
    expect(mapRampsOrderSafely(sellOrder)?.type).toBe('rampSell');
  });
});
