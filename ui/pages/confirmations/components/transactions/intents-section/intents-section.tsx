import React, { memo } from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { useSelector } from 'react-redux';
import { selectConfirmationAdvancedDetailsOpen } from '../../../selectors/preferences';
import { IntentsTargetRow } from '../intents-target-row/intents-target-row';
import { IntentsSourceRow } from '../intents-source-row/intents-source-row';
import { IntentsFeeRow } from '../intents-fee-row/intents-fee-row';
import { IntentsNetworkFeeRow } from '../intents-network-fee-row/intents-network-fee-row';

export const IntentsSection = memo(function IntentsSection() {
  const isAdvanced = useSelector(selectConfirmationAdvancedDetailsOpen);

  return (
    <ConfirmInfoSection>
      <IntentsSourceRow />
      {isAdvanced && <IntentsTargetRow />}
      {isAdvanced && <IntentsFeeRow />}
      {isAdvanced && <IntentsNetworkFeeRow />}
    </ConfirmInfoSection>
  );
});
