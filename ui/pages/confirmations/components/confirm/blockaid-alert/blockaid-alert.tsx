import React from 'react';
import { useSelector } from 'react-redux';

import {
  currentConfirmationSelector,
} from '../../../../../selectors';
import { SecurityAlertResponse } from '../../../types/confirm';
import BlockaidBannerAlert from '../../security-provider-banner-alert/blockaid-banner-alert';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: SecurityAlertResponse[]
  }
}

// todo: this component can be deleted once new alert imlementation is added
const BlockaidAlert = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const signatureSecurityAlertResponses = useSelector(
    (state: SignatureSecurityAlertResponsesState) => state.metamask.signatureSecurityAlertResponses
  );

  if (!currentConfirmation?.securityAlertResponse?.securityAlertId) {
    return null;
  }

  return (
    <BlockaidBannerAlert
      txData={{
        ...currentConfirmation,
        securityAlertResponse:
          signatureSecurityAlertResponses?.[
            currentConfirmation?.securityAlertResponse?.securityAlertId as any
          ],
      }}
    />
  );
};

export default BlockaidAlert;
