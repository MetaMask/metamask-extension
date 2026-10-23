import React from 'react';
import CreationSuccessful from './creation-successful';

export default {
  title: 'Pages/OnboardingFlow/CreationSuccessful',
};

export const DefaultStory = () => {
  return (
    <div style={{ height: '640px', width: '360px' }}>
      <CreationSuccessful />
    </div>
  );
};

DefaultStory.storyName = 'Default';
