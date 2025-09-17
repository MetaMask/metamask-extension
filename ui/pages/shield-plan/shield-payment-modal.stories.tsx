import React from 'react';
import { ShieldPaymentModal } from './shield-payment-modal';
import { PAYMENT_TYPES } from '@metamask/subscription-controller';
export default {
  title: 'Components/UI/ShieldPlan/ShieldPaymentModal',
  component: ShieldPaymentModal,
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <ShieldPaymentModal
        isOpen
        onClose={() => {}}
        selectedPaymentMethod={PAYMENT_TYPES.byCrypto}
        setSelectedPaymentMethod={() => {}}
        selectedToken={undefined}
        onAssetChange={() => {}}
        hasStableTokenWithBalance={true}
        availableTokenBalances={[]}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
