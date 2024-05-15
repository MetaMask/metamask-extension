import React from 'react';
import { useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../../../../../selectors';
import useSignatureSecurityAlertResponse from '../../../hooks/useSignatureSecurityAlertResponse';
import { SignatureRequestType } from '../../../types/confirm';
import BlockaidBannerAlert from '../../security-provider-banner-alert/blockaid-banner-alert';

// todo: this component can be deleted once new alert imlementation is added
const BlockaidAlert = ({ ...props }) => {
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  const currentSecurityAlertId =
    currentConfirmation?.securityAlertResponse?.securityAlertId;
  const signatureSecurityAlertResponse = useSignatureSecurityAlertResponse(
    currentSecurityAlertId,
  );

  if (!currentSecurityAlertId) {
    return null;
  }

  return (
    <BlockaidBannerAlert
      txData={{
        ...currentConfirmation,
        securityAlertResponse: signatureSecurityAlertResponse,
      }}
      {...props}
    />
  );
};

export default BlockaidAlert;
