import { useSelector } from 'react-redux';
import { SecurityAlertResponse } from '../types/confirm';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

/**
 * @param securityAlertId
 * @deprecated This file should be deprecated when we introduce the alerts system logic
 * @see {@link https://github.com/MetaMask/MetaMask-planning/issues/2412}
 */
function useSignatureSecurityAlertResponse(securityAlertId?: string) {
  const signatureSecurityAlertResponses = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses,
  );

  return securityAlertId
    ? signatureSecurityAlertResponses?.[securityAlertId]
    : null;
}

export default useSignatureSecurityAlertResponse;
