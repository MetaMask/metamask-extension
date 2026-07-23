import { getLocalTransactionFees } from './helpers';

describe('getLocalTransactionFees', () => {
  it('builds a base network fee from the receipt (gasUsed * effectiveGasPrice)', () => {
    const group = {
      primaryTransaction: {
        chainId: '0x1',
        txReceipt: { gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00' },
        txParams: {},
      },
    } as unknown as Parameters<typeof getLocalTransactionFees>[0];

    expect(getLocalTransactionFees(group)).toStrictEqual([
      {
        type: 'base',
        amount: '21000000000000',
        decimals: 18,
        symbol: 'ETH',
        assetId: 'eip155:1/slip44:60',
      },
    ]);
  });

  it('returns undefined when there is no gas data', () => {
    const group = {
      primaryTransaction: { chainId: '0x1', txReceipt: {}, txParams: {} },
    } as unknown as Parameters<typeof getLocalTransactionFees>[0];

    expect(getLocalTransactionFees(group)).toBeUndefined();
  });

  it('adds layer1GasFee (L1 + operator) onto the L2 network fee', () => {
    const group = {
      primaryTransaction: {
        chainId: '0x1388',
        layer1GasFee: '0x5f5e100', // 100_000_000
        txReceipt: { gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00' },
        txParams: {},
      },
    } as unknown as Parameters<typeof getLocalTransactionFees>[0];

    // 21_000_000_000_000 + 100_000_000
    // Mantle is outside the bridge native-asset registry, so symbol/assetId are omitted.
    expect(getLocalTransactionFees(group)).toStrictEqual([
      {
        type: 'base',
        amount: '21000100000000',
        decimals: 18,
      },
    ]);
  });

  it('falls back to receipt l1Fee when layer1GasFee is absent', () => {
    const group = {
      primaryTransaction: {
        chainId: '0xa',
        txReceipt: {
          gasUsed: '0x5208',
          effectiveGasPrice: '0x3b9aca00',
          l1Fee: '0x5f5e100',
        },
        txParams: {},
      },
    } as unknown as Parameters<typeof getLocalTransactionFees>[0];

    expect(getLocalTransactionFees(group)).toStrictEqual([
      {
        type: 'base',
        amount: '21000100000000',
        decimals: 18,
        symbol: 'ETH',
        assetId: 'eip155:10/slip44:60',
      },
    ]);
  });

  it('prefers layer1GasFee over receipt l1Fee to avoid double-counting', () => {
    const group = {
      primaryTransaction: {
        chainId: '0x1388',
        layer1GasFee: '0x5f5e100',
        txReceipt: {
          gasUsed: '0x5208',
          effectiveGasPrice: '0x3b9aca00',
          l1Fee: '0xffffffff',
        },
        txParams: {},
      },
    } as unknown as Parameters<typeof getLocalTransactionFees>[0];

    expect(getLocalTransactionFees(group)?.[0]?.amount).toBe('21000100000000');
  });
});
