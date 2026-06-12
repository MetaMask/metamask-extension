'use no memo';

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';

import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useTransferRecipient } from '../../../components/confirm/info/hooks/useTransferRecipient';

const TRANSFER_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
];

export function useTokenContractAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const recipient = useTransferRecipient();
  const chainId = currentConfirmation?.chainId;
  const transactionType = currentConfirmation?.type;

  const isTransfer =
    transactionType !== undefined &&
    TRANSFER_TRANSACTION_TYPES.includes(transactionType);

  const { value: isTokenContract } = useAsyncResult(async () => {
    if (!isTransfer || !recipient || !chainId) {
      return false;
    }

    const tokenDetails = await getTokenStandardAndDetailsByChain(
      recipient,
      undefined,
      undefined,
      chainId,
    );

    return Boolean(tokenDetails?.standard);
  }, [isTransfer, recipient, chainId]);

  return useMemo(() => {
    if (!isTokenContract) {
      return [];
    }

    return [
      {
        key: 'tokenContractAddress',
        field: RowAlertKey.InteractingWith,
        message: t('smartContractAddressWarning'),
        reason: t('tokenContractWarning'),
        severity: Severity.Warning,
      },
    ];
  }, [isTokenContract, t]);
}
