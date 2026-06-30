import React from 'react';
import { BridgeCTAButton } from './bridge-cta-button';
import { BridgeCTAInfoText } from './bridge-cta-info-text';
import { BridgeNoFeeMessage } from './bridge-no-fee-message';
import { BridgeDiscountFeeMessage } from './bridge-discount-fee-message';

export const PrepareBridgePageFooter = (
  props: React.ComponentProps<typeof BridgeCTAButton>,
) => {
  return (
    <div
      style={{
        display: 'contents',
      }}
    >
      <BridgeCTAButton {...props} />
      <BridgeDiscountFeeMessage />
      <BridgeCTAInfoText />
      <BridgeNoFeeMessage />
    </div>
  );
};
