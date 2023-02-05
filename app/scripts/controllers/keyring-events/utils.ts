import { has, isError } from 'lodash';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';

/**
 * Returns true if text resembles MV3 error message.
 *
 * @param _text
 */
const isMv3ErrorMessage = (_text: string): boolean => {
  const text = _text.toLowerCase();
  const mv3ErrorText = [
    'navigator.usb',
    'navigator.hid',
    'document is not defined',
  ];

  return mv3ErrorText.some((errorText) => text.includes(errorText));
};

/**
 * Determines if error is provoked by manifest v3 changes,
 * e.g. WebUSB incompatibility, WebHID incompatibility,
 * and general DOM access.
 *
 * @param error
 */
export const isServiceWorkerMv3Error = (error: any): boolean => {
  console.error('isServiceWorkerMv3Error', { error });

  const isNotError = !isError(error);
  if (!isManifestV3 || isNotError) {
    return false;
  }

  const isUserSet = has(error, 'cause.message');

  if (isUserSet) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return isMv3ErrorMessage(error.cause.message);
  }

  const errorText = error.message || error.stack || error.toString();

  return isMv3ErrorMessage(errorText);
};
