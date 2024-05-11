import { useSelector } from 'react-redux';
import useSignatureSecurityAlertResponse from '../../../hooks/useSignatureSecurityAlertResponse';
import { currentConfirmationSelector } from '../../../selectors';
import { SecurityAlertResponse } from '../../../types/confirm';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';

const useIsDangerButton = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const currentSecurityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId;

  const signatureSecurityAlertResponse = useSignatureSecurityAlertResponse(
    currentSecurityAlertId,
  );

  return (
    signatureSecurityAlertResponse?.result_type === BlockaidResultType.Malicious
  );
};

export default useIsDangerButton;
