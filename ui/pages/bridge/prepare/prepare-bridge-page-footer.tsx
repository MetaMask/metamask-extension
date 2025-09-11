import React from 'react';
import { BridgeCTAButton } from './bridge-cta-button';
import { BridgeCTAInfoText } from './bridge-cta-info-text';

export const PrepareBridgePageFooterContents = (
  props: React.ComponentProps<typeof BridgeCTAButton>,
) => {
  return (
    <div style={{ display: 'contents' }}>
      <BridgeCTAInfoText />
      <BridgeCTAButton {...props} />
    </div>
  );
};
