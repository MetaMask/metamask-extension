import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    OnboardingController?: {
      completedOnboarding?: boolean;
    };
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    UserStorageController?: {
      isAccountSyncingReadyToBeDispatched?: boolean;
    };
  };
};

export const version = 137;

function transformState(state: VersionedData['data']) {
  if (
    !hasProperty(state, 'OnboardingController') ||
    !isObject(state.OnboardingController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid OnboardingController state: ${typeof state.OnboardingController}`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(state, 'UserStorageController') ||
    !isObject(state.UserStorageController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid UserStorageController state: ${typeof state.UserStorageController}`,
      ),
    );
    return state;
  }

  const { OnboardingController } = state;

  const currentCompletedOnboardingStatus =
    OnboardingController.completedOnboarding;

  if (currentCompletedOnboardingStatus) {
    state.UserStorageController.isAccountSyncingReadyToBeDispatched = true;
  } else {
    state.UserStorageController.isAccountSyncingReadyToBeDispatched = false;
  }

  return state;
}

/**
 * This migration sets isAccountSyncingReadyToBeDispatched to true if completedOnboarding is true
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
