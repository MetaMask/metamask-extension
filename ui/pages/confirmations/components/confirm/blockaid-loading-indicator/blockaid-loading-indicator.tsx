import React from 'react';
import { useSelector } from 'react-redux';

import Preloader from '../../../../../components/ui/icon/preloader';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { Box } from '../../../../../components/component-library';

import useCurrentConfirmation from '../../../hooks/useCurrentConfirmation';
import { SecurityAlertResponse } from '../../../types/confirm';

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

const BlockaidLoadingIndicator = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  const securityAlertResponse =
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse;

  const signatureSecurityAlertResponse = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses?.[
        securityAlertResponse?.securityAlertId as string
      ],
  );

  if (
    signatureSecurityAlertResponse?.result_type === BlockaidResultType.Loading
  ) {
    return (
      <Box marginInline={'auto'} marginTop={4}>
        <Preloader size={18} />
      </Box>
    );
  }

  return null;
};

export default BlockaidLoadingIndicator;
