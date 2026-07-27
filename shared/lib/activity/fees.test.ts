import type { ActivityListItem } from './types';
import { GAS_FEE_SPONSORED, mergeActivityItemSponsoredFees } from './fees';

function buildSwapItem(data: Record<string, unknown>): ActivityListItem {
  return {
    type: 'swap',
    chainId: 'eip155:1',
    hash: '0xabc',
    status: 'success',
    timestamp: 1,
    data,
  } as ActivityListItem;
}

describe('mergeActivityItemSponsoredFees', () => {
  it('preserves a local sponsored fee marker while keeping target token data', () => {
    const sourceItem = buildSwapItem({
      fees: [{ type: GAS_FEE_SPONSORED }],
      sourceToken: {
        amount: '1000000000000000000',
        direction: 'out',
        symbol: 'MON',
      },
    });

    const targetItem = buildSwapItem({
      destinationToken: {
        amount: '3000000',
        decimals: 6,
        direction: 'in',
        symbol: 'USDC',
      },
      fees: [
        {
          amount: '6',
          symbol: 'MON',
          type: 'base',
        },
        {
          amount: '2',
          symbol: 'MON',
          type: 'priority',
        },
      ],
      sourceToken: {
        amount: '1000000000000000000',
        decimals: 18,
        direction: 'out',
        symbol: 'MON',
      },
    });

    expect(
      mergeActivityItemSponsoredFees(sourceItem, targetItem),
    ).toStrictEqual({
      ...targetItem,
      data: {
        ...(targetItem.data as Record<string, unknown>),
        fees: [
          { type: GAS_FEE_SPONSORED },
          {
            amount: '2',
            symbol: 'MON',
            type: 'priority',
          },
        ],
      },
    });
  });

  it('returns the target item if the source item has no sponsored fee', () => {
    const sourceItem = buildSwapItem({
      fees: [
        {
          amount: '6',
          symbol: 'MON',
          type: 'base',
        },
      ],
    });
    const targetItem = buildSwapItem({
      fees: [
        {
          amount: '2',
          symbol: 'MON',
          type: 'priority',
        },
      ],
    });

    expect(mergeActivityItemSponsoredFees(sourceItem, targetItem)).toBe(
      targetItem,
    );
  });

  it('returns the target item if the target item cannot carry fees', () => {
    const sourceItem = buildSwapItem({
      fees: [{ type: GAS_FEE_SPONSORED }],
    });
    const targetItem = {
      type: 'buy',
      chainId: 'eip155:1',
      hash: '0xabc',
      status: 'success',
      timestamp: 1,
      data: {},
    } as ActivityListItem;

    expect(mergeActivityItemSponsoredFees(sourceItem, targetItem)).toBe(
      targetItem,
    );
  });
});
