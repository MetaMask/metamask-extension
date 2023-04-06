import { PermissionType } from '@metamask/permission-controller';

const methodName = 'snap_manageAccounts';

const methodHooks = {
  getSnapKeyring: true,
  saveSnapKeyring: true,
};

const snapKeyringPermissionBuilder = {
  targetKey: methodName,
  // eslint-disable-next-line no-shadow
  specificationBuilder: ({ methodHooks }) => {
    return {
      permissionType: PermissionType.RestrictedMethod,
      targetKey: methodName,
      allowedCaveats: null,
      methodImplementation: getImplementation(methodHooks),
    };
  },
  methodHooks,
};

function getImplementation({ getSnapKeyring, saveSnapKeyring }) {
  return async function implementation(request) {
    const {
      params,
      context: { origin },
    } = request;

    const keyring = await getSnapKeyring(origin);
    // very lame to pass saveSnapKeyring through, should review how other keyrings do this
    return keyring.handleKeyringSnapMessage(origin, params, saveSnapKeyring);
  };
}

export const snapKeyringPermissionBuilders = {
  [snapKeyringPermissionBuilder.targetKey]: snapKeyringPermissionBuilder,
};
