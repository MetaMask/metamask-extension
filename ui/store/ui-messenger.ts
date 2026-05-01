import type { AuthenticationController } from '@metamask/profile-sync-controller';
import { submitRequestToBackground } from './background-connection';

type UiMessengerAllowedActions =
  AuthenticationController.AuthenticationControllerGetBearerTokenAction;

/**
 * Typed messenger surface for UI → background controller actions.
 * Calls are routed through `messengerCall` on the background connection.
 */
export const uiMessenger = {
  call(
    action: UiMessengerAllowedActions['type'],
  ): ReturnType<UiMessengerAllowedActions['handler']> {
    return submitRequestToBackground('messengerCall', [
      action,
      [],
    ]) as ReturnType<UiMessengerAllowedActions['handler']>;
  },
};
