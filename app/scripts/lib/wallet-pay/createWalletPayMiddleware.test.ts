import { JsonRpcEngine } from '@metamask/json-rpc-engine';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  walletPay,
  type TransactionPayMiddlewareMessenger,
} from '@metamask/transaction-pay-middleware';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import {
  createWalletPayMiddleware,
  type CreateWalletPayMiddlewareOptions,
} from './createWalletPayMiddleware';

jest.mock('@metamask/transaction-pay-middleware', () => ({
  walletPay: jest.fn(),
}));

const ORIGIN_MOCK = 'https://example.test';
const SELECTED_ADDRESS_MOCK = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
const REQUESTED_ADDRESS_MOCK = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';

const SELECTED_ACCOUNT_MOCK = {
  id: 'selected-account-id',
  address: SELECTED_ADDRESS_MOCK.toLowerCase(),
} as InternalAccount;

const REQUESTED_ACCOUNT_MOCK = {
  id: 'requested-account-id',
  address: REQUESTED_ADDRESS_MOCK.toLowerCase(),
} as InternalAccount;

const ACCOUNTS_MOCK = [SELECTED_ACCOUNT_MOCK, REQUESTED_ACCOUNT_MOCK];

function buildOptions(
  overrides: Partial<CreateWalletPayMiddlewareOptions> = {},
): jest.Mocked<CreateWalletPayMiddlewareOptions> {
  return {
    getPermittedAccounts: jest
      .fn()
      .mockReturnValue([SELECTED_ADDRESS_MOCK, REQUESTED_ADDRESS_MOCK]),
    getAccountByAddress: jest.fn((address: string) =>
      ACCOUNTS_MOCK.find(
        (account) => account.address === address.toLowerCase(),
      ),
    ),
    getSelectedAccount: jest.fn().mockReturnValue(SELECTED_ACCOUNT_MOCK),
    setSelectedAccountGroupByAccountId: jest.fn(),
    messenger: {} as TransactionPayMiddlewareMessenger,
    ...overrides,
  } as jest.Mocked<CreateWalletPayMiddlewareOptions>;
}

async function request(
  options: CreateWalletPayMiddlewareOptions,
  params: Json[] = [
    { type: 'perpsDeposit', from: REQUESTED_ADDRESS_MOCK, amount: '10' },
  ],
) {
  const engine = new JsonRpcEngine();
  engine.push(createWalletPayMiddleware(options));

  return await engine.handle({
    id: 1,
    jsonrpc: '2.0',
    method: 'wallet_pay',
    params,
    origin: ORIGIN_MOCK,
  } as JsonRpcRequest<Json[]>);
}

describe('createWalletPayMiddleware', () => {
  const walletPayMock = jest.mocked(walletPay);

  beforeEach(() => {
    jest.resetAllMocks();
    walletPayMock.mockImplementation(async (_req, res) => {
      res.result = { transactionHash: '0x123' };
    });
  });

  it('selects the requested account before handling the request', async () => {
    const options = buildOptions();
    walletPayMock.mockImplementation(async (_req, res) => {
      expect(options.setSelectedAccountGroupByAccountId).toHaveBeenCalledWith(
        REQUESTED_ACCOUNT_MOCK.id,
      );
      res.result = {};
    });

    await request(options);

    expect(options.setSelectedAccountGroupByAccountId).toHaveBeenCalledTimes(1);
    expect(walletPayMock).toHaveBeenCalledTimes(1);
  });

  it('returns the result from walletPay', async () => {
    const response = await request(buildOptions());

    expect(response).toStrictEqual(
      expect.objectContaining({ result: { transactionHash: '0x123' } }),
    );
  });

  it('passes the origin permitted accounts and messenger to walletPay', async () => {
    const options = buildOptions();

    await request(options);

    const [req, , hooks, messenger] = walletPayMock.mock.calls[0];
    expect(req.origin).toBe(ORIGIN_MOCK);
    expect(messenger).toBe(options.messenger);
    expect(await hooks.getPermittedAccountsForOrigin()).toStrictEqual([
      SELECTED_ADDRESS_MOCK,
      REQUESTED_ADDRESS_MOCK,
    ]);
    expect(options.getPermittedAccounts).toHaveBeenCalledWith(ORIGIN_MOCK);
  });

  it('does not switch when the requested account is already selected', async () => {
    const options = buildOptions({
      getSelectedAccount: jest.fn().mockReturnValue(REQUESTED_ACCOUNT_MOCK),
    });

    await request(options);

    expect(options.setSelectedAccountGroupByAccountId).not.toHaveBeenCalled();
    expect(walletPayMock).toHaveBeenCalledTimes(1);
  });

  it('does not switch to an account the origin is not connected to', async () => {
    const options = buildOptions({
      getPermittedAccounts: jest.fn().mockReturnValue([SELECTED_ADDRESS_MOCK]),
    });

    await request(options);

    expect(options.setSelectedAccountGroupByAccountId).not.toHaveBeenCalled();
    expect(walletPayMock).toHaveBeenCalledTimes(1);
  });

  it('does not switch to an unknown account', async () => {
    const options = buildOptions({
      getAccountByAddress: jest.fn().mockReturnValue(undefined),
    });

    await request(options);

    expect(options.setSelectedAccountGroupByAccountId).not.toHaveBeenCalled();
    expect(walletPayMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing params', []],
    ['a non-object request', ['not-an-object']],
    ['a missing from', [{ type: 'perpsDeposit' }]],
    ['a non-string from', [{ type: 'perpsDeposit', from: 123 }]],
  ])(
    'does not switch for %s and leaves validation to walletPay',
    async (_title, params) => {
      const options = buildOptions();

      await request(options, params as Json[]);

      expect(options.setSelectedAccountGroupByAccountId).not.toHaveBeenCalled();
      expect(walletPayMock).toHaveBeenCalledTimes(1);
    },
  );

  it('does not handle other methods', async () => {
    const options = buildOptions();
    const engine = new JsonRpcEngine();
    engine.push(createWalletPayMiddleware(options));
    engine.push((_req, res, _next, end) => {
      res.result = 'next';
      end();
    });

    const response = await engine.handle({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_chainId',
      origin: ORIGIN_MOCK,
    } as JsonRpcRequest);

    expect(response).toStrictEqual(expect.objectContaining({ result: 'next' }));
    expect(walletPayMock).not.toHaveBeenCalled();
    expect(options.setSelectedAccountGroupByAccountId).not.toHaveBeenCalled();
  });
});
