import type { TransactionMeta } from '@metamask/transaction-controller';
import type {
  TransactionPayControllerState,
  TransactionPayQuote,
} from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import { buildMmPayRpcResult, watchMmPayRpcResult } from './result';
import type { MmPayRpcMessenger } from './types';

const ORIGIN = 'https://perps-terminal.metamask.com';
const REQUEST_ID = '42';
const TRANSACTION_ID = 'tx-1';
const DESTINATION_HASH = '0xdest';

const QUOTE = {
  strategy: 'relay',
  request: { sourceChainId: '0x2105', targetChainId: '0x539' },
} as unknown as TransactionPayQuote<Json>;

function createMessenger(transactions: TransactionMeta[] = []) {
  const handlers: Record<string, (payload: unknown) => void> = {};

  const messenger = {
    subscribe: jest.fn((event: string, handler: (payload: unknown) => void) => {
      handlers[event] = handler;
    }),
    unsubscribe: jest.fn((event: string) => {
      delete handlers[event];
    }),
    call: jest.fn(() => ({ transactions })),
  };

  return {
    messenger: messenger as unknown as MmPayRpcMessenger,
    mocks: messenger,
    emit: (event: string, payload: unknown) => handlers[event]?.(payload),
    handlers,
  };
}

function payState(transactionId: string, quotes: unknown[]) {
  return {
    transactionData: { [transactionId]: { quotes } },
  } as unknown as TransactionPayControllerState;
}

const addedMeta = (overrides: Partial<TransactionMeta> = {}) =>
  ({
    id: TRANSACTION_ID,
    origin: ORIGIN,
    requestId: REQUEST_ID,
    ...overrides,
  }) as TransactionMeta;

describe('watchMmPayRpcResult', () => {
  it('captures the quote of the request transaction while pending', () => {
    const { messenger, emit } = createMessenger();
    const watcher = watchMmPayRpcResult(messenger, {
      origin: ORIGIN,
      requestId: REQUEST_ID,
    });

    emit('TransactionController:unapprovedTransactionAdded', addedMeta());
    emit(
      'TransactionPayController:stateChange',
      payState(TRANSACTION_ID, [QUOTE]),
    );
    emit('TransactionPayController:stateChange', payState(TRANSACTION_ID, []));

    expect(watcher.buildResult(DESTINATION_HASH)).toStrictEqual({
      transactionId: TRANSACTION_ID,
      provider: 'relay',
      source: { chainId: '0x2105' },
      destination: { chainId: '0x539', hash: DESTINATION_HASH },
    });
  });

  it('ignores transactions from other requests', () => {
    const { messenger, emit } = createMessenger();
    const watcher = watchMmPayRpcResult(messenger, {
      origin: ORIGIN,
      requestId: REQUEST_ID,
    });

    emit(
      'TransactionController:unapprovedTransactionAdded',
      addedMeta({ id: 'other', requestId: '7' }),
    );
    emit(
      'TransactionController:unapprovedTransactionAdded',
      addedMeta({ id: 'other-origin', origin: 'https://other.example' }),
    );
    emit('TransactionPayController:stateChange', payState('other', [QUOTE]));

    expect(watcher.buildResult(DESTINATION_HASH)).toStrictEqual({
      source: {},
      destination: { hash: DESTINATION_HASH },
    });
  });

  it('reads the final transaction from state', () => {
    const finalMeta = addedMeta({
      metamaskPay: { sourceHash: '0xsource' },
    } as Partial<TransactionMeta>);
    const { messenger, emit } = createMessenger([finalMeta]);
    const watcher = watchMmPayRpcResult(messenger, {
      origin: ORIGIN,
      requestId: REQUEST_ID,
    });

    emit('TransactionController:unapprovedTransactionAdded', addedMeta());

    expect(watcher.buildResult(DESTINATION_HASH).source).toStrictEqual({
      hash: '0xsource',
    });
  });

  it('unsubscribes once when stopped', () => {
    const { messenger, mocks, handlers } = createMessenger();
    const watcher = watchMmPayRpcResult(messenger, {
      origin: ORIGIN,
      requestId: REQUEST_ID,
    });

    watcher.stop();
    watcher.stop();

    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
    expect(handlers).toStrictEqual({});
  });
});

describe('buildMmPayRpcResult', () => {
  it('omits the Relay 0x0 placeholder hash', () => {
    expect(
      buildMmPayRpcResult({
        hash: '0x0',
        transactionMeta: undefined,
        sides: {},
      }).destination,
    ).toStrictEqual({});
  });

  it('falls back to the transaction pay metadata without a quote', () => {
    expect(
      buildMmPayRpcResult({
        hash: DESTINATION_HASH,
        transactionMeta: addedMeta({
          metamaskPay: {
            strategy: 'relay',
            chainId: '0xa4b1',
            sourceHash: '0xsource',
          },
        } as Partial<TransactionMeta>),
        sides: {},
      }),
    ).toStrictEqual({
      transactionId: TRANSACTION_ID,
      provider: 'relay',
      source: { chainId: '0xa4b1', hash: '0xsource' },
      destination: { hash: DESTINATION_HASH },
    });
  });

  it('returns only empty sides when nothing is known', () => {
    expect(
      buildMmPayRpcResult({
        hash: undefined,
        transactionMeta: undefined,
        sides: {},
      }),
    ).toStrictEqual({ source: {}, destination: {} });
  });
});
