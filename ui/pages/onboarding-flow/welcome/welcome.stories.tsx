import React from 'react';
import Welcome from './welcome';

export default {
  title: 'Pages/OnboardingFlow/Welcome',
};

export const DefaultStory = (args) => <Welcome {...args} />;

DefaultStory.storyName = 'Default';
