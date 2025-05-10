import React from 'react';
import AccountNotFound from './account-not-found';

export default {
  title: 'Pages/OnboardingFlow/AccountNotFound',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <AccountNotFound />
    </div>
  );
};

DefaultStory.storyName = 'Default';
