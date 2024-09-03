import React from 'react';
import { useSelector } from 'react-redux';

import Preloader from '../../../../../components/ui/icon/preloader';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { Box } from '../../../../../components/component-library';

import { currentSignatureRequestSecurityResponseSelector } from '../../../selectors';

const BlockaidLoadingIndicator = () => {
  const signatureSecurityAlertResponse = useSelector(
    currentSignatureRequestSecurityResponseSelector,
  );

  if (
    signatureSecurityAlertResponse?.result_type !== BlockaidResultType.Loading
  ) {
    return null;
  }

  return (
    <Box marginInline={'auto'} marginTop={4}>
      <Preloader size={18} />
    </Box>
  );
};

export default BlockaidLoadingIndicator;
