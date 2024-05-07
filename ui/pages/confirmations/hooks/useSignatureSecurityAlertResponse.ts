import { useSelector } from 'react-redux';
import { SecurityAlertResponse } from '../types/confirm';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

function useSignatureSecurityAlertResponse(securityAlertId?: string) {
  if (!securityAlertId) { return; }

  const signatureSecurityAlertResponses = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses,
  );

  return signatureSecurityAlertResponses?.[securityAlertId];
}

export default useSignatureSecurityAlertResponse;
