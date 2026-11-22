import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { MoneyPayMessenger } from './pay-context';

export const VAULT_CONFIG_MOCK = {
  chainId: '0x8f' as Hex,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae' as Hex,
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117' as Hex,
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B' as Hex,
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947' as Hex,
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA' as Hex,
};

export const MONEY_ACCOUNT_ADDRESS_MOCK =
  '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;

export const NETWORK_CLIENT_ID_MOCK = 'monad-network-client';

function createProviderMock(chainId: Hex = VAULT_CONFIG_MOCK.chainId) {
  return {
    request: jest.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_chainId') {
        return chainId;
      }
      if (method === 'net_version') {
        return String(parseInt(chainId, 16));
      }
      throw new Error(`Unexpected provider method: ${method}`);
    }),
  };
}

export type MessengerMockOptions = {
  /** Remote flags returned by `RemoteFeatureFlagController:getState`. */
  remoteFeatureFlags?: Record<string, unknown>;
  /** The money account, or undefined for "not created yet". */
  moneyAccountAddress?: Hex;
  /** Throw from `findNetworkClientIdByChainId` ("chain not configured"). */
  chainNotConfigured?: boolean;
  /** Extra handlers keyed by action type, merged over the defaults. */
  handlers?: Record<string, (...args: unknown[]) => unknown>;
};

/**
 * A `MoneyPayMessenger` whose `call` routes to per-action handlers.
 *
 * @param options - The options bag.
 * @returns The messenger mock.
 */
export function createMoneyPayMessengerMock(
  options: MessengerMockOptions = {},
) {
  const provider = createProviderMock();

  const remoteFeatureFlags = options.remoteFeatureFlags ?? {
    moneyAccountVaultConfig: VAULT_CONFIG_MOCK,
  };

  const handlers: Record<string, (...args: unknown[]) => unknown> = {
    'RemoteFeatureFlagController:getState': () => ({ remoteFeatureFlags }),
    'MoneyAccountController:getMoneyAccount': () =>
      'moneyAccountAddress' in options && !options.moneyAccountAddress
        ? undefined
        : {
            address: options.moneyAccountAddress ?? MONEY_ACCOUNT_ADDRESS_MOCK,
          },
    'NetworkController:findNetworkClientIdByChainId': () => {
      if (options.chainNotConfigured) {
        throw new Error('No network client for chain');
      }
      return NETWORK_CLIENT_ID_MOCK;
    },
    'NetworkController:getNetworkClientById': () => ({ provider }),
    ...options.handlers,
  };

  const call = jest.fn((actionType: string, ...args: unknown[]) => {
    const handler = handlers[actionType];
    if (!handler) {
      throw new Error(`Unexpected messenger action: ${actionType}`);
    }
    return handler(...args);
  });

  type TransactionAddedHandler = (transaction: TransactionMeta) => void;
  const subscribers = new Set<TransactionAddedHandler>();

  const subscribe = jest.fn(
    (_eventType: string, handler: TransactionAddedHandler) => {
      subscribers.add(handler);
    },
  );

  const unsubscribe = jest.fn(
    (_eventType: string, handler: TransactionAddedHandler) => {
      subscribers.delete(handler);
    },
  );

  return {
    messenger: { call, subscribe, unsubscribe } as unknown as MoneyPayMessenger,
    call,
    subscribe,
    unsubscribe,
    /**
     * Publishes `TransactionController:unapprovedTransactionAdded`.
     *
     * @param transaction - The transaction that was added.
     */
    emitUnapprovedTransactionAdded: (transaction: Partial<TransactionMeta>) => {
      for (const handler of [...subscribers]) {
        handler(transaction as TransactionMeta);
      }
    },
  };
}

/** The `addTransactionBatch` request the placeholder batches submit. */
export type BatchRequestMock = {
  batchId: Hex;
  requiredAssets?: { address: Hex; amount: Hex; standard: string }[];
  transactions: { params: { to: Hex; value: Hex }; type: TransactionType }[];
};

export type PlaceholderBatchMockOptions = MessengerMockOptions & {
  /** Id of the transaction the batch creates. */
  transactionId: string;
  /** Rejection from the batch, standing in for a failed submission. */
  batchError?: Error;
};

/**
 * A `MoneyPayMessenger` mock whose `addTransactionBatch` publishes
 * `unapprovedTransactionAdded` then stays pending, matching the EIP-7702
 * batch path that settles only after confirmation approval.
 *
 * @param options - The options bag.
 * @returns The messenger mock and the `addTransactionBatch` mock.
 */
export function createPlaceholderBatchMessengerMock(
  options: PlaceholderBatchMockOptions,
) {
  const { transactionId, batchError, ...messengerOptions } = options;
  const emitter: {
    emit?: (transaction: Partial<TransactionMeta>) => void;
  } = {};

  const addTransactionBatch = jest.fn(
    async ({ batchId }: BatchRequestMock): Promise<never> => {
      if (batchError) {
        throw batchError;
      }

      emitter.emit?.({ id: 'unrelated-transaction', batchId: '0xffff' });
      emitter.emit?.({
        id: transactionId,
        batchId: batchId.toLowerCase() as Hex,
      });

      return await new Promise<never>(() => undefined);
    },
  );

  const mock = createMoneyPayMessengerMock({
    ...messengerOptions,
    handlers: {
      'TransactionController:addTransactionBatch':
        addTransactionBatch as unknown as (...args: unknown[]) => unknown,
      ...messengerOptions.handlers,
    },
  });

  emitter.emit = mock.emitUnapprovedTransactionAdded;

  return { ...mock, addTransactionBatch };
}
