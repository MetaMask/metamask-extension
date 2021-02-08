import nanoid from 'nanoid';

const fs = require('fs');
const FILSNAP_MANIFEST = require('../../vendor/filsnap/filsnap-manifest.json');

export const FILSNAP_NAME = 'filsnap';

/* eslint-disable node/no-sync */
const FILSNAP_SOURCE = fs.readFileSync(
  require.resolve('../../vendor/filsnap/filsnap-bundle.js'),
  'utf8',
);
/* eslint-enable node/no-sync */

const FILSNAP_PERMISSION_NAMES = Object.keys(
  FILSNAP_MANIFEST.web3Wallet.initialPermissions,
);

const getFilsnapPermission = (method) => {
  return {
    '@context': ['https://github.com/MetaMask/rpc-cap'],
    invoker: FILSNAP_NAME,
    parentCapability: method,
    id: nanoid(),
    date: new Date(),
    caveats: [],
  };
};

const FILSNAP_PERMISSIONS = FILSNAP_PERMISSION_NAMES.reduce(
  (allPerms, permName) => {
    allPerms[permName] = getFilsnapPermission(permName);
    return allPerms;
  },
  {},
);

/**
 * Grant filsnap the permissions it needs, install / reinstall it if
 * necessary, and start it.
 */
export async function setupFilsnap(permissionsController, pluginController) {
  // Add the filsnap permissions if they haven't already been added
  const { permissions: rpcCap } = permissionsController;

  // TODO: Upgrade rpc-cap and use .hasPermissions
  if (
    !rpcCap?.state?.domains?.[FILSNAP_NAME] ||
    permissionsChanged(rpcCap.getPermissionsForDomain(FILSNAP_NAME))
  ) {
    // Normally, this is not something we'd do casually, if at all.
    rpcCap.addPermissionsFor(FILSNAP_NAME, FILSNAP_PERMISSIONS);
  }

  const existingPlugin = pluginController.get(FILSNAP_NAME);
  // Add filsnap
  // TODO: Fix naive version comparison
  if (!existingPlugin || existingPlugin.version !== FILSNAP_MANIFEST.version) {
    await pluginController.add({
      name: FILSNAP_NAME,
      manifest: { web3Wallet: FILSNAP_MANIFEST.web3Wallet },
      sourceCode: FILSNAP_SOURCE,
    });
    pluginController._pluginsBeingAdded.delete(FILSNAP_NAME);
  }

  // Start filsnap
  if (!pluginController.isRunning(FILSNAP_NAME)) {
    await pluginController.startPlugin(FILSNAP_NAME);
  }
}

/**
 * @returns {boolean} Whether the given permissions differ from those of the
 * filsnap manifest loaded from disk.
 */
function permissionsChanged(existingPermissions) {
  const existingPermissionNames = existingPermissions.map((perm) => {
    return perm.parentCapability;
  });

  if (FILSNAP_PERMISSION_NAMES.length !== existingPermissionNames.length) {
    return false;
  }

  for (const permName of FILSNAP_PERMISSION_NAMES) {
    if (!existingPermissionNames.includes(permName)) {
      return false;
    }
  }
  return true;
}
