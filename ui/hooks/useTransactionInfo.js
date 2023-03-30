import { useSelector } from 'react-redux';
import { hexToDecimal } from '../../shared/modules/conversion.utils';

import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

export const useTransactionInfo = (txData = {}) => {
  const {
    allNftContracts,
    selectedAddress,
    provider: { chainId },
  } = useSelector((state) => state.metamask);

  const isNftTransfer = Boolean(
    allNftContracts?.[selectedAddress]?.[hexToDecimal(chainId)]?.find(
      (contract) => {
        return isEqualCaseInsensitive(contract.address, txData.txParams.to);
      },
    ),
  );

  return { isNftTransfer };
};
