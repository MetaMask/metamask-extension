import React from 'react';

import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';

const LowPriorityMessage = () => {
  const { estimateToUse } = useGasFeeContext();
  const t = useI18nContext();

  if (estimateToUse !== 'low') return null;
  return (
    <div className="low-priority-message">
      <ActionableMessage
        className="actionable-message--warning"
        message={t('lowPriorityMessage')}
        useIcon
        iconFillColor="#f8c000"
      />
    </div>
  );
};

export default LowPriorityMessage;
