import React from 'react';
import WalletReady from './wallet-ready';

export default {
  title: 'Pages/OnboardingFlow/WalletReady',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <WalletReady />
    </div>
  );
};

DefaultStory.storyName = 'Default';
