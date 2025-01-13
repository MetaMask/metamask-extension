import type MetamaskController from '../../../metamask-controller';

/**
 * Signs a user in based on the current state of the application
 * If the conditions in order to sign-in the user are not met, nothing will happen
 * This function exists to automatically sign-in users that have the
 * conditions met but upgraded the extension from a pre-authentication era
 *
 * @param metamaskControllerInstance
 * @returns
 */
export const performAutoSignIn = async (
  metamaskControllerInstance: MetamaskController,
) => {
  if (!metamaskControllerInstance) {
    return;
  }

  const { participateInMetaMetrics } =
    metamaskControllerInstance.metaMetricsController.state;
  const { isSignedIn } =
    metamaskControllerInstance.authenticationController.state;
  const { isProfileSyncingEnabled } =
    metamaskControllerInstance.userStorageController.state;
  const { useExternalServices } =
    metamaskControllerInstance.preferencesController.state;
  const { isUnlocked } = metamaskControllerInstance.keyringController.state;

  const shouldPerformSignIn =
    (participateInMetaMetrics || isProfileSyncingEnabled) &&
    !isSignedIn &&
    isUnlocked &&
    useExternalServices;

  if (shouldPerformSignIn) {
    await metamaskControllerInstance.authenticationController.performSignIn();
  }
};
