import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  dedupeItems,
  getActivityItemIdentifier,
  getItemKey,
  getLastEvmItemIndex,
  groupActivityListItems,
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
    hash: '0xabc',
    data: {
      from: '0x1',
      to: '0x2',
    },
    ...overrides,
  } as ActivityListItem;
}

describe('getActivityItemIdentifier', () => {
  it('returns undefined when no item is selected', () => {
    expect(getActivityItemIdentifier(undefined)).toBeUndefined();
    expect(getActivityItemIdentifier(null)).toBeUndefined();
  });

  it('reduces a provider-prefixed ramp order id to its order code', () => {
    const rampBuy = makeItem({
      timestamp: 1,
      status: 'pending',
      type: 'rampBuy',
      hash: undefined,
      data: { id: 'moonpay/orders/native-uuid' },
    });

    expect(getActivityItemIdentifier(rampBuy)).toBe('native-uuid');
  });

  it('prefers the settlement hash once the ramp order has one', () => {
    const rampBuy = makeItem({
      timestamp: 1,
      status: 'success',
      type: 'rampBuy',
      hash: '0xdef',
      data: { id: 'moonpay/orders/native-uuid' },
    });

    expect(getActivityItemIdentifier(rampBuy)).toBe('0xdef');
  });

  it('falls through an empty hash to the ramp order code', () => {
    const rampBuy = makeItem({
      timestamp: 1,
      status: 'pending',
      type: 'rampBuy',
      hash: '',
      data: { id: 'moonpay/orders/native-uuid' },
    });

    expect(getActivityItemIdentifier(rampBuy)).toBe('native-uuid');
  });

  it('returns undefined for a ramp sell without an order id', () => {
    const rampSell = makeItem({
      timestamp: 1,
      status: 'pending',
      type: 'rampSell',
      hash: undefined,
      data: {},
    });

    expect(getActivityItemIdentifier(rampSell)).toBeUndefined();
  });
});

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
    const newer = makeItem({ timestamp: jan2, status: 'success' });
    const older = makeItem({ timestamp: jan1, status: 'success' });

    const grouped = groupActivityListItems([newer, older]);

    expect(grouped.map((row) => row.type)).toStrictEqual([
      'date-header',
      'item',
      'date-header',
      'item',
    ]);
    expect(grouped[1]).toStrictEqual({ type: 'item', item: newer });
    expect(grouped[3]).toStrictEqual({ type: 'item', item: older });

    const firstHeader = grouped[0];
    const secondHeader = grouped[2];
    expect(firstHeader.type).toBe('date-header');
    expect(secondHeader.type).toBe('date-header');
    if (
      firstHeader.type === 'date-header' &&
      secondHeader.type === 'date-header'
    ) {
      expect(firstHeader.date).toBeGreaterThan(secondHeader.date);
    }
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

describe('getItemKey', () => {
  it('uses a stable key for the pending header', () => {
    expect(getItemKey({ type: 'pending-header' }, 0)).toBe('pending-header');
  });

  it('uses the ramp order code when the item has no hash', () => {
    const key = getItemKey(
      {
        type: 'item',
        item: makeItem({
          timestamp: 42,
          status: 'pending',
          type: 'rampBuy',
          chainId: 'eip155:1',
          hash: undefined,
          data: { id: 'moonpay/orders/native-uuid' },
        }),
      },
      3,
    );

    expect(key).toBe('eip155:1:42:rampBuy:native-uuid');
  });
});

describe('getLastEvmItemIndex', () => {
  it('returns the index of the last grouped row that matches an EVM item hash', () => {
    const jan2 = new Date('2025-01-02T12:00:00Z').getTime();
    const evmItem = makeItem({
      timestamp: jan2,
      status: 'success',
      hash: '0xabc',
    });
    const rampItem = makeItem({
      timestamp: jan2 + 1,
      status: 'pending',
      type: 'rampBuy',
      hash: undefined,
      data: { id: 'order-1' },
    });
    const grouped = groupActivityListItems([rampItem, evmItem]);

    expect(getLastEvmItemIndex(grouped, [evmItem])).toBe(
      grouped.findIndex(
        (row) => row.type === 'item' && row.item.hash === '0xabc',
      ),
    );
  });

  it('returns -1 when no EVM items are present', () => {
    const grouped = groupActivityListItems([
      makeItem({
        timestamp: 1,
        status: 'pending',
        type: 'rampBuy',
        hash: undefined,
        data: { id: 'order-1' },
      }),
    ]);

    expect(getLastEvmItemIndex(grouped, [])).toBe(-1);
  });
});
