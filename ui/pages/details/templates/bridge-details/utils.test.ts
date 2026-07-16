import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { Status } from '../../../../../shared/lib/activity/types';
import { getBridgeDisplayStatus } from './utils';

const buildHistoryItem = (status: StatusTypes): BridgeHistoryItem =>
  ({
    status: { status },
  }) as unknown as BridgeHistoryItem;

describe('getBridgeDisplayStatus', () => {
  it('returns the fallback status when no bridge history item is provided', () => {
    expect(getBridgeDisplayStatus('success')).toBe('success');
    expect(getBridgeDisplayStatus('failed')).toBe('failed');
  });

  it('returns the fallback status when the history item has no status', () => {
    const historyItem = { status: {} } as unknown as BridgeHistoryItem;
    expect(getBridgeDisplayStatus('success', historyItem)).toBe('success');
  });

  it('maps a complete bridge to success', () => {
    expect(
      getBridgeDisplayStatus('success', buildHistoryItem(StatusTypes.COMPLETE)),
    ).toBe('success');
  });

  it('maps a failed bridge to failed', () => {
    expect(
      getBridgeDisplayStatus('success', buildHistoryItem(StatusTypes.FAILED)),
    ).toBe('failed');
  });

  it('maps an in-flight destination to pending even when the source item is confirmed', () => {
    const inFlightStatuses = [
      StatusTypes.PENDING,
      StatusTypes.SUBMITTED,
      StatusTypes.UNKNOWN,
    ];

    inFlightStatuses.forEach((bridgeStatus) => {
      expect(
        getBridgeDisplayStatus(
          'success' as Status,
          buildHistoryItem(bridgeStatus),
        ),
      ).toBe('pending');
    });
  });
});
