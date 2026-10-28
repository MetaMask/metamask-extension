import React from 'react';
import RiveWasmProvider from '../../../contexts/rive-wasm';
import CreationSuccessful from './creation-successful';

export default {
  title: 'Pages/OnboardingFlow/CreationSuccessful',
};

export const DefaultStory = () => {
  return (
    <RiveWasmProvider>
      <CreationSuccessful />
    </RiveWasmProvider>
  );
};

DefaultStory.storyName = 'Default';
