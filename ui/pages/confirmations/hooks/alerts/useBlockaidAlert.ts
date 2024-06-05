import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SecurityAlertResponse } from '../../types/confirm';
import {
  REDESIGN_TRANSACTION_TYPES,
  SIGNATURE_TRANSACTION_TYPES,
} from '../../utils';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { normalizeProviderAlert } from './utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

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

  const { currentConfirmation } = useCurrentConfirmation() as {
    currentConfirmation: Record<string, any>;
  };

  const securityAlertId = currentConfirmation?.securityAlertResponse
    ?.securityAlertId as string;

  const transactionType = currentConfirmation?.type as TransactionType;

  const signatureSecurityAlertResponse = useSelector(
    (state: SecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses?.[securityAlertId],
  );

  const transactionSecurityAlertResponse = useSelector(
    (state: SecurityAlertResponsesState) =>
      state.metamask.transactions.find(
        (transaction) =>
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
