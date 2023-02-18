import { useI18nContext } from './useI18nContext';
import { useSelector } from 'react-redux';

import { TransactionType } from '../../shared/constants/transaction';
import { getKnownMethodData } from '../selectors';
import { getNativeCurrency } from '../ducks/metamask/metamask';
import { getTransactionTypeTitle } from '../helpers/utils/transactions.util';
import { getMethodName } from '../helpers/utils/metrics';

export const useTransactionFunctionType = (txData) => {
  const t = useI18nContext();
  const nativeCurrency = useSelector(getNativeCurrency);
  const { txParams } = txData;
  const methodData = useSelector(
    (state) => getKnownMethodData(state, txParams.data) || {},
  );

  const isTokenApproval =
    txData.type === TransactionType.tokenMethodSetApprovalForAll ||
    txData.type === TransactionType.tokenMethodApprove;

  const isContractInteraction =
    txData.type === TransactionType.contractInteraction;

  const isContractInteractionFromDapp =
    (isTokenApproval || isContractInteraction) && txData.origin !== 'metamask';
  let functionType;
  if (isContractInteractionFromDapp) {
    const { name } = methodData;
    functionType = getMethodName(name);
  }

  if (!functionType) {
    if (txData.type) {
      functionType = getTransactionTypeTitle(t, txData.type, nativeCurrency);
    } else {
      functionType = t('contractInteraction');
    }
  }
  return { functionType };
};
