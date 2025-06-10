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
import { JsonRpcRequest } from '@metamask/utils';
import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AtomicCapabilityStatus,
  EIP5792Messenger,
  getCallsStatus,
  getCapabilities,
  processSendCalls,
} from './eip5792';

const CHAIN_ID_MOCK = '0x123';
const CHAIN_ID_2_MOCK = '0xabc';
const BATCH_ID_MOCK = '0xf3472db2a4134607a17213b7e9ca26e3';
const NETWORK_CLIENT_ID_MOCK = 'test-client';
const FROM_MOCK = '0xabc123';
const FROM_MOCK_HARDWARE = '0xdef456';
const FROM_MOCK_SIMPLE = '0x789abc';
const ORIGIN_MOCK = 'test.com';
const DELEGATION_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';

const SEND_CALLS_MOCK: SendCalls = {
  version: '2.0.0',
  calls: [{ to: '0x123' }],
  chainId: CHAIN_ID_MOCK,
  from: FROM_MOCK,
  atomicRequired: true,
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
  batchId: BATCH_ID_MOCK,
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
  const addTransactionBatchMock: jest.MockedFn<
    TransactionController['addTransactionBatch']
  > = jest.fn();

  const getNetworkClientByIdMock: jest.MockedFn<
    NetworkControllerGetNetworkClientByIdAction['handler']
  > = jest.fn();

  const getSelectedAccountMock: jest.MockedFn<
    AccountsControllerGetSelectedAccountAction['handler']
  > = jest.fn();

  const getTransactionControllerStateMock: jest.MockedFn<
    TransactionControllerGetStateAction['handler']
  > = jest.fn();

  const isAtomicBatchSupportedMock: jest.MockedFn<
    TransactionController['isAtomicBatchSupported']
  > = jest.fn();

  const validateSecurityMock: jest.MockedFunction<
    Parameters<typeof processSendCalls>[0]['validateSecurity']
  > = jest.fn();

  const getDismissSmartAccountSuggestionEnabledMock: jest.MockedFn<
    () => boolean
  > = jest.fn();

  const getAccountsStateMock: jest.MockedFn<
    AccountsControllerGetStateAction['handler']
  > = jest.fn();

  let messenger: EIP5792Messenger;

  const sendCallsHooks = {
    addTransactionBatch: addTransactionBatchMock,
    getDismissSmartAccountSuggestionEnabled:
      getDismissSmartAccountSuggestionEnabledMock,
    isAtomicBatchSupported: isAtomicBatchSupportedMock,
    validateSecurity: validateSecurityMock,
  };

  const getCapabilitiesHooks = {
    getDismissSmartAccountSuggestionEnabled:
      getDismissSmartAccountSuggestionEnabledMock,
    isAtomicBatchSupported: isAtomicBatchSupportedMock,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    messenger = new Messenger();

    messenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      getNetworkClientByIdMock,
    );

    messenger.registerActionHandler(
      'TransactionController:getState',
      getTransactionControllerStateMock,
    );

    messenger.registerActionHandler(
      'AccountsController:getSelectedAccount',
      getSelectedAccountMock,
    );

    messenger.registerActionHandler(
      'AccountsController:getState',
      getAccountsStateMock,
    );

    getNetworkClientByIdMock.mockReturnValue({
      configuration: {
        chainId: CHAIN_ID_MOCK,
      },
    } as unknown as AutoManagedNetworkClient<CustomNetworkClientConfiguration>);

    addTransactionBatchMock.mockResolvedValue({
      batchId: BATCH_ID_MOCK,
    });

    getDismissSmartAccountSuggestionEnabledMock.mockReturnValue(false);

    isAtomicBatchSupportedMock.mockResolvedValue([
      {
        chainId: CHAIN_ID_MOCK,
        delegationAddress: undefined,
        isSupported: false,
        upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
      },
    ]);

    getAccountsStateMock.mockReturnValue({
      internalAccounts: {
        accounts: {
          [FROM_MOCK]: {
            address: FROM_MOCK,
            metadata: {
              keyring: {
                type: KeyringTypes.hd,
              },
            },
          },
          [FROM_MOCK_HARDWARE]: {
            address: FROM_MOCK_HARDWARE,
            metadata: {
              keyring: {
                type: KeyringTypes.ledger,
              },
            },
          },
          [FROM_MOCK_SIMPLE]: {
            address: FROM_MOCK_SIMPLE,
            metadata: {
              keyring: {
                type: KeyringTypes.simple,
              },
            },
          },
        },
      },
    } as unknown as AccountsControllerState);
  });

  describe('processSendCalls', () => {
    it('calls adds transaction batch hook', async () => {
      await processSendCalls(
        sendCallsHooks,
        messenger,
        SEND_CALLS_MOCK,
        REQUEST_MOCK,
      );

      expect(addTransactionBatchMock).toHaveBeenCalledWith({
        from: SEND_CALLS_MOCK.from,
        networkClientId: NETWORK_CLIENT_ID_MOCK,
        origin: ORIGIN_MOCK,
        securityAlertId: expect.any(String),
        transactions: [{ params: SEND_CALLS_MOCK.calls[0] }],
        validateSecurity: expect.any(Function),
      });
    });

    it('calls adds transaction batch hook if simple keyring', async () => {
      await processSendCalls(
        sendCallsHooks,
        messenger,
        { ...SEND_CALLS_MOCK, from: FROM_MOCK_SIMPLE },
        REQUEST_MOCK,
      );

      expect(addTransactionBatchMock).toHaveBeenCalledTimes(1);
    });

    it('calls adds transaction batch hook with selected account if no from', async () => {
      getSelectedAccountMock.mockReturnValue({
        address: SEND_CALLS_MOCK.from,
      } as InternalAccount);

      await processSendCalls(
        sendCallsHooks,
        messenger,
        { ...SEND_CALLS_MOCK, from: undefined },
        REQUEST_MOCK,
      );

      expect(addTransactionBatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: SEND_CALLS_MOCK.from,
        }),
      );
    });

    it('returns batch ID from hook', async () => {
      expect(
        await processSendCalls(
          sendCallsHooks,
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).toStrictEqual({ id: BATCH_ID_MOCK });
    });

    it('throws if version not supported', async () => {
      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          { ...SEND_CALLS_MOCK, version: '1.0' },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(`Version not supported: Got 1.0, expected 2.0.0`);
    });

    it('throws if chain ID does not match network client', async () => {
      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          { ...SEND_CALLS_MOCK, chainId: CHAIN_ID_2_MOCK },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(
        `Chain ID must match the dApp selected network: Got ${CHAIN_ID_2_MOCK}, expected ${CHAIN_ID_MOCK}`,
      );
    });

    it('throws if user enabled preference to dismiss option to upgrade account', async () => {
      getDismissSmartAccountSuggestionEnabledMock.mockReturnValue(true);

      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).rejects.toThrow('EIP-7702 upgrade disabled by the user');
    });

    it('does not throw if user enabled preference to dismiss option to upgrade account if already upgraded', async () => {
      getDismissSmartAccountSuggestionEnabledMock.mockReturnValue(true);

      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: DELEGATION_ADDRESS_MOCK,
          isSupported: true,
        },
      ]);

      expect(
        await processSendCalls(
          sendCallsHooks,
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).toBeDefined();
    });

    it('throws if top-level capability is required', async () => {
      await expect(
        processSendCalls(
          sendCallsHooks,
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
          sendCallsHooks,
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

    it('throws if chain does not support EIP-7702', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([]);

      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          SEND_CALLS_MOCK,
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(`EIP-7702 not supported on chain: ${CHAIN_ID_MOCK}`);
    });

    it('throws if keyring type not supported', async () => {
      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          { ...SEND_CALLS_MOCK, from: FROM_MOCK_HARDWARE },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(`EIP-7702 upgrade not supported on account`);
    });

    it('throws if keyring type not found', async () => {
      await expect(
        processSendCalls(
          sendCallsHooks,
          messenger,
          { ...SEND_CALLS_MOCK, from: '0x456' },
          REQUEST_MOCK,
        ),
      ).rejects.toThrow(
        `EIP-7702 upgrade not supported as account type is unknown`,
      );
    });
  });

  describe('getCallsStatus', () => {
    it('returns result using metadata from transaction controller', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [TRANSACTION_META_MOCK],
      } as unknown as TransactionControllerState);

      expect(getCallsStatus(messenger, BATCH_ID_MOCK)).toStrictEqual({
        version: '2.0.0',
        id: BATCH_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
        atomic: true,
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

      const receiptResult = getCallsStatus(messenger, BATCH_ID_MOCK)
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

      const receiptLog = getCallsStatus(messenger, BATCH_ID_MOCK)?.receipts?.[0]
        ?.logs?.[0];

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

      expect(getCallsStatus(messenger, BATCH_ID_MOCK)?.status).toStrictEqual(
        GetCallsStatusCode.FAILED_OFFCHAIN,
      );
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

      expect(getCallsStatus(messenger, BATCH_ID_MOCK)?.status).toStrictEqual(
        GetCallsStatusCode.REVERTED,
      );
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

      expect(getCallsStatus(messenger, BATCH_ID_MOCK)?.status).toStrictEqual(
        GetCallsStatusCode.REVERTED,
      );
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

        expect(getCallsStatus(messenger, BATCH_ID_MOCK)?.status).toStrictEqual(
          GetCallsStatusCode.PENDING,
        );
      },
    );

    it('throws if no transactions found', () => {
      getTransactionControllerStateMock.mockReturnValueOnce({
        transactions: [],
      } as unknown as TransactionControllerState);

      expect(() => getCallsStatus(messenger, BATCH_ID_MOCK)).toThrow(
        `No matching bundle found`,
      );
    });
  });

  describe('getCapabilities', () => {
    it('includes atomic capability if already upgraded', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: DELEGATION_ADDRESS_MOCK,
          isSupported: true,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({
        [CHAIN_ID_MOCK]: {
          atomic: {
            status: AtomicCapabilityStatus.Supported,
          },
        },
      });
    });

    it('includes atomic capability if not yet upgraded', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({
        [CHAIN_ID_MOCK]: {
          atomic: {
            status: AtomicCapabilityStatus.Ready,
          },
        },
      });
    });

    it('includes atomic capability if not yet upgraded and simple keyring', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK_SIMPLE,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({
        [CHAIN_ID_MOCK]: {
          atomic: {
            status: AtomicCapabilityStatus.Ready,
          },
        },
      });
    });

    it('does not include atomic capability if chain not supported', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({});
    });

    it('does not include atomic capability if all upgrades disabled', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
        },
      ]);

      getDismissSmartAccountSuggestionEnabledMock.mockReturnValue(true);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({});
    });

    it('does not include atomic capability if no upgrade contract address', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: undefined,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({});
    });

    it('does not include atomic capability if keyring type not supported', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        FROM_MOCK_HARDWARE,
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({});
    });

    it('does not include atomic capability if keyring type not found', async () => {
      isAtomicBatchSupportedMock.mockResolvedValueOnce([
        {
          chainId: CHAIN_ID_MOCK,
          delegationAddress: undefined,
          isSupported: false,
          upgradeContractAddress: DELEGATION_ADDRESS_MOCK,
        },
      ]);

      const capabilities = await getCapabilities(
        getCapabilitiesHooks,
        messenger,
        '0x456',
        [CHAIN_ID_MOCK],
      );

      expect(capabilities).toStrictEqual({});
    });
  });
});
