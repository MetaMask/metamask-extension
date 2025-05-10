import React from 'react';
import AccountExist from './account-exist';

export default {
  title: 'Pages/OnboardingFlow/AccountExist',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <AccountExist />
    </div>
  );
};

DefaultStory.storyName = 'Default';
