import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { dedupeItems, groupActivityListItems } from './helpers';

function makeItem(
  overrides: Partial<ActivityListItem> & {
    timestamp: number;
    status: ActivityListItem['status'];
  },
): ActivityListItem {
  return {
    type: 'send',
    chainId: 'eip155:1',
    hash: '0xabc',
    data: {
      from: '0x1',
      to: '0x2',
    },
    ...overrides,
  } as ActivityListItem;
}

describe('dedupeItems', () => {
  it('replaces contractInteraction with a more specific API item for the same hash', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();

    const contractInteraction = makeItem({
      timestamp,
      status: 'success',
      type: 'contractInteraction',
      data: {
        from: '0x1',
        to: '0x2',
      },
    });

    const lendingDeposit = makeItem({
      timestamp: timestamp + 1,
      status: 'success',
      type: 'lendingDeposit',
      hash: '0xabc',
      data: {
        sourceToken: {
          amount: '20000000000000000',
          decimals: 18,
          direction: 'out',
          symbol: 'ARB',
        },
      },
    });

    expect(dedupeItems([contractInteraction], [lendingDeposit])).toStrictEqual([
      lendingDeposit,
    ]);
  });

  it('replaces a local item with the API item when both share the same category', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();

    const localLendingDeposit = makeItem({
      timestamp,
      status: 'success',
      type: 'lendingDeposit',
      data: {
        sourceToken: {
          amount: '20000000000000000',
          direction: 'out',
        },
      },
    });

    const apiLendingDeposit = makeItem({
      timestamp: timestamp + 1,
      status: 'success',
      type: 'lendingDeposit',
      hash: '0xabc',
      data: {
        sourceToken: {
          amount: '20000000000000000',
          decimals: 18,
          direction: 'out',
          symbol: 'ARB',
        },
      },
    });

    expect(
      dedupeItems([localLendingDeposit], [apiLendingDeposit]),
    ).toStrictEqual([apiLendingDeposit]);
  });

  it('replaces a local send with the API send for the same hash', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();

    const localSend = makeItem({
      timestamp,
      status: 'success',
      type: 'send',
      data: {
        from: '0x1',
        to: '0x2',
        token: {
          direction: 'out',
          amount: '20000000000000000',
        },
      },
    });

    const apiSend = makeItem({
      timestamp: timestamp + 1,
      status: 'success',
      type: 'send',
      hash: '0xabc',
      data: {
        from: '0x1',
        to: '0x2',
        token: {
          direction: 'out',
          amount: '20000000000000000',
          decimals: 18,
          symbol: 'ARB',
        },
      },
    });

    expect(dedupeItems([localSend], [apiSend])).toStrictEqual([apiSend]);
  });

  it('does not let contractInteraction replace a more specific item with the same hash', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();
    const sendItem = makeItem({
      timestamp,
      status: 'success',
      type: 'send',
    });
    const contractInteractionItem = makeItem({
      timestamp: timestamp + 1,
      status: 'success',
      type: 'contractInteraction',
      hash: '0xabc',
      data: {
        from: '0x1',
        to: '0x2',
      },
    });

    expect(dedupeItems([sendItem], [contractInteractionItem])).toStrictEqual([
      sendItem,
    ]);
  });

  it('keeps locally enriched items such as perps over a different API category', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();
    const perpsItem = makeItem({
      timestamp,
      status: 'success',
      type: 'perpsAddFunds',
      data: {
        fiat: { amount: '100.00' },
        networkFee: { amount: '1.25' },
      },
    });
    const contractInteractionItem = makeItem({
      timestamp: timestamp + 1,
      status: 'success',
      type: 'contractInteraction',
      hash: '0xabc',
      data: {
        from: '0x1',
        to: '0x2',
      },
    });

    expect(dedupeItems([perpsItem], [contractInteractionItem])).toStrictEqual([
      perpsItem,
    ]);
  });
});

describe('groupActivityListItems', () => {
  it('returns only date-grouped rows when nothing is pending', () => {
    const jan2 = new Date('2025-01-02T12:00:00Z').getTime();
    const jan1 = new Date('2025-01-01T10:00:00Z').getTime();

    const grouped = groupActivityListItems([
      makeItem({ timestamp: jan2, status: 'success' }),
      makeItem({ timestamp: jan1, status: 'success' }),
    ]);

    expect(grouped.map((row) => row.type)).toStrictEqual([
      'date-header',
      'item',
      'date-header',
      'item',
    ]);
  });

  it('puts pending rows under a pending header then date-groups the rest', () => {
    const jan2 = new Date('2025-01-02T12:00:00Z').getTime();
    const jan1 = new Date('2025-01-01T10:00:00Z').getTime();

    const grouped = groupActivityListItems([
      makeItem({ timestamp: jan2, status: 'pending' }),
      makeItem({ timestamp: jan1, status: 'success' }),
    ]);

    expect(grouped.map((row) => row.type)).toStrictEqual([
      'pending-header',
      'item',
      'date-header',
      'item',
    ]);
  });
});
