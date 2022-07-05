import { useSelector } from 'react-redux';

import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import {
  getAddressBook,
  getIsTokenDetectionInactiveOnMainnet,
  getMetaMaskIdentities,
  getTokenList,
} from '../selectors';
import { shortenAddress } from '../helpers/utils/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';

const useAddressDetails = (toAddress) => {
  const addressBook = useSelector(getAddressBook);
  const identities = useSelector(getMetaMaskIdentities);
  const tokenList = useSelector(getTokenList);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );
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
  const caseInSensitiveTokenList = isTokenDetectionInactiveOnMainnet
    ? STATIC_MAINNET_TOKEN_LIST
    : tokenList;
  if (caseInSensitiveTokenList[toAddress]?.name) {
    return {
      toName: caseInSensitiveTokenList[toAddress].name,
      isTrusted: true,
    };
  }
  return {
    toName: shortenAddress(checksummedAddress),
    isTrusted: false,
  };
};

export default useAddressDetails;
