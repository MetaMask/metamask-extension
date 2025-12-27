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
  // Error message from the Identity API when the user cancels the login
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  USER_CANCELLED_LOGIN_ERROR = 'The user did not approve access.',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  USER_CANCELLED_LOGIN_ERROR_FIREFOX = 'User cancelled or denied access.',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NO_REDIRECT_URL_FOUND_ERROR = 'No redirect URL found',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NO_AUTH_CODE_FOUND_ERROR = 'No auth code found',
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
