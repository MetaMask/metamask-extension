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
