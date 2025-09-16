import React from 'react';
import { ShieldPaymentModal } from './shield-payment-modal';
import { PAYMENT_METHODS } from './types';

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
        selectedPaymentMethod={PAYMENT_METHODS.TOKEN}
        setSelectedPaymentMethod={() => {}}
        selectedToken={undefined}
        onAssetChange={() => {}}
        hasStableTokenWithBalance={true}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
