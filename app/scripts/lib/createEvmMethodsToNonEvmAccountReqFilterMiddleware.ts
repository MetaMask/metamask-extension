import { isEvmAccountType } from '@metamask/keyring-api';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import { RestrictedEthMethods } from '../../../shared/constants/permissions';
import { unrestrictedEthSigningMethods } from '../controllers/permissions';

type AllowedActions = AccountsControllerGetSelectedAccountAction;

export type EvmMethodsToNonEvmAccountFilterMessenger =
  RestrictedControllerMessenger<
    'EvmMethodsToNonEvmAccountFilterMessenger',
    AllowedActions,
    never,
    AllowedActions['type'],
    never
  >;

const METHODS_TO_CHECK = [
  ...Object.values(RestrictedEthMethods),
  ...unrestrictedEthSigningMethods,
];

/**
 * Returns a middleware that filters out requests whose requests are restricted to EVM accounts.
 *
 * @param opt - The middleware options.
 * @param opt.messenger - The messenger object.
 * @returns The middleware function.
 */
export default function createEvmMethodsToNonEvmAccountReqFilterMiddleware({
  messenger,
}: {
  messenger: EvmMethodsToNonEvmAccountFilterMessenger;
}): JsonRpcMiddleware<unknown, void> {
  return function filterEvmRequestToNonEvmAccountsMiddleware(
    req,
    _res,
    next,
    end,
  ) {
    const selectedAccount = messenger.call(
      'AccountsController:getSelectedAccount',
    );

    // If it's an EVM account, there nothing to filter, so jump to the next
    // middleware directly.
    if (isEvmAccountType(selectedAccount.type)) {
      return next();
    }

    const ethMethodsRequiringEthAccount = METHODS_TO_CHECK.includes(req.method);
    if (ethMethodsRequiringEthAccount) {
      return end(
        new Error(`Non-EVM account cannot request this method: ${req.method}`),
      );
    }

    // https://docs.metamask.io/wallet/reference/wallet_requestpermissions/
    // wallet_requestPermissions param is an array with one object. The object may contain
    // multiple keys that represent the permissions being requested.

    // Example:
    // {
    //   "method": "wallet_requestPermissions",
    //   "params": [
    //     {
    //       "eth_accounts": {},
    //       "anotherPermission": {}
    //     }
    //   ]
    // }

    // TODO: Convert this to superstruct schema
    const isWalletRequestPermission =
      req.method === 'wallet_requestPermissions';
    if (isWalletRequestPermission && req?.params && Array.isArray(req.params)) {
      const permissionsMethodRequest = Object.keys(req.params[0]);

      const isEvmPermissionRequest = METHODS_TO_CHECK.some((method) =>
        permissionsMethodRequest.includes(method),
      );
      if (isEvmPermissionRequest) {
        return end(
          new Error(
            `Non-EVM account cannot request this method: ${permissionsMethodRequest.toString()}`,
          ),
        );
      }
    }

    return next();
  };
}
