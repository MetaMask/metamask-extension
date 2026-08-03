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
