import { hasProperty, hexToBigInt, isObject } from '@metamask/utils';
import type { CaipChainId, CaipAccountId, Json, Hex } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import type {
  Caveat,
  PermissionConstraint,
  ValidPermission,
} from '@metamask/permission-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 137;

// In-lined from @metamask/multichain
const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';

type InternalScopeObject = {
  accounts: CaipAccountId[];
};

type InternalScopesObject = Record<CaipChainId, InternalScopeObject>;

type Caip25CaveatValue = {
  requiredScopes: InternalScopesObject;
  optionalScopes: InternalScopesObject;
  sessionProperties?: Record<string, Json>;
  isMultichainOrigin: boolean;
};

// Locally defined types
type Caip25Caveat = Caveat<typeof Caip25CaveatType, Caip25CaveatValue>;
type Caip25Permission = ValidPermission<
  typeof Caip25EndowmentPermissionName,
  Caip25Caveat
>;

const PermissionNames = {
  eth_accounts: 'eth_accounts',
  permittedChains: 'endowment:permitted-chains',
} as const;

const BUILT_IN_NETWORKS: ReadonlyMap<string, Hex> = new Map([
  ['sepolia', '0xaa36a7'],
  ['mainnet', '0x1'],
  ['linea-sepolia', '0xe705'],
  ['linea-mainnet', '0xe708'],
]);

const snapsPrefixes = ['npm:', 'local:'] as const;

