import { useSelector } from 'react-redux';
import { SecurityAlertResponse } from '../types/confirm';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

function useSignatureSecurityAlertResponse(securityAlertId?: string) {
  const signatureSecurityAlertResponses = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses,
  );

  return securityAlertId ? signatureSecurityAlertResponses?.[securityAlertId] : null;
}

export default useSignatureSecurityAlertResponse;
