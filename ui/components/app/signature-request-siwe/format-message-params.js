/**
 * Takes in a parsed Sign-In with Ethereum Message (EIP-4361)
 * and generates an array of label-value pairs
 *
 * @param {Object} parsedMessage - A parsed SIWE message with message contents
 * @param {Function} t - i18n function
 * @returns {Array} An array of label-value pairs with the type of the value as the label
 */
export const formatParams = (parsedMessage, t) => {
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
      label: t('SIWEMessageLabel'),
      value: statement,
    });
  }

  if (uri) {
    output.push({
      label: t('SIWEURILabel'),
      value: uri,
    });
  }

  if (version) {
    output.push({
      label: t('SIWEVersionLabel'),
      value: version,
    });
  }

  if (chainId) {
    output.push({
      label: t('SIWEChainIDLabel'),
      value: chainId,
    });
  }

  if (nonce) {
    output.push({
      label: t('SIWENonceLabel'),
      value: nonce,
    });
  }

  if (issuedAt) {
    output.push({
      label: t('SIWEIssuedAtLabel'),
      value: issuedAt,
    });
  }

  if (expirationTime) {
    output.push({
      label: t('SIWEExpirationTimeLabel'),
      value: expirationTime,
    });
  }

  // not in design
  if (notBefore) {
    output.push({
      label: t('SIWENotBeforeLabel'),
      value: notBefore,
    });
  }

  // not in design
  if (requestId) {
    output.push({
      label: t('SIWERequestIdLabel'),
      value: requestId,
    });
  }

  if (resources && resources.length > 0) {
    output.push({
      label: t('SIWEResourcesLabel', [resources.length]),
      value: resources
        .reduce((previous, resource) => `${previous}${resource}\n`, '')
        .trim(),
    });
  }

  return output;
};

export default formatParams;
