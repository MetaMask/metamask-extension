import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import { getIsBasicFunctionalityConsolidationGateEnabled } from '../../../shared/lib/basic-functionality-consolidation-gate';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import type { ProfileMetricsControllerInitMessenger } from './messengers';
import type { MessengerClientInitFunction } from './types';

const isTestEnvironment = Boolean(process.env.IN_TEST);

const initialDelayDuration = isTestEnvironment ? 1000 : 10 * 60 * 1000;

/**
 * Initialize the profile metrics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger used to read remote feature
 * flags at evaluation time.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.getMessengerClient - A function to get other initialized controllers.
 * @returns The initialized controller.
 */
export const ProfileMetricsControllerInit: MessengerClientInitFunction<
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
  ProfileMetricsControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const analyticsController = getMessengerClient('AnalyticsController');
  const appStateController = getMessengerClient('AppStateController');
  const preferencesController = getMessengerClient('PreferencesController');

  const isBftcGateOn = () => {
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

  const assertUserOptedIn = () =>
    appStateController.state.pna25Acknowledged === true &&
    preferencesController.state.useExternalServices === true &&
    (isBftcGateOn() || analyticsController.state.optedIn === true);

  const messengerClient = new ProfileMetricsController({
    messenger: controllerMessenger,
    state: persistedState.ProfileMetricsController,
    interval: isTestEnvironment ? 1000 : 10 * 1000,
    initialDelayDuration,
    assertUserOptedIn,
    getMetaMetricsId: () => analyticsController.state.analyticsId,
  });

  return {
    messengerClient,
  };
};
