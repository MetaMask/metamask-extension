import type { RampsOrder } from '@metamask/ramps-controller';
import { mapRampsOrderSafely } from './mapRampsOrderSafely';

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
      orderType: 'SELL',
    } as unknown as RampsOrder;

    expect(mapRampsOrderSafely(order)?.type).toBe('rampSell');
  });
});
