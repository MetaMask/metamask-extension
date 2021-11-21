import React from 'react';
import SecureYourWallet from './secure-your-wallet';

export default {
  title: 'Onboarding - Secure Your Wallet',
  id: __filename,
};

export const Base = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SecureYourWallet />
    </div>
  );
};
