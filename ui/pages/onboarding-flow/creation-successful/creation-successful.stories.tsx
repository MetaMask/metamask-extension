import React from 'react';
import RiveWasmProvider from '../../../contexts/rive-wasm';
import CreationSuccessful from './creation-successful';
import './index.scss';

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
