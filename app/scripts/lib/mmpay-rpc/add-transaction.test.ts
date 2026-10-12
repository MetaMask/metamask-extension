/* eslint-disable @typescript-eslint/naming-convention */
import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { errorCodes } from '@metamask/rpc-errors';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { addDappTransaction } from '../transaction/util';
import { addMmPayRpcTransaction } from './add-transaction';
import { MMPAY_RPC_TYPE_REGISTRIES } from './registry';
import type {
  MmPayRpcBuiltTransaction,
  MmPayRpcMessenger,
  MmPayRpcRequest,
  MmPayRpcTypeRegistry,
} from './types';

jest.mock('../transaction/util', () => ({
  addDappTransaction: jest.fn(),
}));

const ORIGIN = 'https://perps-terminal.metamask.com';
const FROM = '0x1234567890123456789012345678901234567890' as Hex;
const CHAIN_ID = '0xa4b1' as Hex;
const NETWORK_CLIENT_ID = 'arbitrum';
const HASH = '0xhash';
const ACCOUNT = { id: 'account-1', address: FROM };
const ACCOUNTS = [ACCOUNT];
const TRANSACTION_PARAMS = { from: FROM, to: '0xto' as Hex, data: '0x' as Hex };

const ALLOW_DEPOSIT_FLAGS = {
  confirmations_pay_rpc: {
    allowedTypes: ['perpsDeposit'],
    dapps: { [ORIGIN]: { allowedTypes: ['perpsDeposit'] } },
  },
};

const addDappTransactionMock = jest.mocked(addDappTransaction);

function createTypeRegistry() {
  return {
    type: TransactionType.perpsDeposit,
    validatePayParams: jest.fn((payParams: unknown) => ({ parsed: payParams })),
    assertPreconditions: jest.fn(),
    build: jest.fn(
      (_context: {
        from: Hex;
        payParams: unknown;
      }): MmPayRpcBuiltTransaction => ({
        chainId: CHAIN_ID,
        transactionParams: TRANSACTION_PARAMS,
        type: TransactionType.perpsDeposit,
        skipInitialGasEstimate: true,
      }),
    ),
  } satisfies MmPayRpcTypeRegistry;
}

function createMessenger({
  remoteFeatureFlags = ALLOW_DEPOSIT_FLAGS as Record<string, unknown>,
  findNetworkClientId = jest.fn(() => NETWORK_CLIENT_ID),
  account = ACCOUNT as typeof ACCOUNT | null,
  configuredChainIds = [CHAIN_ID] as Hex[],
  addNetwork = jest.fn(),
} = {}) {
  const call = jest.fn((action: string, ...args: unknown[]) => {
    switch (action) {
      case 'NetworkController:getState':
        return {
          networkConfigurationsByChainId: Object.fromEntries(
            configuredChainIds.map((chainId) => [chainId, {}]),
          ),
        };
      case 'LegacyBackgroundApiService:addNetwork':
        return addNetwork(...args);
      case 'RemoteFeatureFlagController:getState':
        return { remoteFeatureFlags };
      case 'NetworkController:findNetworkClientIdByChainId':
        return findNetworkClientId();
      case 'AccountsController:getAccountByAddress':
        return account ?? undefined;
      case 'AccountsController:listAccounts':
        return ACCOUNTS;
      case 'TransactionController:getState':
        return { transactions: [] };
      default:
        throw new Error(`Unexpected action ${action}`);
    }
  });

  return {
    call,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  } as unknown as jest.Mocked<MmPayRpcMessenger> & { call: typeof call };
}

function createRequest(params: unknown): MmPayRpcRequest {
  return {
    jsonrpc: '2.0',
    id: 42,
    method: 'wallet_mmPay',
    origin: ORIGIN,
    params: params as MmPayRpcRequest['params'],
    securityAlertResponse: undefined,
    traceContext: { trace: true },
  };
}

