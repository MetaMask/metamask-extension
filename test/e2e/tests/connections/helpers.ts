import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';

/**
 * Helper to get a request permissions request object with a caveat.
 *
 * @param accounts - The accounts to be requested.
 * @returns The request permissions request object with the caveat.
 */
export function getRequestPermissionsRequestObject(
  accounts: string[] = [],
): string {
  const caveats =
    accounts.length > 0
      ? {
          caveats: [
            {
              type: 'restrictReturnedAccounts',
              value: accounts,
            },
          ],
        }
      : {};

  return JSON.stringify({
    jsonrpc: '2.0',
    method: 'wallet_requestPermissions',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    params: [{ eth_accounts: caveats }],
  });
}

/**
 * Helper to get a request permissions request object with network restrictions.
 *
 * @param networks - Array of network IDs to restrict switching to
 * @returns the wallet_requestPermissions request string
 */
export function getRestrictedNetworks(networks: string[]): string {
  const restrictNetworks = {
    'endowment:permitted-chains': {
      caveats: [
        {
          type: 'restrictNetworkSwitching',
          value: networks,
        },
      ],
    },
  };

  return JSON.stringify({
    jsonrpc: '2.0',
    method: 'wallet_requestPermissions',
    params: [restrictNetworks],
  });
}

/**
 * Reads the CAIP chain IDs permitted for the given origin straight from the
 * PermissionController state, since permitted networks are no longer shown
 * anywhere in the wallet UI. Assumes an extension window is focused.
 *
 * @param driver - The webdriver instance.
 * @param origin - The dapp origin, e.g. 'http://127.0.0.1:8080'.
 * @returns The permitted CAIP chain IDs, excluding `wallet` scopes.
 */
export async function getPermittedChainIdsForOrigin(
  driver: Driver,
  origin: string,
): Promise<string[]> {
  const state = await getCleanAppState(driver);
  const caveats =
    state.metamask.subjects?.[origin]?.permissions?.['endowment:caip25']
      ?.caveats ?? [];
  const caveat = caveats.find(
    ({ type }: { type: string }) => type === 'authorizedScopes',
  );
  const scopes = {
    ...(caveat?.value?.requiredScopes ?? {}),
    ...(caveat?.value?.optionalScopes ?? {}),
  };
  return Object.keys(scopes).filter((scope) => !scope.startsWith('wallet'));
}
