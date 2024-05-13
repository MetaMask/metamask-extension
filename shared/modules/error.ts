import log from 'loglevel';
import {
  getErrorMessage as _getErrorMessage,
  hasProperty,
  isObject,
  isErrorWithMessage,
} from '@metamask/utils';
import { messageWithCauses } from 'pony-cause';

export { isErrorWithMessage } from '@metamask/utils';

/**
 * Different ways to reduce nested cause error messages
 */
export enum Causes {
  // Get the topmost error message
  Top = 'top',
  // Get the lowest cause message
  Bottom = 'bottom',
  // Concatenate cause messages with ': '
  Full = 'full',
}

/**
 * Attempts to obtain the message from a possible error object, defaulting to an
 * empty string if it is impossible to do so.
 *
 * @param error - The possible error to get the message from.
 * @param causeHandling
 * @returns The message if `error` is an object with a `message` property;
 * the string version of `error` if it is not `undefined` or `null`; otherwise
 * an empty string.
 */
// TODO: Remove completely once changes implemented in @metamask/utils
export function getErrorMessage(
  error: unknown,
  causeHandling = Causes.Bottom,
): string {
  if (isErrorWithMessage(error)) {
    if (hasProperty(error, 'cause') && isObject(error.cause)) {
      switch (causeHandling) {
        case Causes.Top:
          return _getErrorMessage(error);
        case Causes.Bottom:
          // TODO: recurse? or rename enum?
          return hasProperty(error.cause, 'message') &&
            typeof error.cause.message === 'string'
            ? error.cause.message
            : _getErrorMessage(error);
        case Causes.Full: {
          return messageWithCauses(error as unknown as Error);
        }
        default:
          return _getErrorMessage(error);
      }
    }
  }
  return _getErrorMessage(error);
}

export function logErrorWithMessage(error: unknown) {
  log.error(getErrorMessage(error));
}
