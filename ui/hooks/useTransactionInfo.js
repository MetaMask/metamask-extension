import { useSelector } from 'react-redux';

import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

export const useTransactionInfo = (txData = {}) => {
  const {
    allNftContracts,
    selectedAddress,
    provider: { chainId },
  } = useSelector((state) => state.metamask);

  const isNftTransfer = Boolean(
    allNftContracts?.[selectedAddress]?.[chainId]?.find((contract) => {
      return isEqualCaseInsensitive(contract.address, txData.txParams.to);
    }),
  );

  return { isNftTransfer };
};
