import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSignatureSecurityAlertResponse from '../../../hooks/useSignatureSecurityAlertResponse';
import { currentConfirmationSelector } from '../../../selectors';
import { SecurityAlertResponse } from '../../../types/confirm';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';

const useIsDangerButton = () => {
  const [isDangerButton, setIsDangerButton] = useState(false);

  const currentConfirmation = useSelector(currentConfirmationSelector);

  const currentSecurityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId;

  const signatureSecurityAlertResponse = useSignatureSecurityAlertResponse(
    currentSecurityAlertId,
  );

  useEffect(() => {
    setIsDangerButton(
      signatureSecurityAlertResponse?.result_type === BlockaidResultType.Malicious
    );
  }, [signatureSecurityAlertResponse?.result_type]);

  return isDangerButton;
}

export default useIsDangerButton;