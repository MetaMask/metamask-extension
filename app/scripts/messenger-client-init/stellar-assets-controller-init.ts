import {
  StellarAssetsController,
  type StellarAssetsControllerMessenger,
} from '../controllers/stellar-assets-controller';
import { isMultichainFeatureEnabled } from '../../../shared/lib/multichain-feature-flags';
import { type StellarAssetsControllerInitMessenger } from './messengers/stellar-assets-controller-messenger';
import { MessengerClientInitFunction } from './types';

function getIsStellarEnabled(
  initMessenger: StellarAssetsControllerInitMessenger,
): boolean {
  try {
    const remoteFeatureFlagState = initMessenger.call(
      'RemoteFeatureFlagController:getState',
    );

    return (
      isMultichainFeatureEnabled(
        // Individual feature flag for stellar accounts
        remoteFeatureFlagState?.remoteFeatureFlags?.stellarAccounts,
      ) &&
      isMultichainFeatureEnabled(
        // Individual feature flag for asset enrichment
        remoteFeatureFlagState?.remoteFeatureFlags?.stellarAssetEnrichment,
      )
    );
  } catch {
    return false;
  }
}

/**
 * Init function for the StellarAssetsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger for feature flag access.
 * @returns The initialized controller.
 */
export const StellarAssetsControllerInit: MessengerClientInitFunction<
  StellarAssetsController,
  StellarAssetsControllerMessenger,
  StellarAssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  const messengerClient = new StellarAssetsController({
    messenger: controllerMessenger,
    state: persistedState.StellarAssetsController,
    isEnabled: () => getIsStellarEnabled(initMessenger),
  });

  return { messengerClient };
};
