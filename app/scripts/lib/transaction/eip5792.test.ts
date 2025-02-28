import {
  TransactionController,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { NetworkController } from '@metamask/network-controller';
import { SendCalls, SendCallsParams } from '@metamask/eth-json-rpc-middleware';
import { JsonRpcRequest } from '@metamask/utils';
import {
  getCapabilities,
  getTransactionReceiptsByBatchId,
  processSendCalls,
} from './eip5792';

const CHAIN_ID_MOCK = '0x123';
const CHAIN_ID_2_MOCK = '0xabc';
const BATCH_ID_MOCK = '123-456';
const NETWORK_CLIENT_ID_MOCK = 'test-client';

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
  from: '0x123',
};

const REQUEST_MOCK = {
  id: 1,
  jsonrpc: '2.0',
  method: 'wallet_sendCalls',
  networkClientId: NETWORK_CLIENT_ID_MOCK,
  params: [SEND_CALLS_MOCK],
} as JsonRpcRequest<SendCallsParams> & { networkClientId: string };

function buildTransactionControllerMock() {
  return {
    addTransactionBatch: jest
      .fn()
      .mockResolvedValueOnce({ batchId: BATCH_ID_MOCK }),
    isAtomicBatchSupported: jest.fn(),
    state: {},
  } as unknown as jest.Mocked<TransactionController>;
}

function buildNetworkControllerMock() {
  return {
    getNetworkClientById: jest.fn().mockReturnValue({
      configuration: {
        chainId: CHAIN_ID_MOCK,
      },
    }),
  } as unknown as jest.Mocked<NetworkController>;
}

describe('EIP-5792', () => {
  let transactionControllerMock: jest.Mocked<TransactionController>;
  let networkControllerMock: jest.Mocked<NetworkController>;

  beforeEach(() => {
    jest.resetAllMocks();
    transactionControllerMock = buildTransactionControllerMock();
    networkControllerMock = buildNetworkControllerMock();
  });

  describe('processSendCalls', () => {
    it('adds transaction batch to transaction controller', async () => {
      await processSendCalls(
        transactionControllerMock,
        networkControllerMock,
        SEND_CALLS_MOCK,
        REQUEST_MOCK,
      );

      expect(
        transactionControllerMock.addTransactionBatch,
      ).toHaveBeenCalledWith({
        from: SEND_CALLS_MOCK.from,
        networkClientId: NETWORK_CLIENT_ID_MOCK,
        transactions: [{ params: SEND_CALLS_MOCK.calls[0] }],
      });
    });

    it('returns batch ID from transaction controller', async () => {
      expect(
        await processSendCalls(
          transactionControllerMock,
          networkControllerMock,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).toBe(BATCH_ID_MOCK);
    });

    it('throws if chain ID does not match network client', async () => {
      await expect(
        processSendCalls(
          transactionControllerMock,
          networkControllerMock,
          { ...SEND_CALLS_MOCK, chainId: CHAIN_ID_2_MOCK },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(
        `Chain ID must match the dApp selected network: Got ${CHAIN_ID_2_MOCK}, expected ${CHAIN_ID_MOCK}`,
      );
    });
  });

  describe('getTransactionReceiptsByBatchId', () => {
    it('returns transaction receipts from transaction controller with matching ID', () => {
      transactionControllerMock.state.transactions = [
        { id: BATCH_ID_MOCK, txReceipt: RECEIPT_MOCK },
        { id: '456-789', txReceipt: {} },
        { id: BATCH_ID_MOCK, txReceipt: RECEIPT_2_MOCK },
      ] as TransactionMeta[];

      expect(
        getTransactionReceiptsByBatchId(
          transactionControllerMock,
          BATCH_ID_MOCK,
        ),
      ).toStrictEqual([RECEIPT_MOCK, RECEIPT_2_MOCK]);
    });
  });

  describe('getCapabilities', () => {
    it('returns atomic batch capabilities using transaction controller', async () => {
      transactionControllerMock.isAtomicBatchSupported.mockResolvedValueOnce([
        CHAIN_ID_MOCK,
        CHAIN_ID_2_MOCK,
      ]);

      expect(
        await getCapabilities(transactionControllerMock, '0x123'),
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
  });
});
