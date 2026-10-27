import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
} from '@metamask/json-rpc-engine';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  walletPay,
  type TransactionPayMiddlewareMessenger,
  type WalletPayJsonRpcRequest,
} from '@metamask/transaction-pay-middleware';
import type { Json, PendingJsonRpcResponse } from '@metamask/utils';

export type CreateWalletPayMiddlewareOptions = {
  /** Returns the accounts the origin is connected to. */
  getPermittedAccounts: (origin: string) => string[];
  /** Returns the internal account for an address, if MetaMask knows it. */
  getAccountByAddress: (address: string) => InternalAccount | undefined;
  /** Returns the currently selected account. */
  getSelectedAccount: () => InternalAccount | undefined;
  /** Selects the account group that contains the given account. */
  setSelectedAccountGroupByAccountId: (accountId: string) => void;
  /** Messenger used by the `wallet_pay` handler. */
  messenger: TransactionPayMiddlewareMessenger;
};

/**
 * Creates the `wallet_pay` middleware.
 *
 * Before handing the request to `walletPay`, selects the requested account so
 * the confirmation's balances, pay tokens and Perps data match the account the
 * transaction is sent from.
 *
 * @param options - Middleware options.
 * @returns The `wallet_pay` scaffold middleware.
 */
export function createWalletPayMiddleware(
  options: CreateWalletPayMiddlewareOptions,
) {
  const { getPermittedAccounts, messenger } = options;

  return createScaffoldMiddleware({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    wallet_pay: createAsyncMiddleware(
      async (
        req: WalletPayJsonRpcRequest,
        res: PendingJsonRpcResponse<Json>,
      ) => {
        selectRequestedAccount(req, options);

        await walletPay(
          req,
          res,
          {
            getPermittedAccountsForOrigin: async () =>
              getPermittedAccounts(req.origin),
          },
          messenger,
        );
      },
    ),
  });
}

/**
 * Selects the account a `wallet_pay` request is for. Only switches to an
 * account the origin is connected to; invalid requests are left for
 * `walletPay` to reject.
 *
 * @param req - The `wallet_pay` JSON-RPC request.
 * @param options - Middleware options.
 * @param options.getPermittedAccounts
 * @param options.getAccountByAddress
 * @param options.getSelectedAccount
 * @param options.setSelectedAccountGroupByAccountId
 */
function selectRequestedAccount(
  req: WalletPayJsonRpcRequest,
  {
    getPermittedAccounts,
    getAccountByAddress,
    getSelectedAccount,
    setSelectedAccountGroupByAccountId,
  }: CreateWalletPayMiddlewareOptions,
) {
  const [request] = Array.isArray(req.params) ? req.params : [];
  const from =
    request && typeof request === 'object' && 'from' in request
      ? request.from
      : undefined;

  if (typeof from !== 'string') {
    return;
  }

  const isPermitted = getPermittedAccounts(req.origin).some(
    (account) => account.toLowerCase() === from.toLowerCase(),
  );

  if (!isPermitted) {
    return;
  }

  const account = getAccountByAddress(from);

  if (!account || account.id === getSelectedAccount()?.id) {
    return;
  }

  setSelectedAccountGroupByAccountId(account.id);
}
