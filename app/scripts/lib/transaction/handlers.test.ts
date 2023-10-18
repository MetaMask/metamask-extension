import { safelyExecute } from '@metamask/controller-utils';
import * as handlers from './handlers';
import {
  type TransactionEventRequest,
  type TransactionEventPayload,
} from './handlers';
import * as metrics from './metrics';

jest.mock('@metamask/controller-utils', () => ({
  safelyExecute: jest.fn().mockImplementation(async (fn) => await fn()),
}));

jest.mock('./metrics', () => ({
  onTransactionAdded: jest.fn().mockResolvedValue({}),
  onTransactionApproved: jest.fn().mockResolvedValue({}),
  onTransactionFinalized: jest.fn().mockResolvedValue({}),
  onTransactionDropped: jest.fn().mockResolvedValue({}),
  onTransactionRejected: jest.fn().mockResolvedValue({}),
  onTransactionSubmitted: jest.fn().mockResolvedValue({}),
  onPostTransactionBalanceUpdate: jest.fn().mockResolvedValue({}),
}));

const mockTransactionEventRequest = {} as TransactionEventRequest;
const mockTransactionEventPayload = {} as TransactionEventPayload;

describe('Transaction handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['handleTransactionAdded', 'onTransactionAdded'],
    ['handleTransactionApproved', 'onTransactionApproved'],
    ['handleTransactionFinalized', 'onTransactionFinalized'],
    ['handleTransactionDropped', 'onTransactionDropped'],
    ['handleTransactionRejected', 'onTransactionRejected'],
    ['handleTransactionSubmitted', 'onTransactionSubmitted'],
    ['handlePostTransactionBalanceUpdate', 'onPostTransactionBalanceUpdate'],
  ])('should safely call metrics.%s', async (handlerFn, metricsHandlerFn) => {
    await handlers[handlerFn](
      mockTransactionEventRequest,
      mockTransactionEventPayload,
    );

    expect(safelyExecute).toBeCalledTimes(1);
    expect(metrics[metricsHandlerFn]).toBeCalledTimes(1);
    expect(metrics[metricsHandlerFn]).toBeCalledWith(
      mockTransactionEventRequest,
      mockTransactionEventPayload,
    );
  });
});
