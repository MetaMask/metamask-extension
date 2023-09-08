import React from 'react';
import OnboardingSuccessful from './onboarding-successful';

export default {
  title: 'Pages/OnboardingFlow/OnboardingSuccessful',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <OnboardingSuccessful />
    </div>
  );
};

DefaultStory.storyName = 'Default';
