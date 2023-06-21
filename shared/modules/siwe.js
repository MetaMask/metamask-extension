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
