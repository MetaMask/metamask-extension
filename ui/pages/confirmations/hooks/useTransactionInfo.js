import { useSelector } from 'react-redux';

import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { getSelectedInternalAccount } from '../../../selectors';

export const useTransactionInfo = (txData = {}) => {
  const { allNftContracts } = useSelector((state) => state.metamask);
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);
  const { chainId } = txData;

  const isNftTransfer = Boolean(
    allNftContracts?.[selectedInternalAccount.address]?.[chainId]?.find(
      (contract) => {
        return isEqualCaseInsensitive(contract.address, txData.txParams.to);
      },
    ),
  );

  return { isNftTransfer };
};
