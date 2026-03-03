import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { MINUTE } from '../../../../shared/constants/time';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import {
  getBridgeAmountReceivedFormatted,
  getBridgeAmountSentFormatted,
  getIsDelayed,
} from './tx-details';

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

  describe('getBridgeAmountReceivedFormatted', () => {
    it('returns the correct amount for a bridge history item', () => {
      const result = getBridgeAmountReceivedFormatted({
        bridgeHistoryItem: mockBridgeTxData.bridgeHistoryItem as never,
        locale: 'en-US',
        txMeta: mockBridgeTxData.transactionGroup.primaryTransaction as never,
      });

      expect(result).toBe('1.981');
    });

    it('returns undefined if txMeta is undefined', () => {
      const result = getBridgeAmountReceivedFormatted({
        locale: 'en-US',
        txMeta: undefined,
      });

      expect(result).toBeUndefined();
    });

    it('returns the correct amount for a swap tx with no history item', () => {
      const result = getBridgeAmountReceivedFormatted({
        locale: 'en-US',
        txMeta: {
          ...mockBridgeTxData.transactionGroup.primaryTransaction,
          type: undefined,
          amounts: {
            to: {
              amount: BigInt('1000000'),
              token: {
                decimals: 6,
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'USDC',
                chainId: '0x1',
              },
            },
          },
        } as never,
      });

      expect(result).toBe('1');
    });

    it('returns undefined if amount and token decimals are undefined', () => {
      const result = getBridgeAmountReceivedFormatted({
        locale: 'en-US',
        txMeta: {
          ...mockBridgeTxData.transactionGroup.primaryTransaction,
          type: undefined,
          amounts: undefined,
        } as never,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('getBridgeAmountSentFormatted', () => {
    it('returns the correct amount for a bridge history item', () => {
      const result = getBridgeAmountSentFormatted({
        bridgeHistoryItem: mockBridgeTxData.bridgeHistoryItem as never,
        locale: 'en-US',
        txMeta: mockBridgeTxData.transactionGroup.primaryTransaction as never,
      });

      expect(result).toBe('2');
    });

    it('returns undefined if txMeta is undefined', () => {
      const result = getBridgeAmountSentFormatted({
        bridgeHistoryItem: mockBridgeTxData.bridgeHistoryItem as never,
        locale: 'en-US',
        txMeta: undefined,
      });

      expect(result).toBeUndefined();
    });

    it('returns correct amount from txMeta if bridgeHistoryItem is undefined', () => {
      const result = getBridgeAmountSentFormatted({
        bridgeHistoryItem: undefined,
        locale: 'en-US',
        txMeta: {
          ...mockBridgeTxData.transactionGroup.primaryTransaction,
          amounts: {
            from: {
              amount: BigInt('1000000'),
              token: {
                decimals: 6,
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'USDC',
                chainId: '0x1',
              },
            },
          },
        } as never,
      });

      expect(result).toBe('1');
    });

    it('returns undefined if decimals are undefined', () => {
      const result = getBridgeAmountSentFormatted({
        bridgeHistoryItem: undefined,
        locale: 'en-US',
        txMeta: {
          ...mockBridgeTxData.transactionGroup.primaryTransaction,
          amounts: {
            from: {
              amount: BigInt('1000000'),
              token: {
                decimals: 0,
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'USDC',
                chainId: '0x1',
              },
            },
          },
        } as never,
      });

      expect(result).toBeUndefined();
    });
  });
});
