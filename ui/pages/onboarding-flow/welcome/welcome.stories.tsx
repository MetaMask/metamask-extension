import React from 'react';
import RiveWasmProvider from '../../../contexts/rive-wasm';
import OnboardingWelcome from './welcome';

export default {
  title: 'Pages/OnboardingFlow/Welcome',
};

export const DefaultStory = (args) => (
  <RiveWasmProvider>
    <OnboardingWelcome {...args} />
  </RiveWasmProvider>
);

DefaultStory.storyName = 'Default';
