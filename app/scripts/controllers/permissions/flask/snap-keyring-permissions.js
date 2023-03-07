import {
  errorCodes as rpcErrorCodes,
  EthereumRpcError,
  ethErrors,
} from 'eth-rpc-errors';
import {
  PermissionType,
} from '@metamask/permission-controller';

const NotificationType = {
  InApp: 'inApp',
  Native: 'native',
}

const methodName = 'snap_manageAccounts';

const methodHooks = {
  getSnapKeyring: true,
  saveSnapKeyring: true,
}

const snapKeyringPermissionBuilder = {
  targetKey: methodName,
  specificationBuilder: ({allowedCaveats = null, methodHooks}) => {
    return {
      permissionType: PermissionType.RestrictedMethod,
      targetKey: methodName,
      allowedCaveats: null,
      methodImplementation: getImplementation(methodHooks),
    };
  },
  methodHooks,
}

function getImplementation({
  getSnapKeyring,
  saveSnapKeyring,
}) {
  return async function implementation(
    args,
  ) {
    const {
      params: [methodName, params],
      context: { origin },
    } = args;

    // const validatedParams = getValidatedParams(params);
    // const validatedParams = params;

    switch (methodName) {
      // case 'create':
      // case NotificationType.Native:
      //   return await showNativeNotification(origin, validatedParams);
      // case NotificationType.InApp:
      //   return await showInAppNotification(origin, validatedParams);
      default:
        throw ethErrors.rpc.invalidParams({
          message: 'Must specify a valid snap_manageAccounts "methodName".',
        });
    }
  };
}

export const snapKeyringPermissionBuilders = {
  [snapKeyringPermissionBuilder.targetKey]: snapKeyringPermissionBuilder,
}