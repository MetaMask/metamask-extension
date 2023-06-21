import React from 'react';
import * as Sentry from '@sentry/browser';
import {
  I18NMessageDict,
  I18NSubstitution,
  getMessage as getMessageShared,
} from '../../../shared/modules/i18n';
import { NETWORK_TYPES } from '../../../shared/constants/network';

/**
 * Returns a localized message for the given key
 *
 * @param localeCode - The code for the current locale
 * @param localeMessages - The map of messages for the current locale
 * @param key - The message key
 * @param substitutions - A list of message substitution replacements can replace $n in given message
 * @returns The localized message
 */
export const getMessage = (
  localeCode: string,
  localeMessages: I18NMessageDict,
  key: string,
  substitutions?: string[],
): JSX.Element | string | null => {
  const hasReactSubstitutions = substitutions?.some(
    (element) =>
      element !== null &&
      (typeof element === 'function' || typeof element === 'object'),
  );

  const join = hasReactSubstitutions
    ? (parts: I18NSubstitution[]) => <span> {parts} </span>
    : undefined;

  const onError = (error: Error) => {
    Sentry.captureException(error);
  };

  return getMessageShared(
    localeCode,
    localeMessages,
    key,
    substitutions,
    onError,
    join,
  );
};

export function getNetworkLabelKey(network: string): string {
  if (network === NETWORK_TYPES.LINEA_GOERLI) {
    return 'lineaGoerli';
  }
  if (network === NETWORK_TYPES.LINEA_MAINNET) {
    return 'lineaMainnet';
  }
  return network;
}
