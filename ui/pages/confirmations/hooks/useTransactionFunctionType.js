import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  getKnownMethodData,
  selectNetworkConfigurationByChainId,
} from '../../../selectors';
import { getTransactionTypeTitle } from '../../../helpers/utils/transactions.util';
import { getMethodName } from '../../../helpers/utils/metrics';

import { useI18nContext } from '../../../hooks/useI18nContext';

export const useTransactionFunctionType = (txData = {}) => {
  const t = useI18nContext();
  const { chainId, txParams } = txData;

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const methodData = useSelector(
    (state) => getKnownMethodData(state, txParams?.data) || {},
  );

  if (!txParams) {
    return {};
  }

  const { nativeCurrency } = networkConfiguration ?? {};

  const isTokenApproval =
    txData.type === TransactionType.tokenMethodSetApprovalForAll ||
    txData.type === TransactionType.tokenMethodApprove ||
    txData.type === TransactionType.tokenMethodIncreaseAllowance;

  const isContractInteraction =
    txData.type === TransactionType.contractInteraction;

  const isTransactionFromDapp =
    (isTokenApproval || isContractInteraction) &&
    txData.origin !== ORIGIN_METAMASK;

  let functionType = isTransactionFromDapp
    ? getMethodName(methodData?.name)
    : undefined;

  if (!functionType) {
    functionType = txData.type
      ? getTransactionTypeTitle(t, txData.type, nativeCurrency)
      : t('contractInteraction');
  }

  return { functionType };
};
