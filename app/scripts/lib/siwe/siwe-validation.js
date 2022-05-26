import { stripHexPrefix } from 'ethereumjs-util';
import { ParsedMessage } from '@spruceid/siwe-parser';

const msgHexToText = (hex) => {
  try {
    const stripped = stripHexPrefix(hex);
    const buff = Buffer.from(stripped, 'hex');
    return buff.length === 32 ? hex : buff.toString('utf8');
  } catch (e) {
    return hex;
  }
};

const detectSIWE = (msgParams) => {
  try {
    const { data, from, origin = null } = msgParams;
    const message = msgHexToText(data);
    const messageData = new ParsedMessage(message);
    const isMatchingAddress = from === messageData.address;
    let isSIWEDomainValid = false;

    if (origin) {
      const { host } = new URL(origin);
      isSIWEDomainValid = messageData.domain === host;
    }

    return {
      isSIWEMessage: true,
      isSIWEDomainValid,
      isMatchingAddress,
      messageData,
    };
  } catch (error) {
    // ignore error, it's not a valid SIWE message
    return {
      isSIWEMessage: false,
      isSIWEDomainValid: false,
      isMatchingAddress: false,
      messageData: null,
    };
  }
};
export default detectSIWE;
