import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import type { MessengerClientInitFunction } from './types';

const isTestEnvironment = Boolean(process.env.IN_TEST);

const initialDelayDuration = isTestEnvironment ? 1000 : 10 * 60 * 1000;

/**
 * Initialize the profile metrics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.getMessengerClient - A function to get other initialized controllers.
 * @returns The initialized controller.
 */
export const ProfileMetricsControllerInit: MessengerClientInitFunction<
  ProfileMetricsController,
  ProfileMetricsControllerMessenger
> = ({ controllerMessenger, persistedState, getMessengerClient }) => {
  const metaMetricsController = getMessengerClient('MetaMetricsController');
  const appStateController = getMessengerClient('AppStateController');
  const assertUserOptedIn = () =>
    appStateController.state.pna25Acknowledged === true &&
    metaMetricsController.state.participateInMetaMetrics === true;

  const messengerClient = new ProfileMetricsController({
    messenger: controllerMessenger,
    state: persistedState.ProfileMetricsController,
    interval: isTestEnvironment ? 1000 : 10 * 1000,
    initialDelayDuration,
    assertUserOptedIn,
    getMetaMetricsId: () => metaMetricsController.getMetaMetricsId(),
  });

  return {
    messengerClient,
  };
};
