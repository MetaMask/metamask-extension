import {
  restrictedMethods as restrictedPluginMethods,
  selectHooks,
} from '@mm-snap/rpc-methods';

/**
 * @typedef RestrictedMethodHooks
 *
 * @property {Function} getIdentities - Gets all account identity abstractions,
 * containing account metadata.
 * @property {Function} getKeyringAccounts - Gets all current keyring accounts.
 * @property {Function} addPlugin - Installs a requested plugin.
 * @property {Function} getPlugin - Gets metadata for a specific plugin.
 * @property {Function} getPluginRpcHandler - Gets the RPC message handler for a specific plugin.
 * @property {Function} showConfirmation - Displays a confirmation for user action.
 */

/**
 * @typedef PluginRestrictedMethodHooks
 *
 * @property {Function} addPlugin - Installs a requested plugin.
 * @property {Function} getPlugin - Gets metadata for a specific plugin.
 * @property {Function} getPluginRpcHandler - Gets the RPC message handler for a specific plugin.
 * @property {Function} showConfirmation - Displays a confirmation for user action.
 */

/**
 * @param {RestrictedMethodHooks} hooks - Restricted method hooks.
 */
export default function getRestrictedMethods({
  addPlugin,
  clearSnapState,
  getIdentities,
  getKeyringAccounts,
  getMnemonic,
  getPlugin,
  getPluginRpcHandler,
  getSnapState,
  handleAssetRequest,
  showConfirmation,
  updateSnapState,
}) {
  return {
    ...getCommonRestrictedMethods({ getIdentities, getKeyringAccounts }),
    ...getPluginRestrictedMethods({
      addPlugin,
      clearSnapState,
      getPlugin,
      getPluginRpcHandler,
      getMnemonic,
      getSnapState,
      handleAssetRequest,
      showConfirmation,
      updateSnapState,
    }),
  };
}

/**
 * @param {PluginRestrictedMethodHooks} hooks - Plugin restricted method hooks.
 */
export function getPluginRestrictedMethods(hooks) {
  return restrictedPluginMethods.reduce((restrictedMethods, handler) => {
    restrictedMethods[handler.methodNames[0]] = {
      description: handler.permissionDescription,
      method: handler.getImplementation(selectHooks(hooks, handler.hookNames)),
    };
    return restrictedMethods;
  }, {});
}

export function getCommonRestrictedMethods({
  getIdentities,
  getKeyringAccounts,
}) {
  return {
    eth_accounts: {
      description: 'View Ethereum accounts',
      method: async (_req, res, _next, end) => {
        try {
          const accounts = await getKeyringAccounts();
          const identities = getIdentities();
          res.result = accounts.sort((firstAddress, secondAddress) => {
            if (!identities[firstAddress]) {
              throw new Error(`Missing identity for address ${firstAddress}`);
            } else if (!identities[secondAddress]) {
              throw new Error(`Missing identity for address ${secondAddress}`);
            } else if (
              identities[firstAddress].lastSelected ===
              identities[secondAddress].lastSelected
            ) {
              return 0;
            } else if (identities[firstAddress].lastSelected === undefined) {
              return 1;
            } else if (identities[secondAddress].lastSelected === undefined) {
              return -1;
            }

            return (
              identities[secondAddress].lastSelected -
              identities[firstAddress].lastSelected
            );
          });
          end();
        } catch (err) {
          res.error = err;
          end(err);
        }
      },
    },
  };
}
