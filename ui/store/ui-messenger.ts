import type { AuthenticationController } from '@metamask/profile-sync-controller';
import { submitRequestToBackground } from './background-connection';

type UiMessengerAllowedActions =
  AuthenticationController.AuthenticationControllerGetBearerTokenAction;

const GET_BEARER_TOKEN_ACTION: UiMessengerAllowedActions['type'] =
  'AuthenticationController:getBearerToken';

let inFlightGetBearerToken: Promise<string | undefined> | null = null;

function messengerCallGetBearerToken(): Promise<string | undefined> {
  if (!inFlightGetBearerToken) {
    inFlightGetBearerToken = submitRequestToBackground<
      string | undefined
    >('messengerCall', [GET_BEARER_TOKEN_ACTION, []]).finally(() => {
      inFlightGetBearerToken = null;
    });
  }
  return inFlightGetBearerToken;
}

/**
 * Typed messenger surface for UI → background controller actions.
 * Calls are routed through `messengerCall` on the background connection.
 *
 * `AuthenticationController:getBearerToken` uses concurrent single-flight:
 * parallel callers share one in-flight background request until it settles.
 */
export const uiMessenger = {
  call(
    action: UiMessengerAllowedActions['type'],
  ): ReturnType<UiMessengerAllowedActions['handler']> {
    if (action === GET_BEARER_TOKEN_ACTION) {
      return messengerCallGetBearerToken() as ReturnType<
        UiMessengerAllowedActions['handler']
      >;
    }
    return submitRequestToBackground('messengerCall', [
      action,
      [],
    ]) as ReturnType<UiMessengerAllowedActions['handler']>;
  },
};
