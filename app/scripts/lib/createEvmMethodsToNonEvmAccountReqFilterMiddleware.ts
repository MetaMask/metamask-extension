import { isEvmAccountType } from '@metamask/keyring-api';
import { JsonRpcMiddleware } from 'json-rpc-engine';
import log from 'loglevel';
import { RestrictedMethods } from '../../../shared/constants/permissions';
import { UnrestrictedEthSigningMethods } from '../controllers/permissions';

/**
 * Returns a middleware that filters out requests whose requests are restricted to EVM accounts.
 *
 * @returns The middleware function.
 */
export default function createEvmMethodsToNonEvmAccountReqFilterMiddleware({
  messenger,
}: {
  messenger: any;
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
      ...Object.values(RestrictedMethods),
      ...UnrestrictedEthSigningMethods,
    ].includes(req.method);

    if (ethMethodsRequiringEthAccount) {
      return end(
        new Error(`Non evm account can't request this method: ${req.method}`),
      );
    }

    const isWalletRequestPermission =
      req.method === 'wallet_requestPermissions';

    const permissionMethodRequest = (
      (req?.params as Array<{ [key: string]: {} }>) || []
    ).map((request) => Object.keys(request)[0]);

    const isEvmPermissionRequest = [...Object.values(RestrictedMethods)].some(
      (method) => permissionMethodRequest.includes(method),
    );

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

    return next();
  };
}
