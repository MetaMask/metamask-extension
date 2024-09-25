import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import OnboardingSuccessful from './onboarding-successful';

export default {
  title: 'Pages/Institutional/OnboardingSuccessful',
  component: OnboardingSuccessful,
} as Meta;

const Template: StoryFn = () => (
  <div style={{ maxHeight: '2000px' }}>
    <OnboardingSuccessful />
  </div>
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
