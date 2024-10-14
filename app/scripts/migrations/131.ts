import { hasProperty, isObject, NonEmptyArray, Json } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type CaveatConstraint = {
  type: string;
  value: Json;
};

type PermissionConstraint = {
  parentCapability: string;
  caveats: null | NonEmptyArray<CaveatConstraint>;
};

const PermissionNames = {
  eth_accounts: 'eth_accounts',
  permittedChains: 'endowment:permitted-chains',
};

const BUILT_IN_NETWORKS = {
  goerli: '0x5',
  sepolia: '0xaa36a7',
  mainnet: '0x1',
  'linea-goerli': '0xe704',
  'linea-sepolia': '0xe705',
  'linea-mainnet': '0xe708',
};

const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';

const snapsPrefixes = ['npm:', 'local:'] as const;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 131;

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
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController is ${typeof state.PermissionController}`,
      ),
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

  if (
    !hasProperty(state, 'SelectedNetworkController') ||
    !isObject(state.SelectedNetworkController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController is ${typeof state.SelectedNetworkController}`,
      ),
    );
    return state;
  }

  const {
    PermissionController: { subjects },
    NetworkController: {
      selectedNetworkClientId,
      networkConfigurationsByChainId,
    },
    SelectedNetworkController: { domains },
  } = state;

  if (!isObject(subjects)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: typeof state.PermissionController.subjects is ${typeof subjects}`,
      ),
    );
    return state;
  }
  if (!selectedNetworkClientId || typeof selectedNetworkClientId !== 'string') {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: typeof state.NetworkController.selectedNetworkClientId is ${typeof selectedNetworkClientId}`,
      ),
    );
    return state;
  }
  if (!isObject(networkConfigurationsByChainId)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId is ${typeof networkConfigurationsByChainId}`,
      ),
    );
    return state;
  }
  if (!isObject(domains)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController.domains is ${typeof domains}`,
      ),
    );
    return state;
  }

  const getChainIdForNetworkClientId = (networkClientId: string) => {
    for (const [chainId, networkConfiguration] of Object.entries(
      networkConfigurationsByChainId,
    )) {
      if (!isObject(networkConfiguration)) {
        global.sentry?.captureException(
          new Error(
            `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"] is ${typeof networkConfiguration}`,
          ),
        );
        return null;
      }
      if (!Array.isArray(networkConfiguration.rpcEndpoints)) {
        global.sentry?.captureException(
          new Error(
            `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints is ${typeof networkConfiguration.rpcEndpoints}`,
          ),
        );
        return null;
      }
      for (const rpcEndpoint of networkConfiguration.rpcEndpoints) {
        if (!isObject(rpcEndpoint)) {
          global.sentry?.captureException(
            new Error(
              `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["${chainId}"].rpcEndpoints[] is ${typeof rpcEndpoint}`,
            ),
          );
          return null;
        }
        if (rpcEndpoint.networkClientId === networkClientId) {
          return chainId;
        }
      }
    }

    return BUILT_IN_NETWORKS[
      networkClientId as unknown as keyof typeof BUILT_IN_NETWORKS
    ];
  };

  const currentChainId = getChainIdForNetworkClientId(selectedNetworkClientId);
  if (!currentChainId || typeof currentChainId !== 'string') {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid chainId for selectedNetworkClientId "${selectedNetworkClientId}" of type ${typeof currentChainId}`,
      ),
    );
    return state;
  }

  for (const [origin, subject] of Object.entries(subjects)) {
    if (!isObject(subject)) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid subject for origin "${origin}" of type ${typeof subject}`,
        ),
      );
      return state;
    }

    const { permissions } = subject as {
      permissions: Record<string, PermissionConstraint>;
    };
    if (!isObject(permissions)) {
      global.sentry?.captureException(
        new Error(
          `Migration ${version}: Invalid permissions for origin "${origin}" of type ${typeof permissions}`,
        ),
      );
      return state;
    }

    let basePermission;

    let ethAccounts: string[] = [];
    if (
      isObject(permissions[PermissionNames.eth_accounts]) &&
      Array.isArray(permissions[PermissionNames.eth_accounts].caveats)
    ) {
      ethAccounts =
        (permissions[PermissionNames.eth_accounts].caveats?.[0]
          ?.value as string[]) ?? [];
      basePermission = permissions[PermissionNames.eth_accounts];
    }
    delete permissions[PermissionNames.eth_accounts];

    let chainIds: string[] = [];
    if (
      isObject(permissions[PermissionNames.permittedChains]) &&
      Array.isArray(permissions[PermissionNames.permittedChains].caveats)
    ) {
      chainIds =
        (permissions[PermissionNames.permittedChains].caveats?.[0]
          ?.value as string[]) ?? [];
      basePermission ??= permissions[PermissionNames.permittedChains];
    }
    delete permissions[PermissionNames.permittedChains];

    if (ethAccounts.length === 0) {
      continue;
    }

    if (chainIds.length === 0) {
      chainIds = [currentChainId];

      const networkClientIdForOrigin = domains[origin];
      if (networkClientIdForOrigin) {
        const chainIdForOrigin = getChainIdForNetworkClientId(
          networkClientIdForOrigin as string,
        );
        if (chainIdForOrigin && typeof chainIdForOrigin === 'string') {
          chainIds = [chainIdForOrigin];
        }
      }
    }

    const isSnap = snapsPrefixes.some((prefix) => origin.startsWith(prefix));
    const scopes: Record<string, Json> = {};
    const scopeStrings = isSnap
      ? []
      : chainIds.map((chainId) => `eip155:${parseInt(chainId, 16)}`);
    scopeStrings.push('wallet:eip155');

    scopeStrings.forEach((scopeString) => {
      const caipAccounts = ethAccounts.map(
        (account) => `${scopeString}:${account}`,
      );
      scopes[scopeString] = {
        methods: [],
        notifications: [],
        accounts: caipAccounts,
      };
    });

    permissions[Caip25EndowmentPermissionName] = {
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
  }

  return state;
}
