import {
  TransactionController,
  TransactionControllerGetStateAction,
  TransactionControllerState,
  TransactionStatus,
} from '@metamask/transaction-controller';
import {
  AutoManagedNetworkClient,
  CustomNetworkClientConfiguration,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import {
  GetCallsStatusCode,
  SendCalls,
  SendCallsParams,
} from '@metamask/eth-json-rpc-middleware';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';
import {
  EIP5792Messenger,
  getCallsStatus,
  getCapabilities,
  processSendCalls,
} from './eip5792';

const CHAIN_ID_MOCK = '0x123';
const CHAIN_ID_2_MOCK = '0xabc';
const BATCH_ID_STRING_MOCK = 'f3472db2-a413-4607-a172-13b7e9ca26e3';
const BATCH_ID_HEX_MOCK = '0xf3472db2a4134607a17213b7e9ca26e3';
const NETWORK_CLIENT_ID_MOCK = 'test-client';
const FROM_MOCK = '0xabc123';
const ORIGIN_MOCK = 'test.com';

const SEND_CALLS_MOCK: SendCalls = {
  version: '1.0',
  calls: [{ to: '0x123' }],
  chainId: CHAIN_ID_MOCK,
  from: FROM_MOCK,
};

const REQUEST_MOCK = {
  id: 1,
  jsonrpc: '2.0',
  method: 'wallet_sendCalls',
  networkClientId: NETWORK_CLIENT_ID_MOCK,
  origin: ORIGIN_MOCK,
  params: [SEND_CALLS_MOCK],
} as JsonRpcRequest<SendCallsParams> & { networkClientId: string };

const TRANSACTION_META_MOCK = {
  id: BATCH_ID_STRING_MOCK,
  chainId: CHAIN_ID_MOCK,
  status: TransactionStatus.confirmed,
  txReceipt: {
    blockHash: '0xabcd',
    blockNumber: '0x1234',
    gasUsed: '0x4321',
    logs: [
      {
        address: '0xa123',
        data: '0xb123',
        topics: ['0xc123'],
      },
      {
        address: '0xd123',
        data: '0xe123',
        topics: ['0xf123'],
      },
    ],
    status: '0x1',
    transactionHash: '0xcba',
  },
};

describe('EIP-5792', () => {
  let addTransactionBatchMock: jest.MockedFn<
    TransactionController['addTransactionBatch']
  >;

  let isAtomicBatchSupportedMock: jest.MockedFn<
    TransactionController['isAtomicBatchSupported']
  >;

  let getNetworkClientByIdMock: jest.MockedFn<
    NetworkControllerGetNetworkClientByIdAction['handler']
  >;

  let getTransactionControllerStateMock: jest.MockedFn<
    TransactionControllerGetStateAction['handler']
  >;

  let getDisabledAccountUpgradeChainsMock: jest.MockedFn<() => Hex[]>;

  let messenger: EIP5792Messenger;

  beforeEach(() => {
    jest.resetAllMocks();

    addTransactionBatchMock = jest.fn();
    isAtomicBatchSupportedMock = jest.fn();
    getTransactionControllerStateMock = jest.fn();
    getNetworkClientByIdMock = jest.fn();
    getDisabledAccountUpgradeChainsMock = jest.fn();

    messenger = new Messenger();

    messenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      getNetworkClientByIdMock,
    );

    messenger.registerActionHandler(
      'TransactionController:getState',
      getTransactionControllerStateMock,
    );

    getNetworkClientByIdMock.mockReturnValue({
      configuration: {
        chainId: CHAIN_ID_MOCK,
      },
    } as unknown as AutoManagedNetworkClient<CustomNetworkClientConfiguration>);

    addTransactionBatchMock.mockResolvedValue({
      batchId: BATCH_ID_STRING_MOCK,
    });
    getDisabledAccountUpgradeChainsMock.mockReturnValue([]);
  });

  describe('processSendCalls', () => {
    it('calls adds transaction batch hook', async () => {
      await processSendCalls(
        {
          addTransactionBatch: addTransactionBatchMock,
          getDisabledAccountUpgradeChains: getDisabledAccountUpgradeChainsMock,
        },
        messenger,
        SEND_CALLS_MOCK,
        REQUEST_MOCK,
      );

      expect(addTransactionBatchMock).toHaveBeenCalledWith({
        from: SEND_CALLS_MOCK.from,
        networkClientId: NETWORK_CLIENT_ID_MOCK,
        origin: ORIGIN_MOCK,
        transactions: [{ params: SEND_CALLS_MOCK.calls[0] }],
      });
    });

    it('returns batch ID from hook', async () => {
      expect(
        await processSendCalls(
          {
            addTransactionBatch: addTransactionBatchMock,
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
          },
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).toStrictEqual({ id: BATCH_ID_HEX_MOCK });
    });

    it('throws if chain ID does not match network client', async () => {
      await expect(
        processSendCalls(
          {
            addTransactionBatch: addTransactionBatchMock,
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
          },
          messenger,
          { ...SEND_CALLS_MOCK, chainId: CHAIN_ID_2_MOCK },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(
        `Chain ID must match the dApp selected network: Got ${CHAIN_ID_2_MOCK}, expected ${CHAIN_ID_MOCK}`,
      );
    });

    it('throws if disabled preference for chain', async () => {
      getDisabledAccountUpgradeChainsMock.mockReturnValue([CHAIN_ID_MOCK]);

      await expect(
        processSendCalls(
          {
            addTransactionBatch: addTransactionBatchMock,
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
          },
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(
        `EIP-5792 is not supported for this chain and account - Chain ID: ${CHAIN_ID_MOCK}, Account: ${SEND_CALLS_MOCK.from}`,
      );
    });

    it('throws if top-level capability is required', async () => {
      await expect(
        processSendCalls(
          {
            addTransactionBatch: addTransactionBatchMock,
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
          },
          messenger,
          {
            ...SEND_CALLS_MOCK,
            capabilities: {
              test: {},
              test2: { optional: true },
              test3: { optional: false },
            },
          },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow('Unsupported non-optional capabilities: test, test3');
    });

    it('throws if call capability is required', async () => {
      await expect(
        processSendCalls(
          {
            addTransactionBatch: addTransactionBatchMock,
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
          },
          messenger,
          {
            ...SEND_CALLS_MOCK,
            calls: [
              ...SEND_CALLS_MOCK.calls,
              {
                ...SEND_CALLS_MOCK.calls[0],
                capabilities: {
                  test: {},
                  test2: { optional: true },
                  test3: { optional: false },
                },
              },
            ],
          },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow('Unsupported non-optional capabilities: test, test3');
    });
  });

  describe('getCallsStatus', () => {
    it('returns result using metadata from transaction controller', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [TRANSACTION_META_MOCK],
      } as unknown as TransactionControllerState);

      expect(getCallsStatus(messenger, BATCH_ID_HEX_MOCK)).toStrictEqual({
        version: '1.0',
        id: BATCH_ID_HEX_MOCK,
        chainId: CHAIN_ID_MOCK,
        status: GetCallsStatusCode.CONFIRMED,
        receipts: [
          {
            blockNumber: TRANSACTION_META_MOCK.txReceipt.blockNumber,
            blockHash: TRANSACTION_META_MOCK.txReceipt.blockHash,
            gasUsed: TRANSACTION_META_MOCK.txReceipt.gasUsed,
            logs: TRANSACTION_META_MOCK.txReceipt.logs,
            status: TRANSACTION_META_MOCK.txReceipt.status,
            transactionHash: TRANSACTION_META_MOCK.txReceipt.transactionHash,
          },
        ],
      });
    });

    it('ignores additional properties in receipt', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            txReceipt: {
              ...TRANSACTION_META_MOCK.txReceipt,
              extra: 'data',
            },
          },
        ],
      } as unknown as TransactionControllerState);

      const receiptResult = getCallsStatus(messenger, BATCH_ID_HEX_MOCK)
        ?.receipts?.[0];

      expect(receiptResult).not.toHaveProperty('extra');
    });

    it('ignores additional properties in log', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            txReceipt: {
              ...TRANSACTION_META_MOCK.txReceipt,
              logs: [
                {
                  ...TRANSACTION_META_MOCK.txReceipt.logs[0],
                  extra: 'data',
                },
              ],
            },
          },
        ],
      } as unknown as TransactionControllerState);

      const receiptLog = getCallsStatus(messenger, BATCH_ID_HEX_MOCK)
        ?.receipts?.[0]?.logs?.[0];

      expect(receiptLog).not.toHaveProperty('extra');
    });

    it('returns failed status if transaction status is failed and no hash', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.failed,
            hash: undefined,
          },
        ],
      } as unknown as TransactionControllerState);

      expect(
        getCallsStatus(messenger, BATCH_ID_HEX_MOCK)?.status,
      ).toStrictEqual(GetCallsStatusCode.FAILED_OFFCHAIN);
    });

    it('returns reverted status if transaction status is failed and hash', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.failed,
            hash: '0x123',
          },
        ],
      } as unknown as TransactionControllerState);

      expect(
        getCallsStatus(messenger, BATCH_ID_HEX_MOCK)?.status,
      ).toStrictEqual(GetCallsStatusCode.REVERTED);
    });

    it('returns reverted status if transaction status is dropped', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.dropped,
          },
        ],
      } as unknown as TransactionControllerState);

      expect(
        getCallsStatus(messenger, BATCH_ID_HEX_MOCK)?.status,
      ).toStrictEqual(GetCallsStatusCode.REVERTED);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      TransactionStatus.approved,
      TransactionStatus.signed,
      TransactionStatus.submitted,
      TransactionStatus.unapproved,
    ])(
      'returns pending status if transaction status is %s',
      (status: TransactionStatus) => {
        getTransactionControllerStateMock.mockReturnValueOnce({
          transactions: [
            {
              ...TRANSACTION_META_MOCK,
              status,
            },
          ],
        } as unknown as TransactionControllerState);

        expect(
          getCallsStatus(messenger, BATCH_ID_HEX_MOCK)?.status,
        ).toStrictEqual(GetCallsStatusCode.PENDING);
      },
    );

    it('throws if no transactions found', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [],
      } as unknown as TransactionControllerState);

      expect(() => getCallsStatus(messenger, BATCH_ID_HEX_MOCK)).toThrow(
        `No calls found with id: ${BATCH_ID_HEX_MOCK}`,
      );
    });
  });

  describe('getCapabilities', () => {
    it('returns atomic batch capabilities using hook', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        CHAIN_ID_MOCK,
        CHAIN_ID_2_MOCK,
      ]);

      expect(
        await getCapabilities(
          {
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
            isAtomicBatchSupported: isAtomicBatchSupportedMock,
          },
          SEND_CALLS_MOCK.from,
        ),
      ).toStrictEqual({
        [CHAIN_ID_MOCK]: {
          atomicBatch: {
            supported: true,
          },
        },
        [CHAIN_ID_2_MOCK]: {
          atomicBatch: {
            supported: true,
          },
        },
      });
    });

    it('does not include chain if disabled in preferences', async () => {
      getDisabledAccountUpgradeChainsMock.mockReturnValue([CHAIN_ID_MOCK]);

      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        CHAIN_ID_MOCK,
        CHAIN_ID_2_MOCK,
      ]);

      expect(
        await getCapabilities(
          {
            getDisabledAccountUpgradeChains:
              getDisabledAccountUpgradeChainsMock,
            isAtomicBatchSupported: isAtomicBatchSupportedMock,
          },
          FROM_MOCK,
        ),
      ).toStrictEqual({
        [CHAIN_ID_2_MOCK]: {
          atomicBatch: {
            supported: true,
          },
        },
      });
    });
  });
});
