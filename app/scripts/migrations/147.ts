import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type previousSessionDataShape = {
  profile: {
    identifierId: string;
    profileId: string;
  };
  accessToken: string;
  expiresIn: string;
};

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    AuthenticationController?: {
      isSignedIn: boolean;
      sessionData?: previousSessionDataShape;
    };
  };
};

export const version = 147;

function transformState(state: VersionedData['data']) {
  if (
    !hasProperty(state, 'AuthenticationController') ||
    !isObject(state.AuthenticationController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid AuthenticationController state: ${typeof state.AuthenticationController}`,
      ),
    );
    return state;
  }

  // If the sessionData is a previous version, we need to delete it
  if (
    hasProperty(state.AuthenticationController, 'sessionData') &&
    isObject(state.AuthenticationController.sessionData) &&
    hasProperty(state.AuthenticationController.sessionData, 'accessToken')
  ) {
    state.AuthenticationController.sessionData = undefined;
    state.AuthenticationController.isSignedIn = false;
  }

  return state;
}

/**
 * This migration resets sessionData and isSignedIn if using the old sessionData state shape.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
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
