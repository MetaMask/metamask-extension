/* eslint-disable @typescript-eslint/naming-convention */
import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { addDappTransaction } from '../transaction/util';
import { createWalletPayHooks, type WalletPayHooksMessenger } from './hooks';

jest.mock('../transaction/util', () => ({
  addDappTransaction: jest.fn(),
}));

jest.mock('../../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({
    remoteFeatureFlags: { confirmations_pay_rpc: { fromManifest: true } },
  }),
}));

const ORIGIN = 'https://perps-terminal.metamask.com';
const FROM = '0x1234567890123456789012345678901234567890' as Hex;
const ACCOUNT = { id: 'account-1', address: FROM };
const ACCOUNTS = [ACCOUNT];
const NETWORK_CLIENT_ID = 'arbitrum-mainnet';
const HASH = '0xhash';

const TRANSACTION = {
  chainId: CHAIN_IDS.ARBITRUM,
  transactionParams: { from: FROM, to: '0xto' as Hex, data: '0x' as Hex },
  type: TransactionType.perpsDeposit,
  skipInitialGasEstimate: true,
};

const REQUEST = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_pay',
  origin: ORIGIN,
  params: [],
  traceContext: { trace: true },
};

const addDappTransactionMock = jest.mocked(addDappTransaction);

function createMessenger({
  configuredChainIds = [CHAIN_IDS.ARBITRUM] as Hex[],
  account = ACCOUNT as typeof ACCOUNT | null,
  addNetwork = jest.fn(),
} = {}) {
  const call = jest.fn((action: string, ...args: unknown[]) => {
    switch (action) {
      case 'RemoteFeatureFlagController:getState':
        return {
          remoteFeatureFlags: {
            confirmations_pay_rpc: { fromState: true },
            other: true,
          },
        };
      case 'AccountsController:getAccountByAddress':
        return account ?? undefined;
      case 'AccountsController:listAccounts':
        return ACCOUNTS;
      case 'NetworkController:getState':
        return {
          networkConfigurationsByChainId: Object.fromEntries(
            configuredChainIds.map((chainId) => [chainId, {}]),
          ),
        };
      case 'LegacyBackgroundApiService:addNetwork':
        return addNetwork(...args);
      case 'NetworkController:findNetworkClientIdByChainId':
        return NETWORK_CLIENT_ID;
      default:
        throw new Error(`Unexpected action ${action}`);
    }
  });

  return {
    messenger: { call } as unknown as WalletPayHooksMessenger,
    call,
    addNetwork,
  };
}

function createHooks(messenger: WalletPayHooksMessenger) {
  return createWalletPayHooks({
    messenger,
    getPermittedAccounts: () => [FROM],
    getSecurityAlertsEnabled: () => true,
  });
}

describe('createWalletPayHooks', () => {
  beforeEach(() => {
    addDappTransactionMock.mockResolvedValue(HASH);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the permitted accounts', async () => {
    const { messenger } = createMessenger();

    expect(
      await createHooks(messenger).getPermittedAccountsForOrigin(),
    ).toStrictEqual([FROM]);
  });

  it('returns remote feature flags with manifest overrides applied', () => {
    const { messenger } = createMessenger();

    expect(createHooks(messenger).getRemoteFeatureFlags()).toStrictEqual({
      confirmations_pay_rpc: { fromState: true, fromManifest: true },
      other: true,
    });
  });

  describe('addTransaction', () => {
    it('adds a dApp transaction for the request and returns its hash', async () => {
      const { messenger } = createMessenger();

      expect(
        await createHooks(messenger).addTransaction(TRANSACTION, REQUEST),
      ).toBe(HASH);

      expect(addDappTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          messenger,
          internalAccounts: ACCOUNTS,
          selectedAccount: ACCOUNT,
          networkClientId: NETWORK_CLIENT_ID,
          chainId: CHAIN_IDS.ARBITRUM,
          transactionParams: TRANSACTION.transactionParams,
          securityAlertsEnabled: true,
          dappRequest: REQUEST,
          transactionOptions: {
            type: TransactionType.perpsDeposit,
            skipInitialGasEstimate: true,
          },
        }),
      );

      const { requestContext } = addDappTransactionMock.mock.calls[0][0];
      expect(requestContext).toBeInstanceOf(MiddlewareContext);
      expect(requestContext.get('origin')).toBe(ORIGIN);
      expect(requestContext.get('traceContext')).toStrictEqual({ trace: true });
    });

    it('does not add the chain when it is configured', async () => {
      const { messenger, addNetwork } = createMessenger();

      await createHooks(messenger).addTransaction(TRANSACTION, REQUEST);

      expect(addNetwork).not.toHaveBeenCalled();
    });

    it('adds a missing featured chain without making it active', async () => {
      const { messenger, addNetwork } = createMessenger({
        configuredChainIds: [],
      });

      await createHooks(messenger).addTransaction(TRANSACTION, REQUEST);

      expect(addNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: CHAIN_IDS.ARBITRUM }),
        { setActive: false },
      );
      expect(addDappTransactionMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a missing chain that is not featured', async () => {
      const { messenger } = createMessenger({ configuredChainIds: [] });

      await expect(
        createHooks(messenger).addTransaction(
          { ...TRANSACTION, chainId: '0x539' },
          REQUEST,
        ),
      ).rejects.toThrow('Chain 0x539 is not a featured network');
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects when there is no account for from', async () => {
      const { messenger } = createMessenger({ account: null });

      await expect(
        createHooks(messenger).addTransaction(TRANSACTION, REQUEST),
      ).rejects.toThrow(`No account for ${FROM}`);
      expect(addDappTransactionMock).not.toHaveBeenCalled();
    });
  });
});
