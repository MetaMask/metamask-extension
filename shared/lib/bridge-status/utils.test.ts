import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { type Transaction, TransactionStatus } from '@metamask/keyring-api';
import { isAsyncSwap, isBridgeComplete, isBridgeFailed } from './utils';

const createBridgeHistoryItem = ({
  srcChainId = '0x1',
  destChainId = '0xa',
  status = StatusTypes.PENDING,
  srcTxHash = '0xsource',
}: {
  srcChainId?: string;
  destChainId?: string;
  status?: StatusTypes;
  srcTxHash?: string;
} = {}): BridgeHistoryItem =>
  ({
    quote: {
      srcChainId,
      destChainId,
    },
    status: {
      srcChain: {
        txHash: srcTxHash,
      },
      status,
    },
  }) as unknown as BridgeHistoryItem;

const createTransaction = (status = TransactionStatus.Confirmed): Transaction =>
  ({ status }) as Transaction;

describe('bridge status utils', () => {
  it('treats cross-chain history as an async swap', () => {
    expect(isAsyncSwap(createBridgeHistoryItem())).toBe(true);
  });

  it('treats same-chain Tron history as an async swap', () => {
    expect(
      isAsyncSwap(
        createBridgeHistoryItem({
          srcChainId: 'tron:728126428',
          destChainId: 'tron:728126428',
        }),
      ),
    ).toBe(true);
  });

  it('does not treat same-chain non-Tron history as an async swap', () => {
    expect(
      isAsyncSwap(
        createBridgeHistoryItem({
          srcChainId: '0x1',
          destChainId: '0x1',
        }),
      ),
    ).toBe(false);
  });

  it('marks same-chain Tron async swaps as complete', () => {
    expect(
      isBridgeComplete(
        createBridgeHistoryItem({
          srcChainId: 'tron:728126428',
          destChainId: 'tron:728126428',
          status: StatusTypes.COMPLETE,
        }),
      ),
    ).toBe(true);
  });

  it('does not mark same-chain non-Tron history as complete', () => {
    expect(
      isBridgeComplete(
        createBridgeHistoryItem({
          srcChainId: '0x1',
          destChainId: '0x1',
          status: StatusTypes.COMPLETE,
        }),
      ),
    ).toBe(false);
  });

  it('marks same-chain Tron async swaps as failed', () => {
    expect(
      isBridgeFailed(
        createTransaction(),
        createBridgeHistoryItem({
          srcChainId: 'tron:728126428',
          destChainId: 'tron:728126428',
          status: StatusTypes.FAILED,
        }),
      ),
    ).toBe(true);
  });

  it('still treats failed source transactions as failed', () => {
    expect(
      isBridgeFailed(
        createTransaction(TransactionStatus.Failed),
        createBridgeHistoryItem({
          srcChainId: '0x1',
          destChainId: '0x1',
        }),
      ),
    ).toBe(true);
  });
});
