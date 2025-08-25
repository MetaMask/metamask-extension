import React from 'react';
import AccountExist from './account-exist';

export default {
  title: 'Pages/OnboardingFlow/AccountExist',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <AccountExist />
    </div>
  );
};

DefaultStory.storyName = 'Default';
