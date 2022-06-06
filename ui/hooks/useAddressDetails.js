import { useSelector } from 'react-redux';

import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import {
  getAddressBook,
  getMetaMaskIdentities,
  getTokenList,
  getUseTokenDetection,
} from '../selectors';
import { shortenAddress } from '../helpers/utils/util';

const useAddressDetails = (toAddress) => {
  const addressBook = useSelector(getAddressBook);
  const identities = useSelector(getMetaMaskIdentities);
  const tokenList = useSelector(getTokenList);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const checksummedAddress = toChecksumHexAddress(toAddress);

  if (!toAddress) {
    return {};
  }
  const addressBookEntryObject = addressBook.find(
    (entry) => entry.address === checksummedAddress,
  );
  if (addressBookEntryObject?.name) {
    return { toName: addressBookEntryObject.name, isTrusted: true };
  }
  if (identities[toAddress]?.name) {
    return { toName: identities[toAddress].name, isTrusted: true };
  }
  if (process.env.TOKEN_DETECTION_V2) {
    if (tokenList[toAddress]?.name) {
      return { toName: tokenList[toAddress].name, isTrusted: true };
    }
  } else {
    const casedTokenList = useTokenDetection
      ? tokenList
      : Object.keys(tokenList).reduce((acc, base) => {
          return {
            ...acc,
            [base.toLowerCase()]: tokenList[base],
          };
        }, {});
    if (casedTokenList[toAddress]?.name) {
      return { toName: casedTokenList[toAddress].name, isTrusted: true };
    }
  }
  return {
    toName: shortenAddress(checksummedAddress),
    isTrusted: false,
  };
};

export default useAddressDetails;
