import React from 'react';
import PrivacySettings from './privacy-settings';

export default {
  title: 'Pages/OnboardingFlow/PrivacySettings',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <PrivacySettings />
    </div>
  );
};

DefaultStory.storyName = 'Default';
