import React from 'react';

import { useGasFeeContext } from '../../../contexts/gasFee';

import Box from '../../../components/ui/box';
import I18nValue from '../../../components/ui/i18n-value';
import Typography from '../../../components/ui/typography/typography';

const LowGasWarning = () => {
  const { estimateToUse } = useGasFeeContext();

  if (estimateToUse !== 'low') return null;
  return (
    <Box className="low-gas-warning">
      <i className="fa fa-exclamation-circle low-gas-warning__alert-icon"></i>
      <Typography margin={[0, 0]}>
        <I18nValue messageKey="lowGasWarning" />
      </Typography>
    </Box>
  );
};

export default LowGasWarning;
