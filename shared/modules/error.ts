import log from 'loglevel';
import {
  getErrorMessage as _getErrorMessage,
  hasProperty,
  isObject,
  isErrorWithMessage,
} from '@metamask/utils';

export { isErrorWithMessage } from '@metamask/utils';

/**
 * Attempts to obtain the message from a possible error object, defaulting to an
 * empty string if it is impossible to do so.
 *
 * @param error - The possible error to get the message from.
 * @returns The message if `error` is an object with a `message` property;
 * the string version of `error` if it is not `undefined` or `null`; otherwise
 * an empty string.
 */
// TODO: Remove completely once changes implemented in @metamask/utils
export function getErrorMessage(error: unknown): string {
  return isErrorWithMessage(error) &&
    hasProperty(error, 'cause') &&
    isObject(error.cause) &&
    hasProperty(error.cause, 'message') &&
    typeof error.cause.message === 'string'
    ? error.cause.message
    : _getErrorMessage(error);
}

export function logErrorWithMessage(error: unknown) {
  log.error(isErrorWithMessage(error) ? getErrorMessage(error) : error);
}

export enum OAuthErrorMessages {
  // Error message for Authentication Server when failed to get the auth token
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FAILED_TO_GET_AUTH_TOKEN_ERROR = 'Failed to get auth token',

  // Error message for Authentication Server when failed to refresh the auth token
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FAILED_TO_GET_AUTH_TOKEN_REFRESH_ERROR = 'Failed to refresh auth token',

  // Error message for Authentication Server when failed to renew the refresh token
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FAILED_TO_RENEW_REFRESH_TOKEN = 'Failed to renew refresh token',

  // Error message for Authentication Server when failed to revoke the refresh token
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FAILED_TO_REVOKE_TOKEN = 'Failed to revoke refresh token',

  // Error message from the Identity API when the user cancels the login
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  USER_CANCELLED_LOGIN_ERROR = 'The user did not approve access.',

  // Error message from the Identity API when the user cancels the login in Firefox
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  USER_CANCELLED_LOGIN_ERROR_FIREFOX = 'User cancelled or denied access.',

  // Error message when no redirect URL is found from the Browser WebAuthentication flow
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NO_REDIRECT_URL_FOUND_ERROR = 'No redirect URL found',

  // Error message when the OAuth state is invalid in the redirect URL from the Browser WebAuthentication flow
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  INVALID_OAUTH_STATE_ERROR = 'Invalid OAuth state',
}

/**
 * Checks if the Web Authentication error is a user cancelled error.
 *
 * @param error - The error to check.
 * @returns True if the error is a user cancelled login error, false otherwise.
 */
export function isUserCancelledLoginError(error: Error | undefined): boolean {
  // NOTE: Firefox and chrome have different error messages for user cancelled the social login window.
  return (
    error?.message === OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR ||
    error?.message === OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR_FIREFOX
  );
}

/**
 * Creates an error instance with readable message and cause for sentry.
 *
 * @param message - The message to create the error with.
 * @param cause - The cause of the error.
 * @returns The created error.
 */
export function createSentryError(message: string, cause: unknown): Error {
  const error = new Error(message) as Error & { cause: unknown };
  error.cause = cause;
  return error;
}

/**
 * Creates an error instance from a network request response.
 *
 * @param response - The response from the network request.
 * @param errorPrefix - The prefix to add to the error message.
 * @returns The created error.
 */
export async function createErrorFromNetworkRequest(
  response: Response,
  errorPrefix?: string,
): Promise<Error> {
  const contentType = response.headers?.get('content-type');
  const statusCode = response.status;
  const networkErrorMessagePrefix = errorPrefix ? `${errorPrefix}: ` : '';

  try {
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      const errorMessage = json?.error ?? json?.message ?? 'Unknown error';
      const networkError = `${networkErrorMessagePrefix}error: ${errorMessage}, statusCode: ${statusCode}`;
      return new Error(networkError);
    } else if (contentType?.includes('text/plain')) {
      const text = await response.text();
      const networkError = `${networkErrorMessagePrefix} error: ${text}, statusCode: ${statusCode}`;
      return new Error(networkError);
    }

    const error =
      'data' in response && typeof response.data === 'string'
        ? response.data
        : 'Unknown error';
    const networkError = `${networkErrorMessagePrefix} error: ${error}, statusCode: ${statusCode}`;
    return new Error(networkError);
  } catch {
    return new Error(`${networkErrorMessagePrefix} HTTP ${statusCode} error`);
  }
}