async function run({
  params = [{ type: 'perpsDeposit', from: FROM, payParams: { amount: '1' } }],
  messenger = createMessenger(),
  permittedAccounts = [FROM],
}: {
  params?: unknown;
  messenger?: MmPayRpcMessenger;
  permittedAccounts?: string[];
} = {}) {
  return addMmPayRpcTransaction({
    messenger,
    getPermittedAccounts: () => permittedAccounts,
    securityAlertsEnabled: true,
    origin: ORIGIN,
    req: createRequest(params),
  });
}

async function expectRpcError(promise: Promise<unknown>, code: number) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe('addMmPayRpcTransaction', () => {
  const registeredTypes = { ...MMPAY_RPC_TYPE_REGISTRIES };
  let typeRegistry: ReturnType<typeof createTypeRegistry>;

  beforeEach(() => {
    typeRegistry = createTypeRegistry();
    MMPAY_RPC_TYPE_REGISTRIES.perpsDeposit = typeRegistry;
    addDappTransactionMock.mockResolvedValue(HASH);
  });

  afterEach(() => {
    Object.assign(MMPAY_RPC_TYPE_REGISTRIES, registeredTypes);
    jest.clearAllMocks();
  });

  describe('request validation', () => {
    it('rejects invalid top-level params before any other check', async () => {
      const messenger = createMessenger();

      await expectRpcError(
        run({ params: [{ type: 'perpsDeposit' }], messenger }),
        errorCodes.rpc.invalidParams,
      );
      expect(messenger.call).not.toHaveBeenCalled();
    });
  });

  describe('flag gate', () => {
    it('rejects a type the flag does not allow for the origin', async () => {
      await expectRpcError(
        run({ messenger: createMessenger({ remoteFeatureFlags: {} }) }),
        errorCodes.rpc.methodNotFound,
      );
      expect(typeRegistry.validatePayParams).not.toHaveBeenCalled();
    });

    it('rejects perpsWithdraw when the in-wallet withdraw flag is off', async () => {
      const messenger = createMessenger({
        remoteFeatureFlags: {
          confirmations_pay_rpc: {
            allowedTypes: ['perpsWithdraw'],
            dapps: { [ORIGIN]: { allowedTypes: ['perpsWithdraw'] } },
          },
          confirmations_pay_post_quote: { default: { enabled: false } },
        },
      });

      await expectRpcError(
        run({ params: [{ type: 'perpsWithdraw', from: FROM }], messenger }),
        errorCodes.rpc.methodNotFound,
      );
    });

    it('rejects an allowed type with no type registry', async () => {
      delete MMPAY_RPC_TYPE_REGISTRIES.perpsDeposit;

      await expectRpcError(run(), errorCodes.rpc.methodNotFound);
    });

    it('rejects an unknown type before validating payParams', async () => {
      await expectRpcError(
        run({
          params: [{ type: 'somethingElse', from: FROM, payParams: 'bad' }],
        }),
        errorCodes.rpc.methodNotFound,
      );
      expect(typeRegistry.validatePayParams).not.toHaveBeenCalled();
    });

    it('does not treat inherited object keys as registered types', async () => {
      await expectRpcError(
        run({ params: [{ type: 'toString', from: FROM }] }),
        errorCodes.rpc.methodNotFound,
      );
    });
  });

  describe('account gate', () => {
    it('rejects an origin with no permitted accounts', async () => {
      await expectRpcError(
        run({ permittedAccounts: [] }),
        errorCodes.provider.unauthorized,
      );
      expect(typeRegistry.validatePayParams).not.toHaveBeenCalled();
    });

    it('rejects a from address that is not permitted', async () => {
      await expectRpcError(
        run({
          permittedAccounts: ['0x0000000000000000000000000000000000000001'],
        }),
        errorCodes.provider.unauthorized,
      );
    });

    it('accepts a permitted from address with different casing', async () => {
      await run({
        permittedAccounts: [FROM.toUpperCase().replace('0X', '0x')],
      });

      expect(addDappTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a permitted address with no internal account', async () => {
      await expectRpcError(
        run({ messenger: createMessenger({ account: null }) }),
        errorCodes.provider.unauthorized,
      );
    });
  });

  describe('type registry', () => {
    it('validates payParams, checks preconditions and builds the transaction', async () => {
      const messenger = createMessenger();

      await run({ messenger });

      expect(typeRegistry.validatePayParams).toHaveBeenCalledWith({
        amount: '1',
      });
      expect(typeRegistry.assertPreconditions).toHaveBeenCalledWith({
        from: FROM,
        messenger,
      });
      expect(typeRegistry.build).toHaveBeenCalledWith({
        from: FROM,
        payParams: { parsed: { amount: '1' } },
      });
    });

    it('propagates payParams errors from the type registry', async () => {
      const error = new Error('bad payParams');
      typeRegistry.validatePayParams.mockImplementation(() => {
        throw error;
      });

      await expect(run()).rejects.toBe(error);
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });

    it('propagates precondition errors from the type registry', async () => {
      const error = new Error('not eligible');
      typeRegistry.assertPreconditions.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });
  });

  describe('transaction', () => {
    it('adds a dApp transaction for the requesting origin', async () => {
      const messenger = createMessenger();

      await run({ messenger });

      expect(addDappTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          messenger,
          internalAccounts: ACCOUNTS,
          selectedAccount: ACCOUNT,
          networkClientId: NETWORK_CLIENT_ID,
          chainId: CHAIN_ID,
          transactionParams: TRANSACTION_PARAMS,
          securityAlertsEnabled: true,
          transactionOptions: {
            type: TransactionType.perpsDeposit,
            skipInitialGasEstimate: true,
          },
        }),
      );

      const { requestContext, dappRequest } =
        addDappTransactionMock.mock.calls[0][0];
      expect(requestContext).toBeInstanceOf(MiddlewareContext);
      expect(requestContext.get('origin')).toBe(ORIGIN);
      expect(requestContext.get('traceContext')).toStrictEqual({ trace: true });
      expect(dappRequest.id).toBe(42);
    });

    it('adds the chain from the featured networks when missing', async () => {
      const addNetwork = jest.fn();
      const messenger = createMessenger({ configuredChainIds: [], addNetwork });

      await run({ messenger });

      expect(addNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: CHAIN_ID }),
        { setActive: false },
      );
      expect(addDappTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('does not add the chain when it is configured', async () => {
      const addNetwork = jest.fn();

      await run({ messenger: createMessenger({ addNetwork }) });

      expect(addNetwork).not.toHaveBeenCalled();
    });

    it('rejects when the chain cannot be added', async () => {
      const messenger = createMessenger({
        configuredChainIds: [],
        addNetwork: jest.fn().mockRejectedValue(new Error('failed')),
      });

      await expectRpcError(run({ messenger }), errorCodes.rpc.internal);
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects when no network client exists for the chain', async () => {
      const messenger = createMessenger({
        findNetworkClientId: jest.fn(() => {
          throw new Error('Invalid chain ID');
        }),
      });

      await expectRpcError(run({ messenger }), errorCodes.rpc.internal);
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });

    it('propagates a user rejection', async () => {
      const rejection = Object.assign(new Error('User rejected'), {
        code: errorCodes.provider.userRejectedRequest,
      });
      addDappTransactionMock.mockRejectedValue(rejection);

      await expect(run()).rejects.toBe(rejection);
    });
  });

  describe('result', () => {
    it('returns the result with the destination hash', async () => {
      expect(await run()).toStrictEqual({
        source: {},
        destination: { hash: HASH },
      });
    });

    it('stops watching on success', async () => {
      const messenger = createMessenger();

      await run({ messenger });

      expect(messenger.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it('stops watching on error', async () => {
      const messenger = createMessenger();
      addDappTransactionMock.mockRejectedValue(new Error('failed'));

      await expect(run({ messenger })).rejects.toThrow('failed');
      expect(messenger.unsubscribe).toHaveBeenCalledTimes(2);
    });
  });
});
