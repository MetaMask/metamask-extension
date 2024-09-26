import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 128;

type AlertControllerState = {
  alertEnabledness: {
    unconnectedAccount: boolean;
    web3ShimUsage: boolean;
  };
  unconnectedAccountAlertShownOrigins: unknown;
  web3ShimUsageOrigins: unknown;
};

/**
 * This migration resets the AlertController state to default values.
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
  if (!hasProperty(state, 'AlertController')) {
    global.sentry?.captureException?.(
      new Error(`state.AlertController is not defined`),
    );
    return state;
  } else if (!isObject(state.AlertController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.AlertController is ${typeof state.AlertController}`,
      ),
    );
    return state;
  }

  const alertController = state.AlertController as AlertControllerState;

  alertController.alertEnabledness = {
    unconnectedAccount: true,
    web3ShimUsage: true,
  };

  alertController.unconnectedAccountAlertShownOrigins = {};
  alertController.web3ShimUsageOrigins = {};

  return state;
}
