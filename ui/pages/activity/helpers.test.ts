import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { groupActivityListItems, isActivityPendingListItem } from './helpers';

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

describe('isActivityPendingListItem', () => {
  it('returns true when status is pending', () => {
    expect(
      isActivityPendingListItem(
        makeItem({ timestamp: 1000, status: 'pending' }),
      ),
    ).toBe(true);
  });

  it('returns false when status is success or failed', () => {
    expect(
      isActivityPendingListItem(
        makeItem({ timestamp: 1000, status: 'success' }),
      ),
    ).toBe(false);
    expect(
      isActivityPendingListItem(
        makeItem({ timestamp: 1000, status: 'failed' }),
      ),
    ).toBe(false);
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
