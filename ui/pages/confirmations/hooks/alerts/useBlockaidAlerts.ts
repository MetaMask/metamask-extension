import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SecurityAlertResponse } from '../../types/confirm';
import {
  REDESIGN_TRANSACTION_TYPES,
  SIGNATURE_TRANSACTION_TYPES,
} from '../../utils';
import {
  currentConfirmationSelector,
  currentSignatureRequestSecurityResponseSelector,
} from '../../selectors';
import { normalizeProviderAlert } from './utils';

const SUPPORTED_TRANSACTION_TYPES = [
  ...SIGNATURE_TRANSACTION_TYPES,
  ...REDESIGN_TRANSACTION_TYPES,
];

const IGNORED_RESULT_TYPES = [
  BlockaidResultType.Benign,
  BlockaidResultType.Loading,
];

type SecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
    transactions: TransactionMeta[];
  };
};

const useBlockaidAlerts = (): Alert[] => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as Record<string, any>;

  const securityAlertId = currentConfirmation?.securityAlertResponse
    ?.securityAlertId as string;

  const transactionType = currentConfirmation?.type as TransactionType;

  const signatureSecurityAlertResponse = useSelector(
    currentSignatureRequestSecurityResponseSelector,
  );

  const transactionSecurityAlertResponse = useSelector(
    (state: SecurityAlertResponsesState) =>
      state.metamask.transactions.find(
        (transaction) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (transaction.securityAlertResponse as any)?.securityAlertId ===
          securityAlertId,
      )?.securityAlertResponse,
  );

  const securityAlertResponse =
    signatureSecurityAlertResponse || transactionSecurityAlertResponse;

  const isTransactionTypeSupported =
    SUPPORTED_TRANSACTION_TYPES.includes(transactionType);

  const isResultTypeIgnored = IGNORED_RESULT_TYPES.includes(
    securityAlertResponse?.result_type as BlockaidResultType,
  );

  return useMemo<Alert[]>(() => {
    if (
      !isTransactionTypeSupported ||
      isResultTypeIgnored ||
      !securityAlertResponse
    ) {
      return [];
    }

    return [normalizeProviderAlert(securityAlertResponse, t)];
  }, [
    isTransactionTypeSupported,
    isResultTypeIgnored,
    securityAlertResponse,
    t,
  ]);
};

export default useBlockaidAlerts;
