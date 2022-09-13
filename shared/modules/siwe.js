import { stripHexPrefix } from 'ethereumjs-util';
import { ParsedMessage } from '@spruceid/siwe-parser';
import log from 'loglevel';

const msgHexToText = (hex) => {
  try {
    const stripped = stripHexPrefix(hex);
    const buff = Buffer.from(stripped, 'hex');
    return buff.length === 32 ? hex : buff.toString('utf8');
  } catch (e) {
    log.error(e);
    return hex;
  }
};

/**
 * A locally defined object used to provide data to identify a Sign-In With Ethereum (SIWE)(EIP-4361) message and provide the parsed message
 *
 * @typedef localSIWEObject
 * @param {boolean} isSIWEMessage - Does the intercepted message conform to the SIWE specification?
 * @param {ParsedMessage} parsedMessage - The data parsed out of the message
 */

/**
 * This function intercepts a sign message, detects if it's a
 * Sign-In With Ethereum (SIWE)(EIP-4361) message, and returns an object with
 * relevant SIWE data.
 *
 * {@see {@link https://eips.ethereum.org/EIPS/eip-4361}}
 *
 * @param {object} msgParams - The params of the message to sign
 * @returns {localSIWEObject}
 */
export const detectSIWE = (msgParams) => {
  try {
    const { data } = msgParams;
    const message = msgHexToText(data);
    const parsedMessage = new ParsedMessage(message);

    return {
      isSIWEMessage: true,
      parsedMessage,
    };
  } catch (error) {
    // ignore error, it's not a valid SIWE message
    return {
      isSIWEMessage: false,
      parsedMessage: null,
    };
  }
};

/**
 * Takes in a parsed Sign-In with Ethereum Message (EIP-4361)
 * and generates an array of label-value pairs
 *
 * @param {object} parsedMessage - A parsed SIWE message with message contents
 * @param {Function} t - i18n function
 * @returns {Array} An array of label-value pairs with the type of the value as the label
 */
export const formatMessageParams = (parsedMessage, t) => {
  const output = [];

  const {
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
    notBefore,
    requestId,
    resources,
  } = parsedMessage;

  if (statement) {
    output.push({
      label: t('SIWELabelMessage'),
      value: statement,
    });
  }

  if (uri) {
    output.push({
      label: t('SIWELabelURI'),
      value: uri,
    });
  }

  if (version) {
    output.push({
      label: t('SIWELabelVersion'),
      value: version,
    });
  }

  if (chainId) {
    output.push({
      label: t('SIWELabelChainID'),
      value: chainId,
    });
  }

  if (nonce) {
    output.push({
      label: t('SIWELabelNonce'),
      value: nonce,
    });
  }

  if (issuedAt) {
    output.push({
      label: t('SIWELabelIssuedAt'),
      value: issuedAt,
    });
  }

  if (expirationTime) {
    output.push({
      label: t('SIWELabelExpirationTime'),
      value: expirationTime,
    });
  }

  if (notBefore) {
    output.push({
      label: t('SIWELabelNotBefore'),
      value: notBefore,
    });
  }

  if (requestId) {
    output.push({
      label: t('SIWELabelRequestID'),
      value: requestId,
    });
  }

  if (resources && resources.length > 0) {
    output.push({
      label: t('SIWELabelResources', [resources.length]),
      value: resources
        .reduce((previous, resource) => `${previous}${resource}\n`, '')
        .trim(),
    });
  }

  return output;
};
