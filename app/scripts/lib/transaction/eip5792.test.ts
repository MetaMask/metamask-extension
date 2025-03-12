import {
  TransactionController,
  TransactionControllerGetStateAction,
  TransactionControllerState,
} from '@metamask/transaction-controller';
import {
  AutoManagedNetworkClient,
  CustomNetworkClientConfiguration,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import { SendCalls, SendCallsParams } from '@metamask/eth-json-rpc-middleware';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';
import {
  EIP5792Messenger,
  getCapabilities,
  getTransactionReceiptsByBatchId,
  processSendCalls,
} from './eip5792';

const CHAIN_ID_MOCK = '0x123';
const CHAIN_ID_2_MOCK = '0xabc';
const BATCH_ID_MOCK = '123-456';
const NETWORK_CLIENT_ID_MOCK = 'test-client';
const FROM_MOCK = '0xabc123';
const ORIGIN_MOCK = 'test.com';

const RECEIPT_MOCK = {
  status: '0x1',
  transactionHash: '0x123',
};

const RECEIPT_2_MOCK = {
  status: '0x0',
  transactionHash: '0x123456',
};

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

    addTransactionBatchMock.mockResolvedValue({ batchId: BATCH_ID_MOCK });
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
      ).toBe(BATCH_ID_MOCK);
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
  });

  describe('getTransactionReceiptsByBatchId', () => {
    it('returns transaction receipts from transaction controller with matching ID', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [
          { id: BATCH_ID_MOCK, txReceipt: RECEIPT_MOCK },
          { id: '456-789', txReceipt: {} },
          { id: BATCH_ID_MOCK, txReceipt: RECEIPT_2_MOCK },
        ],
      } as TransactionControllerState);

      expect(
        getTransactionReceiptsByBatchId(messenger, BATCH_ID_MOCK),
      ).toStrictEqual([RECEIPT_MOCK, RECEIPT_2_MOCK]);
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
