import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 155;

/**
 * This migration removes the `bridgeStatusState` property from the BridgeStatusController state.
 *
 * If the BridgeStatusController is not found or is not an object, the migration logs an error,
 * but otherwise leaves the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the tokens property.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasProperty(state, 'BridgeStatusController')) {
    return state;
  }

  const bridgeStatusControllerState = state.BridgeStatusController;

  if (!isObject(bridgeStatusControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: BridgeStatusController is type '${typeof bridgeStatusControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (hasProperty(bridgeStatusControllerState, 'bridgeStatusState')) {
    if (isObject(bridgeStatusControllerState.bridgeStatusState)) {
      state.BridgeStatusController = {
        ...bridgeStatusControllerState.bridgeStatusState,
      };

      // Remove the bridgeStatusState property from the BridgeStatusController state.
      delete bridgeStatusControllerState.bridgeStatusState;
    }
  }

  return state;
}
