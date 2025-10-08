import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { SecurityAlertResponse } from '../types/confirm';
import { useSignatureRequest } from './signatures/useSignatureRequest';

type SecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
    transactions: TransactionMeta[];
  };
};

const useCurrentSignatureSecurityAlertResponse = ():
  | SecurityAlertResponse
  | undefined => {
  const currentConfirmation = useSignatureRequest();

  const securityAlertId =
    currentConfirmation?.securityAlertResponse?.securityAlertId;

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
