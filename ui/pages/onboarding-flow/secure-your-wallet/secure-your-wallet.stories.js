import React from 'react';
import SecureYourWallet from './secure-your-wallet';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SecureYourWallet />
    </div>
  );
};

DefaultStory.storyName = 'Default';