/**
 * This migration transforms `eth_accounts` and `permittedChains` permissions into
 * an equivalent CAIP-25 permission.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  const newState = transformState(versionedData.data);
  versionedData.data = newState as Record<string, unknown>;
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    console.warn(
      `Migration ${version}: typeof state.PermissionController is ${typeof state.PermissionController}`,
    );
    return state;
  }

  if (
    !hasProperty(state, 'NetworkController') ||
    !isObject(state.NetworkController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
    return state;
  }

  if (!hasProperty(state, 'SelectedNetworkController')) {
    console.warn(
      `Migration ${version}: typeof state.SelectedNetworkController is ${typeof state.SelectedNetworkController}`,
    );
    state.SelectedNetworkController = {
      domains: {},
    };
  }

  const {
    // PermissionController: { subjects },
    NetworkController: {
      selectedNetworkClientId,
      networkConfigurationsByChainId,
    },
  } = state;

  // // legitimate state corruption error, would need to fix once we see this error hit
  // if (!isObject(subjects)) {
  //   global.sentry?.captureException?.(
  //     new Error(
  //       `Migration ${version}: typeof state.PermissionController.subjects is ${typeof state
  //         .PermissionController.subjects}`,
  //     ),
  //   );
  //   return state;
  // }

  // // legitimate state corruption error, would need to fix once we see this error hit
  // for (const [origin, subject] of Object.entries(subjects)) {
  //   if (!isObject(subject)) {
  //     global.sentry?.captureException?.(
  //       new Error(
  //         `Migration ${version}: Invalid subject for origin "${origin}" of type ${typeof subject}`,
  //       ),
  //     );
  //     return state;
  //   }

  //   if (
  //     !hasProperty(subject, 'permissions') ||
  //     !isObject(subject.permissions)
  //   ) {
  //     global.sentry?.captureException?.(
  //       new Error(
  //         `Migration ${version}: Invalid permissions for origin "${origin}" of type ${typeof subject.permissions}`,
  //       ),
  //     );
  //     return state;
  //   }
  // }

  // legitimate state corruption error, would need to fix once we see this error hit
  if (!selectedNetworkClientId || typeof selectedNetworkClientId !== 'string') {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: invalid selectedNetworkClientId "${selectedNetworkClientId}"`,
      ),
    );
    return state;
  }

  // legitimate state corruption error, would need to fix once we see this error hit
  if (!isObject(networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId is ${typeof state
          .NetworkController.networkConfigurationsByChainId}`,
      ),
    );
    return state;
  }

  // legitimate state corruption error, would need to fix once we see this error hit
  if (
    !hasProperty(state.SelectedNetworkController as any, 'domains') ||
    !isObject((state.SelectedNetworkController as any).domains)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController.domains is ${typeof (
          state.SelectedNetworkController as any
        ).domains}`,
      ),
    );
    return state;
  }

  const newState = cloneDeep(state);

  const {
    PermissionController: { subjects: newSubjects },
  } = newState as {
    PermissionController: {
      subjects: Record<string, unknown>;
    };
  };

  const { domains } = state.SelectedNetworkController as {
    domains: Record<string, unknown>;
  };

  const getChainIdForNetworkClientId = (
    networkClientId: string,
    propertyName: string,
  ): string | undefined => {
    for (const [chainId, networkConfiguration] of Object.entries(
      networkConfigurationsByChainId,
    )) {
      if (!isObject(networkConfiguration)) {
        global.sentry?.captureException(
          new Error(
            `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"] is ${typeof networkConfiguration}`,
          ),
        );
        return undefined;
      }
      if (!Array.isArray(networkConfiguration.rpcEndpoints)) {
        global.sentry?.captureException(
          new Error(
            `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints is ${typeof networkConfiguration.rpcEndpoints}`,
          ),
        );
        return undefined;
      }
      for (const rpcEndpoint of networkConfiguration.rpcEndpoints) {
        if (!isObject(rpcEndpoint)) {
          global.sentry?.captureException(
            new Error(
              `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints[] is ${typeof rpcEndpoint}`,
            ),
          );
          return undefined;
        }
        if (rpcEndpoint.networkClientId === networkClientId) {
          return chainId;
        }
      }
    }

    const builtInChainId = BUILT_IN_NETWORKS.get(networkClientId);
    if (!builtInChainId) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: No chainId found for ${propertyName} "${networkClientId}"`,
        ),
      );
    }
    return builtInChainId;
  };

  const currentChainId = getChainIdForNetworkClientId(
    selectedNetworkClientId,
    'selectedNetworkClientId',
  );
  if (!currentChainId) {
    return state;
  }

  // Perform mutations on cloned state
  for (const [origin, subject] of Object.entries(newSubjects)) {
    if (!isObject(subject)) {
      global.sentry?.captureException?.(
        new Error(
          `Migration ${version}: Invalid subject for origin "${origin}" of type ${typeof subject}`,
        ),
      );
      return state;
    }

    if (
      !hasProperty(subject, 'permissions') ||
      !isObject(subject.permissions)
    ) {
      global.sentry?.captureException?.(
        new Error(
          `Migration ${version}: Invalid permissions for origin "${origin}" of type ${typeof subject.permissions}`,
        ),
      );
      return state;
    }

    const { permissions } = subject;

    let basePermission: PermissionConstraint | undefined;

    let ethAccounts: string[] = [];
    const ethAccountsPermission = permissions[PermissionNames.eth_accounts];
    if (
      isObject(ethAccountsPermission) &&
      hasProperty(ethAccountsPermission, 'caveats') &&
      Array.isArray(ethAccountsPermission.caveats)
    ) {
      ethAccounts =
        (ethAccountsPermission.caveats?.[0]?.value as
          | string[]
          | undefined) ?? [];
      // basePermission = ethAccountsPermission;
    }
    delete permissions[PermissionNames.eth_accounts];

    let chainIds: string[] = [];
    const permittedChainsPermission = permissions[PermissionNames.permittedChains];
    if (
      isObject(permittedChainsPermission) &&
      hasProperty(permittedChainsPermission, 'caveats') &&
      Array.isArray(permittedChainsPermission.caveats)
    ) {
      chainIds =
        (permittedChainsPermission.caveats?.[0]?.value as
          | string[]
          | undefined) ?? [];
      // basePermission ??= permissions[PermissionNames.permittedChains];
    }
    delete permissions[PermissionNames.permittedChains];

    if (ethAccounts.length === 0 || !basePermission) {
      continue;
    }

    if (chainIds.length === 0) {
      chainIds = [currentChainId];

      const networkClientIdForOrigin = domains[origin];
      if (
        networkClientIdForOrigin &&
        typeof networkClientIdForOrigin === 'string'
      ) {
        const chainIdForOrigin = getChainIdForNetworkClientId(
          networkClientIdForOrigin,
          'networkClientIdForOrigin',
        );
        if (chainIdForOrigin) {
          chainIds = [chainIdForOrigin];
        }
      }
    }

    const isSnap = snapsPrefixes.some((prefix) => origin.startsWith(prefix));
    const scopes: InternalScopesObject = {};
    const scopeStrings: CaipChainId[] = isSnap
      ? []
      : chainIds.map<CaipChainId>(
          (chainId) => `eip155:${hexToBigInt(chainId).toString(10)}`,
        );
    scopeStrings.push('wallet:eip155');

    scopeStrings.forEach((scopeString) => {
      const caipAccounts = ethAccounts.map<CaipAccountId>(
        (account) => `${scopeString}:${account}`,
      );
      scopes[scopeString] = {
        accounts: caipAccounts,
      };
    });

    const caip25Permission: Caip25Permission = {
      // ...basePermission,
      id: '1', // for now
      invoker: '1', // for now
      date: new Date().getTime(), // for now
      parentCapability: Caip25EndowmentPermissionName,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: scopes,
            isMultichainOrigin: false,
          },
        },
      ],
    };

    permissions[Caip25EndowmentPermissionName] = caip25Permission;
  }

  return newState;
}
