import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  dedupeItems,
  groupActivityListItems,
  shouldShowPlusSign,
} from './helpers';

function makeItem(
  overrides: Partial<ActivityListItem> & {
    timestamp: number;
    status: ActivityListItem['status'];
  },
): ActivityListItem {
  return {
    type: 'send',
    chainId: 'eip155:1',
    data: {
      hash: '0xabc',
      from: '0x1',
      to: '0x2',
    },
    ...overrides,
  } as ActivityListItem;
}

describe('shouldShowPlusSign', () => {
  it('disables plus for approval activities', () => {
    expect(shouldShowPlusSign('approveSpendingCap')).toBe(false);
  });

  it('enables plus for send activities', () => {
    expect(shouldShowPlusSign('send')).toBe(true);
  });
});

describe('dedupeItems', () => {
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
      data: {
        hash: '0xabc',
        from: '0x1',
        to: '0x2',
      },
    });

    expect(dedupeItems([sendItem], [contractInteractionItem])).toStrictEqual([
      sendItem,
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
