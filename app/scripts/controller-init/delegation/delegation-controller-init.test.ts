import { DelegationController } from '@metamask/delegation-controller';
import { Messenger } from '@metamask/base-controller';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { type Hex } from '../../../../shared/lib/delegation/utils';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import {
  type DelegationControllerMessenger,
  type DelegationControllerInitMessenger,
  getDelegationControllerMessenger,
  getDelegationControllerInitMessenger,
} from '../messengers/delegation/delegation-controller-messenger';
import {
  DelegationControllerInit,
  awaitDeleteDelegationEntry,
} from './delegation-controller-init';

jest.mock('@metamask/delegation-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    DelegationControllerMessenger,
    DelegationControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();
  const controllerMessenger = getDelegationControllerMessenger(
    baseControllerMessenger,
  );
  const initMessenger = getDelegationControllerInitMessenger(
    baseControllerMessenger,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger,
    initMessenger,
  };
}

describe('DelegationControllerInit', () => {
  const DelegationControllerClassMock = jest.mocked(DelegationController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(DelegationControllerInit(requestMock).controller).toBeInstanceOf(
      DelegationController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DelegationControllerInit(requestMock);

    expect(DelegationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.DelegationController,
      hashDelegation: expect.any(Function),
      getDelegationEnvironment: expect.any(Function),
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = DelegationControllerInit(requestMock);

    expect(result.api).toEqual({
      signDelegation: expect.any(Function),
      storeDelegationEntry: expect.any(Function),
      listDelegationEntries: expect.any(Function),
      getDelegationEntry: expect.any(Function),
      getDelegationEntryChain: expect.any(Function),
      deleteDelegationEntry: expect.any(Function),
      awaitDeleteDelegationEntry: expect.any(Function),
    });
  });
});

describe('DelegationController:awaitDeleteDelegationEntry', () => {
  const mockHash = '0x123' as Hex;
  let controller: DelegationController;
  let initMessenger: DelegationControllerInitMessenger;
  let subscribeHandler:
    | ((event: { transactionMeta: TransactionMeta }) => void)
    | undefined;

  const createMockTransactionMeta = (
    overrides: Partial<TransactionMeta>,
  ): TransactionMeta => ({
    id: '123',
    chainId: '0x1',
    networkClientId: '1',
    time: Date.now(),
    txParams: {
      from: '0x123',
      to: '0x456',
      value: '0x0',
      data: '0x',
    },
    status: TransactionStatus.unapproved,
    type: TransactionType.contractInteraction,
    ...overrides,
  });

  beforeEach(() => {
    controller = new DelegationController({
      messenger: getDelegationControllerMessenger(new Messenger()),
      state: {},
      hashDelegation: () => '0x123' as Hex,
      getDelegationEnvironment: () => ({
        DelegationManager: '0x123',
        EntryPoint: '0x456',
        SimpleFactory: '0x789',
        implementations: {},
        caveatEnforcers: {},
      }),
    });

    // Create a mock messenger with jest.fn() for subscribe and unsubscribe
    initMessenger = {
      subscribe: jest.fn((_event, handler) => {
        subscribeHandler = handler;
      }),
      unsubscribe: jest.fn(),
    } as unknown as DelegationControllerInitMessenger;
  });

  it('subscribes to transaction status updates', () => {
    const txMeta = createMockTransactionMeta({});

    awaitDeleteDelegationEntry(controller, initMessenger, {
      hash: mockHash,
      txMeta,
    });

    expect(initMessenger.subscribe).toHaveBeenCalledWith(
      'TransactionController:transactionStatusUpdated',
      expect.any(Function),
    );
  });

  it('deletes delegation when transaction is confirmed', () => {
    const txMeta = createMockTransactionMeta({});
    const deleteSpy = jest.spyOn(controller, 'delete');

    awaitDeleteDelegationEntry(controller, initMessenger, {
      hash: mockHash,
      txMeta,
    });

    expect(subscribeHandler).toBeDefined();
    subscribeHandler?.({
      transactionMeta: createMockTransactionMeta({
        status: TransactionStatus.confirmed,
      }),
    });

    expect(deleteSpy).toHaveBeenCalledWith(mockHash);
    expect(initMessenger.unsubscribe).toHaveBeenCalled();
  });

  it('unsubscribes when transaction is dropped', () => {
    const txMeta = createMockTransactionMeta({});
    const deleteSpy = jest.spyOn(controller, 'delete');

    awaitDeleteDelegationEntry(controller, initMessenger, {
      hash: mockHash,
      txMeta,
    });

    expect(subscribeHandler).toBeDefined();
    subscribeHandler?.({
      transactionMeta: createMockTransactionMeta({
        status: TransactionStatus.dropped,
      }),
    });

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(initMessenger.unsubscribe).toHaveBeenCalled();
  });

  it('follows transaction chain when replaced', () => {
    const txMeta = createMockTransactionMeta({});
    const deleteSpy = jest.spyOn(controller, 'delete');

    awaitDeleteDelegationEntry(controller, initMessenger, {
      hash: mockHash,
      txMeta,
    });

    expect(subscribeHandler).toBeDefined();

    // Transaction gets replaced
    subscribeHandler?.({
      transactionMeta: createMockTransactionMeta({
        status: TransactionStatus.dropped,
        replacedById: '456',
      }),
    });

    // New transaction confirms
    subscribeHandler?.({
      transactionMeta: createMockTransactionMeta({
        id: '456',
        status: TransactionStatus.confirmed,
      }),
    });

    expect(deleteSpy).toHaveBeenCalledWith(mockHash);
    expect(initMessenger.unsubscribe).toHaveBeenCalled();
  });

  it('unsubscribes when transaction is cancelled', () => {
    const txMeta = createMockTransactionMeta({});
    const deleteSpy = jest.spyOn(controller, 'delete');

    awaitDeleteDelegationEntry(controller, initMessenger, {
      hash: mockHash,
      txMeta,
    });

    expect(subscribeHandler).toBeDefined();
    subscribeHandler?.({
      transactionMeta: createMockTransactionMeta({
        type: TransactionType.cancel,
      }),
    });

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(initMessenger.unsubscribe).toHaveBeenCalled();
  });
});
