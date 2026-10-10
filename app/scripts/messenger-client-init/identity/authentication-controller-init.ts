import {
  AuthenticationControllerState,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { loadAuthenticationConfig } from '../../../../shared/lib/authentication';
import { getIsBasicFunctionalityConsolidationGateEnabled } from '../../../../shared/lib/basic-functionality-consolidation-gate';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { MessengerClientInitFunction } from '../types';
import {
  AuthenticationControllerInitMessenger,
  AuthenticationControllerMessenger,
} from '../messengers/identity';

/**
 * Initialize the Authentication controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.getMessengerClient - A function to get other initialized controllers.
 * @returns The initialized controller.
 */
export const AuthenticationControllerInit: MessengerClientInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger,
  AuthenticationControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const env = loadAuthenticationConfig();
  const preferencesController = getMessengerClient('PreferencesController');

  const isSocialPairingEnabled = () => {
    const { remoteFeatureFlags } = initMessenger.call(
      'RemoteFeatureFlagController:getState',
    );
    // Resolve through the same manifest-merged path as the UI selector so
    // `.manifest-overrides.json` / e2e manifestFlags cannot enable consolidation
    // in the UI while the background gate ignores them.
    const mergedFlags = getRemoteFeatureFlags({
      metamask: { remoteFeatureFlags },
    });
    return getIsBasicFunctionalityConsolidationGateEnabled({
      remoteFeatureFlags: mergedFlags,
      preferencesState: preferencesController.state,
    });
  };

  const messengerClient = new AuthenticationController({
    messenger: controllerMessenger,
    state:
      persistedState.AuthenticationController as AuthenticationControllerState,
    metametrics: {
      getMetaMetricsId: () =>
        initMessenger.call('AnalyticsController:getState').analyticsId,
      agent: Platform.EXTENSION,
      getAppVersion: () => process.env.METAMASK_VERSION,
    },
    config: {
      env,
      isSocialPairingEnabled,
    },
  });

  return {
    messengerClient,
  };
};
