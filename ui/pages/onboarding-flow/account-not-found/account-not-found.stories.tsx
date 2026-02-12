import React from 'react';
import AccountNotFound from './account-not-found';

export default {
  title: 'Pages/OnboardingFlow/AccountNotFound',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <AccountNotFound />
    </div>
  );
};

DefaultStory.storyName = 'Default';
