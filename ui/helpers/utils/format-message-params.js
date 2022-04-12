/**
 * Takes in aparsed Sign-In with Ethereum Message (EIP-4361)
 * and generates an array of label-value pairs
 *
 * @param {Object} parsedMessage - A parsed siwe message with message contents
 * @returns {Array} An array of label-value pairs with the type of the value as the label
 */
export const formatParams = (parsedMessage) => {
  try {
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
        label: 'Message:',
        value: statement,
      });
    }

    if (uri) {
      output.push({
        label: 'URI:',
        value: uri,
      });
    }

    if (version) {
      output.push({
        label: 'Version:',
        value: version,
      });
    }

    if (chainId) {
      output.push({
        label: 'Chain ID:',
        value: chainId,
      });
    }

    if (nonce) {
      output.push({
        label: 'Nonce:',
        value: nonce,
      });
    }

    if (issuedAt) {
      output.push({
        label: 'Issued at:',
        value: issuedAt,
      });
    }

    if (expirationTime) {
      output.push({
        label: 'Expires At:',
        value: expirationTime,
      });
    }

    // not in design
    if (notBefore) {
      output.push({
        label: 'Not Before:',
        value: notBefore,
      });
    }

    // not in design
    if (requestId) {
      output.push({
        label: 'Request ID',
        value: requestId,
      });
    }

    if (resources && resources.length > 0) {
      output.push({
        label: `Resources: ${resources.length}`,
        value: resources
          .reduce((previous, resource) => `${previous}${resource}\n`, '')
          .trim(),
      });
    }

    return output;
  } catch (error) {
    return [];
  }
};

export default formatParams;
