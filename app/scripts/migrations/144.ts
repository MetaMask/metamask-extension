import { cloneDeep } from 'lodash';
import { hasProperty, Hex, isObject, RuntimeObject } from '@metamask/utils';
import { nanoid } from 'nanoid';
import type {
  PermissionConstraint,
  PermissionControllerSubjects,
} from '@metamask/permission-controller';
import { SnapEndowments } from '@metamask/snaps-rpc-methods';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  addPermittedEthChainId,
  Caip25CaveatValue,
} from '@metamask/multichain';

type GenericPermissionControllerSubject =
  PermissionControllerSubjects<PermissionConstraint>[string];

export const version = 144;

/**
 * A map of the networks built into the extension at the time of this migration
 * to their chain IDs.
 *
 * @see https://github.com/MetaMask/metamask-extension/blob/5b5c04a16fb7937a6e9d59b1debe4713978ef39d/shared/constants/network.ts#L535
 */
const BUILT_IN_NETWORKS: ReadonlyMap<string, Hex> = new Map([
  ['sepolia', '0xaa36a7'],
  ['mainnet', '0x1'],
  ['linea-sepolia', '0xe705'],
  ['linea-mainnet', '0xe708'],
]);

/**
 * This migration adds the `endowment:permitted-chains` permission to all Snaps
 * that have the `endowment:ethereum-provider` permission, and sets the selected
 * chain ID for each Snap to the current selected network chain ID.
 *
 * This is necessary following the Amon Hen v2 changes to the network controller
 * and other related controllers, as the `endowment:permitted-chains` permission
 * is now required to use the Ethereum provider and switch networks.
 *
 * To simplify the use for Snaps, we automatically add the
 * `endowment:permitted-chains` permission with the current selected network
 * chain ID to all Snaps that have the `endowment:ethereum-provider` permission.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

/**
 * Transform the MetaMask extension state to add the
 * `endowment:permitted-chains` permission to all Snaps that have the
 * `endowment:ethereum-provider` permission.
 *
 * If the `PermissionController` or `SelectedNetworkController` state is not
 * found or is not an object, the state is returned as-is.
 *
 * @param state - The MetaMask extension state.
 * @returns The updated MetaMask extension state.
 */
function transformState(state: Record<string, unknown>) {
  const {
    NetworkController: networkControllerState,
    PermissionController: permissionControllerState,
    SelectedNetworkController: selectedNetworkControllerState,
  } = state;

  if (!networkControllerState || !isObject(networkControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `NetworkController` state not found or is not an object.',
      ),
    );

    return state;
  }

  if (
    !hasProperty(networkControllerState, 'selectedNetworkClientId') ||
    typeof networkControllerState.selectedNetworkClientId !== 'string'
  ) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `NetworkController.selectedNetworkClientId` is not a string.',
      ),
    );

    return state;
  }

  if (
    !hasProperty(networkControllerState, 'networkConfigurationsByChainId') ||
    !isObject(networkControllerState.networkConfigurationsByChainId)
  ) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `NetworkController.networkConfigurationsByChainId` is not an object.',
      ),
    );

    return state;
  }

  if (!permissionControllerState || !isObject(permissionControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `PermissionController` state not found or is not an object.',
      ),
    );

    return state;
  }

  if (!isObject(permissionControllerState.subjects)) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `PermissionController.subjects` state is not an object.',
      ),
    );

    return state;
  }

  if (
    !selectedNetworkControllerState ||
    !isObject(selectedNetworkControllerState)
  ) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `SelectedNetworkController` state not found or is not an object.',
      ),
    );

    return state;
  }

  if (!isObject(selectedNetworkControllerState.domains)) {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: `SelectedNetworkController.domains` state is not an object.',
      ),
    );

    return state;
  }

  const currentChainId = getChainId(
    networkControllerState.selectedNetworkClientId,
    networkControllerState.networkConfigurationsByChainId,
  );

  if (typeof currentChainId !== 'string') {
    global.sentry?.captureException?.(
      new Error(
        'Skipping migration: The chain ID resolved from the `NetworkController.selectedNetworkClientId` value is not a string.',
      ),
    );

    return state;
  }

  const updatedSubjects: string[] = [];

  // Add permission to use the current globally selected network to all Snaps
  // that have the `endowment:ethereum-provider` permission.
  const entries = Object.entries(permissionControllerState.subjects) as [
    string,
    GenericPermissionControllerSubject,
  ][];

  permissionControllerState.subjects = entries.reduce<
    PermissionControllerSubjects<PermissionConstraint>
  >((accumulator, [key, subject]) => {
    const permissionKeys = Object.keys(subject.permissions);
    const needsMigration = permissionKeys.includes(
      SnapEndowments.EthereumProvider,
    );

    if (!needsMigration) {
      return {
        ...accumulator,
        [key]: subject,
      };
    }

    updatedSubjects.push(key);

    const caveatValue = addPermittedEthChainId(
      getCaveat(subject),
      currentChainId as `0x${string}`,
    );

    const newSubject: GenericPermissionControllerSubject = {
      ...subject,
      permissions: {
        ...subject.permissions,
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: caveatValue,
            },
          ],
          date: Date.now(),
          id: nanoid(),
          invoker: key,
          parentCapability: Caip25EndowmentPermissionName,
        },
      },
    };

    return {
      ...accumulator,
      [key]: newSubject,
    };
  }, {});

  const currentDomains = selectedNetworkControllerState.domains;
  const domains = Object.fromEntries(
    updatedSubjects.map((subject) => [subject, currentChainId]),
  );

  selectedNetworkControllerState.domains = {
    ...currentDomains,
    ...domains,
  };

  return state;
}

/**
 * Get the existing `endowment:caip25` caveat value for a given subject, if any.
 * If the caveat does not exist, a new empty caveat value is returned.
 *
 * This function does not validate the structure of the existing caveat value,
 * and assumes that the existing value is valid.
 *
 * @param subject - The subject to get the existing caveat value for.
 * @returns The existing `endowment:caip25` caveat value.
 */
function getCaveat(
  subject: GenericPermissionControllerSubject,
): Caip25CaveatValue {
  const existingCaveat = subject.permissions[
    Caip25EndowmentPermissionName
  ]?.caveats?.find((caveat) => caveat.type === Caip25CaveatType);

  if (!existingCaveat) {
    return {
      isMultichainOrigin: false,
      optionalScopes: {},
      requiredScopes: {},
    };
  }

  return existingCaveat.value as Caip25CaveatValue;
}

function getChainId(
  networkClientId: string,
  networkConfigurationsByChainId: RuntimeObject,
): Hex | undefined {
  const configurationChainId = Object.entries(
    networkConfigurationsByChainId,
  ).find(([, config]) => {
    if (
      !isObject(config) ||
      !hasProperty(config, 'rpcEndpoints') ||
      !Array.isArray(config.rpcEndpoints)
    ) {
      return false;
    }

    return config.rpcEndpoints.some(
      (endpoint) =>
        isObject(endpoint) && endpoint.networkClientId === networkClientId,
    );
  });

  if (configurationChainId) {
    return configurationChainId[0] as Hex;
  }

  return BUILT_IN_NETWORKS.get(networkClientId);
}
