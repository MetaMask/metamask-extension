import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { MINUTE } from '../../../../shared/constants/time';
import { getIsDelayed } from './tx-details';

describe('tx-details utils', () => {
  describe('getIsDelayed', () => {
    it('returns false when status is not PENDING', () => {
      const result = getIsDelayed(StatusTypes.COMPLETE, {
        startTime: Date.now(),
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);
      expect(result).toBe(false);
    });

    it('returns false when bridgeHistoryItem is undefined', () => {
      const result = getIsDelayed(StatusTypes.PENDING, undefined);
      expect(result).toBe(false);
    });

    it('returns false when startTime is undefined', () => {
      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime: undefined,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);
      expect(result).toBe(false);
    });

    it('returns false when current time is less than estimated completion time', () => {
      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime: Date.now() - 1000,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(false);
    });

    it('returns true when current time exceeds estimated completion time by 10 minutes', () => {
      const startTime = Date.now() - 61 * 1000 - 10 * MINUTE;

      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(true);
    });

    it('returns false when current time exceeds estimated completion time, but less than 10 minutes have passed', () => {
      const startTime = Date.now() - 61 * 1000;

      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(false);
    });
  });
});
