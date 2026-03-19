import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { SecurityAlertResponse } from '../types/confirm';
import { useSignatureRequestOptional } from './useSignatureRequest';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';

type SecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
    transactions: TransactionMeta[];
  };
};

const useCurrentSignatureSecurityAlertResponse = ():
  | SecurityAlertResponse
  | undefined => {
  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;

  const securityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId as string;

  const signatureSecurityAlertResponse = useSelector(
    (state: SecurityAlertResponsesState) => {
      if (securityAlertId === undefined) {
        return undefined;
      }
      return state.metamask.signatureSecurityAlertResponses?.[
        securityAlertId as string
      ];
    },
  );

  return signatureSecurityAlertResponse;
};

export default useCurrentSignatureSecurityAlertResponse;
