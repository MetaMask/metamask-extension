import React from 'react';
import { ShieldPaymentModal } from './shield-payment-modal';

export default {
  title: 'Components/UI/ShieldPlan/ShieldPaymentModal',
  component: ShieldPaymentModal,
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <ShieldPaymentModal onClose={() => {}} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
