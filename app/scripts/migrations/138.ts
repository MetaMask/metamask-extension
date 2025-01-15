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

export const version = 138;

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

function isPermissionConstraint(obj: unknown): obj is PermissionConstraint {
  return (
    isObject(obj) &&
    obj !== null &&
    hasProperty(obj, 'caveats') &&
    Array.isArray(obj.caveats) &&
    obj.caveats.length > 0 &&
    hasProperty(obj, 'date') &&
    typeof obj.date === 'number' &&
    hasProperty(obj, 'id') &&
    typeof obj.id === 'string' &&
    hasProperty(obj, 'invoker') &&
    typeof obj.invoker === 'string' &&
    hasProperty(obj, 'parentCapability') &&
    typeof obj.parentCapability === 'string'
  );
}

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

function transformState(oldState: Record<string, unknown>) {
  const newState = cloneDeep(oldState);
  if (
    !hasProperty(newState, 'PermissionController') ||
    !isObject(newState.PermissionController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController is ${typeof newState.PermissionController}`,
      ),
    );
    return oldState;
  }

  if (
    !hasProperty(newState, 'NetworkController') ||
    !isObject(newState.NetworkController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.NetworkController is ${typeof newState.NetworkController}`,
      ),
    );
    return newState;
  }

  if (!hasProperty(newState, 'SelectedNetworkController')) {
    console.warn(
      `Migration ${version}: typeof state.SelectedNetworkController is ${typeof newState.SelectedNetworkController}`,
    );
    newState.SelectedNetworkController = {
      domains: {},
    };
  }

  if (!isObject(newState.SelectedNetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController is ${typeof newState.SelectedNetworkController}`,
      ),
    );
    return oldState;
  }

  const {
    NetworkController: {
      selectedNetworkClientId,
      networkConfigurationsByChainId,
    },
    PermissionController: { subjects },
  } = newState;

  if (!isObject(subjects)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController.subjects is ${typeof subjects}`,
      ),
    );
    return oldState;
  }

  if (!selectedNetworkClientId || typeof selectedNetworkClientId !== 'string') {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.NetworkController.selectedNetworkClientId is ${typeof selectedNetworkClientId}`,
      ),
    );
    return oldState;
  }

  if (!isObject(networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId is ${typeof newState
          .NetworkController.networkConfigurationsByChainId}`,
      ),
    );
    return oldState;
  }

  if (
    !hasProperty(newState.SelectedNetworkController, 'domains') ||
    !isObject(newState.SelectedNetworkController.domains)
  ) {
    const { domains } = newState.SelectedNetworkController;
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController.domains is ${typeof domains}`,
      ),
    );
    return oldState;
  }

  if (!isObject(newState.PermissionController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController is ${typeof newState.PermissionController}`,
      ),
    );
    return oldState;
  }

  const { domains } = newState.SelectedNetworkController;

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
        continue;
      }
      if (!Array.isArray(networkConfiguration.rpcEndpoints)) {
        global.sentry?.captureException(
          new Error(
            `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints is ${typeof networkConfiguration.rpcEndpoints}`,
          ),
        );
        continue;
      }
      for (const rpcEndpoint of networkConfiguration.rpcEndpoints) {
        if (!isObject(rpcEndpoint)) {
          global.sentry?.captureException(
            new Error(
              `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints[] is ${typeof rpcEndpoint}`,
            ),
          );
          continue;
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
    return oldState;
  }

  // perform mutations on the cloned state
  for (const [origin, subject] of Object.entries(subjects)) {
    if (!isObject(subject)) {
      global.sentry?.captureException?.(
        new Error(
          `Migration ${version}: Invalid subject for origin "${origin}" of type ${typeof subject}`,
        ),
      );
      return oldState;
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
      return oldState;
    }

    const { permissions } = subject;

    let basePermission: PermissionConstraint | undefined;

    let ethAccounts: string[] = [];
    const ethAccountsPermission = permissions[PermissionNames.eth_accounts];
    if (isPermissionConstraint(ethAccountsPermission)) {
      ethAccounts =
        (ethAccountsPermission.caveats?.[0]?.value as string[] | undefined) ??
        [];
      basePermission = ethAccountsPermission;
    }

    delete permissions[PermissionNames.eth_accounts];

    let chainIds: string[] = [];
    const permittedChainsPermission =
      permissions[PermissionNames.permittedChains];
    if (isPermissionConstraint(permittedChainsPermission)) {
      chainIds =
        (permittedChainsPermission.caveats?.[0]?.value as
          | string[]
          | undefined) ?? [];

      basePermission ??= permittedChainsPermission;
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
      ...basePermission,
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