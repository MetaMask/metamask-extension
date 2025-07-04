import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import { IntentsTargetRow } from '../intents-target-row/intents-target-row';
import { IntentsSourceRow } from '../intents-source-row/intents-source-row';
import { IntentsFeeRow } from '../intents-fee-row/intents-fee-row';
import { IntentsNetworkFeeRow } from '../intents-network-fee-row/intents-network-fee-row';
import { useIntentsTargets } from '../../../hooks/transactions/useIntentsTargets';

export const IntentsSection = memo(function IntentsSection() {
  const isAdvanced = useSelector(selectConfirmationAdvancedDetailsOpen);
  const targets = useIntentsTargets();

  if (!targets?.length) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <IntentsSourceRow />
      {isAdvanced && <IntentsTargetRow />}
      {isAdvanced && <IntentsFeeRow />}
      {isAdvanced && <IntentsNetworkFeeRow />}
    </ConfirmInfoSection>
  );
});
