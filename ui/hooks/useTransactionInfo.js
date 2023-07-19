import { useSelector } from 'react-redux';
import { getProviderConfig } from '../ducks/metamask/metamask';

import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

export const useTransactionInfo = (txData = {}) => {
  const { allNftContracts, selectedAddress } = useSelector(
    (state) => state.metamask,
  );
  const { caipChainId } = useSelector(getProviderConfig);

  const isNftTransfer = Boolean(
    allNftContracts?.[selectedAddress]?.[caipChainId]?.find((contract) => {
      return isEqualCaseInsensitive(contract.address, txData.txParams.to);
    }),
  );

  return { isNftTransfer };
};
