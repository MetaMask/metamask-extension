import log from 'loglevel';
import MetamaskController from '../metamask-controller';
import { RemoteFeatureFlagController } from '@metamask/remote-feature-flag-controller';

/**
 * A variable to track the ongoing updateRemoteFeatureFlags request.
 * This ensures that multiple calls to updateRemoteFeatureFlags
 * do not trigger multiple requests simultaneously.
 */
let updatingPromise: Promise<void> | null = null;

/**
 * Updates remote feature flags by making a request to fetch them from the clientConfigApi.
 * This function is called when MM is initially loaded, as well as when our UI is opened.
 * If the request fails, the error will be logged but won't interrupt extension initialization.
 *
 * @param metamaskController - The MetaMask controller instance.
 * @returns A promise that resolves when the remote feature flags have been updated.
 */
export async function updateRemoteFeatureFlags(
  metamaskController: MetamaskController,
): Promise<void> {
  try {
    if (updatingPromise) {
      await updatingPromise;
      return;
    }

    const remoteController: RemoteFeatureFlagController =
      metamaskController.remoteFeatureFlagController;
    // initialize the request to fetch remote feature flags
    updatingPromise = remoteController.updateRemoteFeatureFlags();
    await updatingPromise;
  } catch (error) {
    log.error('Error initializing remote feature flags:', error);
  } finally {
    updatingPromise = null;
  }
}
