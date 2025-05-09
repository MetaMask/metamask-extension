import React from 'react';
import PasswordHint from './password-hint';

export default {
  title: 'Pages/OnboardingFlow/PasswordHint',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <PasswordHint />
    </div>
  );
};

DefaultStory.storyName = 'Default';
