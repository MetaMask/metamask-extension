import log from 'loglevel';
import { RemoteFeatureFlagController } from '@metamask/remote-feature-flag-controller';
import MetamaskController from '../metamask-controller';

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
    const remoteController: RemoteFeatureFlagController =
      metamaskController.remoteFeatureFlagController;
    // initialize the request to fetch remote feature flags
    await remoteController.updateRemoteFeatureFlags();
  } catch (error) {
    log.error('Error initializing remote feature flags:', error);
  }
}
