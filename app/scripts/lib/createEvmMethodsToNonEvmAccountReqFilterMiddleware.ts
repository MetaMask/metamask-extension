import { isEvmAccountType } from '@metamask/keyring-api';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { JsonRpcMiddleware } from 'json-rpc-engine';
import log from 'loglevel';
import { RestrictedEthMethods } from '../../../shared/constants/permissions';
import { UnrestrictedEthSigningMethods } from '../controllers/permissions';

type AllowedActions = AccountsControllerGetSelectedAccountAction;

export type EvmMethodsToNonEvmAccountFilterMessenger =
  RestrictedControllerMessenger<
    'EvmMethodsToNonEvmAccountFilterMessenger',
    AllowedActions,
    never,
    AllowedActions['type'],
    never
  >;

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

    const isEvmAccount = isEvmAccountType(selectedAccount.type);
    if (isEvmAccount) {
      return next();
    }

    const ethMethodsRequiringEthAccount = [
      ...Object.values(RestrictedEthMethods),
      ...UnrestrictedEthSigningMethods,
    ].includes(req.method);

    if (ethMethodsRequiringEthAccount) {
      return end(
        new Error(`Non evm account can't request this method: ${req.method}`),
      );
    }

    const isWalletRequestPermission =
      req.method === 'wallet_requestPermissions';

    if (req?.params && Array.isArray(req.params)) {
      const permissionMethodRequest = req.params.map(
        (request) => Object.keys(request)[0],
      );

      const isEvmPermissionRequest = [
        ...Object.values(RestrictedEthMethods),
      ].some((method) => permissionMethodRequest.includes(method));

      if (isWalletRequestPermission && isEvmPermissionRequest) {
        log.debug(
          "Non evm account can't request this method",
          permissionMethodRequest,
        );
        return end(
          new Error(
            `Non evm account can't request this method: ${permissionMethodRequest.toString()}`,
          ),
        );
      }
    }

    return next();
  };
}
