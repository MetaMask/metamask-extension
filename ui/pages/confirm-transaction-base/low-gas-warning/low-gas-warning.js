import React from 'react';

import { COLORS } from '../../../helpers/constants/design-system';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';

const LowGasWarning = () => {
  const { estimateToUse } = useGasFeeContext();
  const t = useI18nContext();

  if (estimateToUse !== 'low') return null;
  return (
    <div className="low-gas-warning">
      <ActionableMessage
        className="actionable-message--warning"
        message={t('lowGasWarning')}
        useIcon
        iconFillColor={COLORS.ALERT3}
      />
    </div>
  );
};

export default LowGasWarning;
